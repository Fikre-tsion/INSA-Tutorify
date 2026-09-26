const assert = require('assert');
const { app, readDB } = require('./server');

async function runTests() {
    console.log('Starting API integration tests...');
    const PORT = 3002;
    const server = app.listen(PORT);

    try {
        // Test 1: GET /api/courses
        const coursesRes = await fetch(`http://localhost:${PORT}/api/courses`);
        assert.strictEqual(coursesRes.status, 200, 'GET /api/courses status should be 200');
        const courses = await coursesRes.json();
        assert(Array.isArray(courses), 'Courses response should be an array');
        assert(courses.length > 0, 'Courses array should not be empty');
        console.log('✓ GET /api/courses passed');

        // Test 2: POST /api/register
        const testUserEmail = `test_${Date.now()}@example.com`;
        const regRes = await fetch(`http://localhost:${PORT}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', email: testUserEmail, password: 'password123' })
        });
        assert.strictEqual(regRes.status, 201, 'POST /api/register status should be 201');
        console.log('✓ POST /api/register passed');

        // Test 3: POST /api/login
        const loginRes = await fetch(`http://localhost:${PORT}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUserEmail, password: 'password123', role: 'user' })
        });
        assert.strictEqual(loginRes.status, 200, 'POST /api/login status should be 200');
        const loginData = await loginRes.json();
        assert(loginData.token, 'Login should return JWT token');
        console.log('✓ POST /api/login passed');

        // Test 4: POST /api/contact
        const contactRes = await fetch(`http://localhost:${PORT}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: 'Test', lastName: 'Sender', email: 'test@example.com', message: 'Hello world' })
        });
        assert.strictEqual(contactRes.status, 201, 'POST /api/contact status should be 201');
        console.log('✓ POST /api/contact passed');

        // Test 5: Admin login and GET /api/stats
        const adminLoginRes = await fetch(`http://localhost:${PORT}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password123', role: 'admin' })
        });
        assert.strictEqual(adminLoginRes.status, 200, 'Admin login status should be 200');
        const adminData = await adminLoginRes.json();

        const statsRes = await fetch(`http://localhost:${PORT}/api/stats`, {
            headers: { 'Authorization': `Bearer ${adminData.token}` }
        });
        assert.strictEqual(statsRes.status, 200, 'GET /api/stats status should be 200');
        const statsData = await statsRes.json();
        assert(statsData.stats, 'Stats response should include stats object');
        console.log('✓ GET /api/stats passed');

        console.log('All tests passed successfully!');
    } catch (err) {
        console.error('Test failed:', err);
        process.exitCode = 1;
    } finally {
        server.close();
    }
}

runTests();
