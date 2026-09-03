const assert = require('assert');
const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
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
  console.log('Starting integration test suite...');

  // 1. Get Courses
  const coursesRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/courses',
    method: 'GET'
  });
  assert.strictEqual(coursesRes.status, 200, 'GET /api/courses should return 200');
  assert(Array.isArray(coursesRes.body), 'Courses response should be an array');
  assert(coursesRes.body.length >= 18, 'Courses array should have at least 18 items');
  console.log('✓ GET /api/courses passed');

  // 2. Submit Contact Form
  const contactRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/contact',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    message: 'Hello Tutorify test'
  });
  assert.strictEqual(contactRes.status, 201, 'POST /api/contact should return 201');
  assert.strictEqual(contactRes.body.message, 'Message submitted successfully');
  console.log('✓ POST /api/contact passed');

  // 3. User Registration
  const testEmail = `user_${Date.now()}@test.com`;
  const regRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'New Test User',
    email: testEmail,
    password: 'password123'
  });
  assert.strictEqual(regRes.status, 201, 'POST /api/register should return 201');
  console.log('✓ POST /api/register passed');

  // 4. Admin Login
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'admin@tutorify.com',
    password: 'password123',
    role: 'admin'
  });
  assert.strictEqual(loginRes.status, 200, 'POST /api/login should return 200');
  assert(loginRes.body.token, 'Login should return JWT token');
  console.log('✓ POST /api/login passed');

  // 5. Admin Stats Endpoint
  const statsRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${loginRes.body.token}` }
  });
  assert.strictEqual(statsRes.status, 200, 'GET /api/stats with token should return 200');
  assert(typeof statsRes.body.views === 'number', 'Stats should contain views number');
  console.log('✓ GET /api/stats passed');

  console.log('All tests passed successfully!');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
