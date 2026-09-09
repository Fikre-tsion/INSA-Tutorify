const http = require('http');
const assert = require('assert');

// Start backend server on random port for testing
process.env.PORT = '3099';
require('./server.js');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Starting integration tests...');
  // Wait 1 second for server to initialize and seed DB
  await new Promise(r => setTimeout(r, 1000));

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // 1. Test Registration
  console.log('Testing POST /api/register...');
  const regRes = await makeRequest({
    hostname: 'localhost',
    port: 3099,
    path: '/api/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Integration Tester', email: testEmail, password: testPassword, role: 'user' });

  assert.strictEqual(regRes.status, 201, `Registration failed: ${JSON.stringify(regRes.body)}`);
  console.log('✓ Registration successful');

  // 2. Test User Login
  console.log('Testing POST /api/login (User)...');
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 3099,
    path: '/api/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: testPassword, role: 'user' });

  assert.strictEqual(loginRes.status, 200, `Login failed: ${JSON.stringify(loginRes.body)}`);
  assert.ok(loginRes.body.token, 'Token missing in login response');
  console.log('✓ User Login successful');

  // 3. Test Admin Login
  console.log('Testing POST /api/login (Admin)...');
  const adminLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 3099,
    path: '/api/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@tutorify.com', password: 'password123', role: 'admin' });

  assert.strictEqual(adminLoginRes.status, 200, `Admin login failed: ${JSON.stringify(adminLoginRes.body)}`);
  const adminToken = adminLoginRes.body.token;
  assert.ok(adminToken, 'Admin token missing');
  console.log('✓ Admin Login successful');

  // 4. Test Get Courses
  console.log('Testing GET /api/courses...');
  const coursesRes = await makeRequest({
    hostname: 'localhost',
    port: 3099,
    path: '/api/courses',
    method: 'GET'
  });

  assert.strictEqual(coursesRes.status, 200, 'Get courses failed');
  assert.ok(Array.isArray(coursesRes.body), 'Courses response should be an array');
  assert.ok(coursesRes.body.length > 0, 'Courses array should not be empty');
  console.log(`✓ Fetched ${coursesRes.body.length} courses successfully`);

  // 5. Test Contact Submission
  console.log('Testing POST /api/contact...');
  const contactRes = await makeRequest({
    hostname: 'localhost',
    port: 3099,
    path: '/api/contact',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'janedoe@example.com',
    message: 'I am interested in tutoring sessions.'
  });

  assert.strictEqual(contactRes.status, 201, `Contact submission failed: ${JSON.stringify(contactRes.body)}`);
  console.log('✓ Contact form submission successful');

  // 6. Test Admin Stats
  console.log('Testing GET /api/stats (Admin Authenticated)...');
  const statsRes = await makeRequest({
    hostname: 'localhost',
    port: 3099,
    path: '/api/stats',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  assert.strictEqual(statsRes.status, 200, `Fetch stats failed: ${JSON.stringify(statsRes.body)}`);
  assert.ok(statsRes.body.stats, 'Stats payload missing');
  console.log('✓ Admin stats fetched successfully');

  // 7. Test Page View Metric
  console.log('Testing POST /api/stats/view...');
  const viewRes = await makeRequest({
    hostname: 'localhost',
    port: 3099,
    path: '/api/stats/view',
    method: 'POST'
  });

  assert.strictEqual(viewRes.status, 200, 'Record page view failed');
  assert.strictEqual(viewRes.body.success, true, 'Success flag should be true');
  console.log('✓ Page view recorded successfully');

  console.log('\nAll integration tests passed successfully! 🎉');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
