const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Starting server for integration testing...');
  const serverProcess = spawn('node', ['server.js'], { stdio: 'inherit' });

  // Wait for server initialization
  await new Promise(r => setTimeout(r, 2000));

  try {
    console.log('Test 1: GET /api/courses');
    const coursesRes = await makeRequest('/api/courses');
    assert.strictEqual(coursesRes.status, 200);
    assert(Array.isArray(coursesRes.body));
    assert(coursesRes.body.length >= 18);
    console.log('✔ GET /api/courses passed');

    console.log('Test 2: POST /api/register');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await makeRequest('/api/register', {
      method: 'POST',
      body: { name: 'Test User', email: testEmail, password: 'password123', role: 'admin' }
    });
    assert.strictEqual(regRes.status, 201);
    console.log('✔ POST /api/register passed');

    console.log('Test 3: POST /api/login for newly registered user');
    const loginRes = await makeRequest('/api/login', {
      method: 'POST',
      body: { email: testEmail, password: 'password123' }
    });
    assert.strictEqual(loginRes.status, 200);
    assert(loginRes.body.token);
    assert.strictEqual(loginRes.body.user.role, 'user'); // Role must be forced to 'user'
    console.log('✔ POST /api/login user passed');

    console.log('Test 4: POST /api/login for seeded admin user');
    const adminLoginRes = await makeRequest('/api/login', {
      method: 'POST',
      body: { email: 'admin@tutorify.com', password: 'password123', role: 'admin' }
    });
    assert.strictEqual(adminLoginRes.status, 200);
    assert(adminLoginRes.body.token);
    assert.strictEqual(adminLoginRes.body.user.role, 'admin');
    const adminToken = adminLoginRes.body.token;
    console.log('✔ POST /api/login admin passed');

    console.log('Test 5: POST /api/contact');
    const contactRes = await makeRequest('/api/contact', {
      method: 'POST',
      body: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', message: 'Hello Tutorify!' }
    });
    assert.strictEqual(contactRes.status, 201);
    console.log('✔ POST /api/contact passed');

    console.log('Test 6: POST /api/stats/view');
    const viewRes = await makeRequest('/api/stats/view', { method: 'POST' });
    assert.strictEqual(viewRes.status, 200);
    assert(viewRes.body.success);
    console.log('✔ POST /api/stats/view passed');

    console.log('Test 7: GET /api/stats unauthorized check');
    const unauthStatsRes = await makeRequest('/api/stats');
    assert.strictEqual(unauthStatsRes.status, 401);
    console.log('✔ GET /api/stats 401 unauthorized passed');

    console.log('Test 8: GET /api/stats with admin token');
    const statsRes = await makeRequest('/api/stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(statsRes.status, 200);
    assert(typeof statsRes.body.pageViews === 'number');
    assert(Array.isArray(statsRes.body.messages));
    assert(Array.isArray(statsRes.body.recentUsers));
    console.log('✔ GET /api/stats admin passed');

    console.log('\n✅ ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ INTEGRATION TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    serverProcess.kill();
  }
}

runTests();
