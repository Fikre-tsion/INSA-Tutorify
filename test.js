const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');

let serverProcess;
const PORT = 3001;

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('Starting server for integration testing...');
  serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: PORT.toString() },
    stdio: 'inherit'
  });

  // Give server time to initialize
  await new Promise(r => setTimeout(r, 1500));

  try {
    console.log('Testing GET /api/courses...');
    const coursesRes = await request('GET', '/api/courses');
    assert.strictEqual(coursesRes.status, 200);
    assert(Array.isArray(coursesRes.body.courses));
    assert(coursesRes.body.courses.length > 0);
    console.log('✓ GET /api/courses passed');

    console.log('Testing POST /api/stats/view...');
    const viewRes = await request('POST', '/api/stats/view');
    assert.strictEqual(viewRes.status, 200);
    assert(typeof viewRes.body.views === 'number');
    console.log('✓ POST /api/stats/view passed');

    const testEmail = `testuser_${Date.now()}@example.com`;
    console.log('Testing POST /api/register...');
    const regRes = await request('POST', '/api/register', {
      name: 'Test Student',
      email: testEmail,
      password: 'password123',
      role: 'user'
    });
    assert.strictEqual(regRes.status, 201);
    console.log('✓ POST /api/register passed');

    console.log('Testing POST /api/login (User)...');
    const loginRes = await request('POST', '/api/login', {
      email: testEmail,
      password: 'password123',
      role: 'user'
    });
    assert.strictEqual(loginRes.status, 200);
    assert(loginRes.body.token);
    assert.strictEqual(loginRes.body.user.email, testEmail);
    console.log('✓ POST /api/login (User) passed');

    console.log('Testing POST /api/login (Admin)...');
    const adminLoginRes = await request('POST', '/api/login', {
      email: 'admin@tutorify.com',
      password: 'admin123',
      role: 'admin'
    });
    assert.strictEqual(adminLoginRes.status, 200);
    assert(adminLoginRes.body.token);
    const adminToken = adminLoginRes.body.token;
    console.log('✓ POST /api/login (Admin) passed');

    console.log('Testing GET /api/stats without auth...');
    const unauthStatsRes = await request('GET', '/api/stats');
    assert.strictEqual(unauthStatsRes.status, 401);
    console.log('✓ GET /api/stats (Unauthenticated) passed');

    console.log('Testing GET /api/stats with admin auth...');
    const statsRes = await request('GET', '/api/stats', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(statsRes.status, 200);
    assert(statsRes.body.stats);
    console.log('✓ GET /api/stats (Authenticated Admin) passed');

    console.log('Testing POST /api/contact...');
    const contactRes = await request('POST', '/api/contact', {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      message: 'Hello Tutorify, I love this platform!'
    });
    assert.strictEqual(contactRes.status, 200);
    console.log('✓ POST /api/contact passed');

    console.log('\nAll integration tests passed successfully!');
  } catch (err) {
    console.error('Integration test failure:', err);
    process.exitCode = 1;
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

runTests();
