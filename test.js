const assert = require('assert');
const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
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
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('--- Running API Integration Tests ---');

  // Test GET /api/courses
  const coursesRes = await request('GET', '/api/courses');
  assert.strictEqual(coursesRes.status, 200, 'GET /api/courses should return 200');
  assert(Array.isArray(coursesRes.body), 'Courses response should be an array');
  assert(coursesRes.body.length > 0, 'Courses list should not be empty');
  console.log('✓ GET /api/courses passed');

  // Test POST /api/register
  const testEmail = `test_${Date.now()}@example.com`;
  const regRes = await request('POST', '/api/register', {
    name: 'Test Student',
    email: testEmail,
    password: 'password123'
  });
  assert.strictEqual(regRes.status, 201, 'POST /api/register should return 201');
  console.log('✓ POST /api/register passed');

  // Test POST /api/login
  const loginRes = await request('POST', '/api/login', {
    email: testEmail,
    password: 'password123',
    role: 'user'
  });
  assert.strictEqual(loginRes.status, 200, 'POST /api/login should return 200');
  assert(loginRes.body.token, 'Login response should contain JWT token');
  console.log('✓ POST /api/login passed');

  // Test Admin Login
  const adminLoginRes = await request('POST', '/api/login', {
    email: 'admin@tutorify.com',
    password: 'password123',
    role: 'admin'
  });
  assert.strictEqual(adminLoginRes.status, 200, 'Admin login should return 200');
  const adminToken = adminLoginRes.body.token;
  assert(adminToken, 'Admin login should return token');
  console.log('✓ Admin POST /api/login passed');

  // Test POST /api/contact
  const contactRes = await request('POST', '/api/contact', {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    message: 'Hello! I would like to learn web design.'
  });
  assert.strictEqual(contactRes.status, 201, 'POST /api/contact should return 201');
  console.log('✓ POST /api/contact passed');

  // Test POST /api/stats/view
  const viewRes = await request('POST', '/api/stats/view');
  assert.strictEqual(viewRes.status, 200, 'POST /api/stats/view should return 200');
  assert(typeof viewRes.body.profileViews === 'number', 'Profile views should be a number');
  console.log('✓ POST /api/stats/view passed');

  // Test GET /api/stats (Admin authenticated)
  const statsRes = await request('GET', '/api/stats', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  assert.strictEqual(statsRes.status, 200, 'GET /api/stats should return 200');
  assert(statsRes.body.stats, 'Stats response should include stats');
  assert(Array.isArray(statsRes.body.messages), 'Stats response should include messages');
  console.log('✓ GET /api/stats passed');

  console.log('--- ALL TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
