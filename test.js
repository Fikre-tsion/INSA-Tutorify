const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('Running API integration tests...');

  // Start server
  require('./server.js');
  // Wait for server initialization and db read
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // 1. Test GET /api/courses
    const coursesRes = await fetch(`${BASE_URL}/api/courses`);
    assert.strictEqual(coursesRes.status, 200, 'GET /api/courses should return 200');
    const courses = await coursesRes.json();
    assert(Array.isArray(courses), 'Courses response should be an array');
    assert(courses.length > 0, 'Courses array should not be empty');
    console.log('✓ GET /api/courses passed');

    // 2. Test POST /api/stats/view
    const viewRes = await fetch(`${BASE_URL}/api/stats/view`, { method: 'POST' });
    assert.strictEqual(viewRes.status, 200, 'POST /api/stats/view should return 200');
    const viewData = await viewRes.json();
    assert(typeof viewData.views === 'number', 'Views count should be a number');
    console.log('✓ POST /api/stats/view passed');

    // 3. Test POST /api/register
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: testEmail, password: 'password123', role: 'admin' })
    });
    assert.strictEqual(regRes.status, 201, 'POST /api/register should return 201');
    console.log('✓ POST /api/register passed');

    // 4. Test POST /api/login for registered user
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123', role: 'user' })
    });
    assert.strictEqual(loginRes.status, 200, 'POST /api/login should return 200');
    const loginData = await loginRes.json();
    assert(loginData.token, 'Login should return a JWT token');
    assert.strictEqual(loginData.user.role, 'user', 'Role should be hardcoded to user');
    console.log('✓ POST /api/login passed');

    // 5. Test POST /api/login for default admin
    const adminLoginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@tutorify.com', password: 'admin123', role: 'admin' })
    });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login should return 200');
    const adminData = await adminLoginRes.json();
    assert(adminData.token, 'Admin login should return token');
    console.log('✓ Admin login passed');

    // 6. Test GET /api/stats with Admin Token
    const statsRes = await fetch(`${BASE_URL}/api/stats`, {
      headers: { 'Authorization': `Bearer ${adminData.token}` }
    });
    assert.strictEqual(statsRes.status, 200, 'GET /api/stats should return 200 for admin');
    const stats = await statsRes.json();
    assert(typeof stats.coursesCount === 'number', 'Stats should contain coursesCount');
    console.log('✓ GET /api/stats passed');

    // 7. Test POST /api/contact
    const contactRes = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', message: 'Hello Tutorify!' })
    });
    assert.strictEqual(contactRes.status, 201, 'POST /api/contact should return 201');
    console.log('✓ POST /api/contact passed');

    console.log('\nAll integration tests passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\nTest execution failed:', err);
    process.exit(1);
  }
}

runTests();
