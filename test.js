const http = require('http');
const app = require('./server.js');

let server;
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

const runTests = async () => {
    console.log('🚀 Starting Integration Tests...');

    server = app.listen(PORT);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        // Test 1: GET /api/courses
        console.log('Testing GET /api/courses...');
        const coursesRes = await fetch(`${BASE_URL}/api/courses`);
        if (coursesRes.status !== 200) throw new Error(`Expected status 200, got ${coursesRes.status}`);
        const courses = await coursesRes.json();
        if (!Array.isArray(courses)) throw new Error('Expected courses to be an array');
        console.log(`✅ GET /api/courses passed (${courses.length} courses found)`);

        // Test 2: POST /api/register
        console.log('Testing POST /api/register...');
        const testUser = {
            name: "Test User",
            email: `test_${Date.now()}@example.com`,
            password: "password123",
            role: "user"
        };
        const regRes = await fetch(`${BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        if (regRes.status !== 201) throw new Error(`Registration failed with status ${regRes.status}`);
        console.log('✅ POST /api/register passed');

        // Test 3: POST /api/login (User)
        console.log('Testing POST /api/login...');
        const loginRes = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUser.email, password: testUser.password })
        });
        if (loginRes.status !== 200) throw new Error(`Login failed with status ${loginRes.status}`);
        const loginData = await loginRes.json();
        if (!loginData.token) throw new Error('Login response missing JWT token');
        console.log('✅ POST /api/login passed');

        // Test 4: POST /api/contact
        console.log('Testing POST /api/contact...');
        const contactRes = await fetch(`${BASE_URL}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: "Jane",
                lastName: "Doe",
                email: "jane@example.com",
                message: "Hello Tutorify team!"
            })
        });
        if (contactRes.status !== 201) throw new Error(`Contact submission failed with status ${contactRes.status}`);
        console.log('✅ POST /api/contact passed');

        // Test 5: POST /api/login (Admin)
        console.log('Testing Admin Login...');
        const adminLoginRes = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "admin@tutorify.com", password: "password123", role: "admin" })
        });
        if (adminLoginRes.status !== 200) throw new Error(`Admin login failed with status ${adminLoginRes.status}`);
        const adminData = await adminLoginRes.json();
        const adminToken = adminData.token;
        console.log('✅ Admin login passed');

        // Test 6: GET /api/admin/stats (Protected)
        console.log('Testing GET /api/admin/stats...');
        const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (statsRes.status !== 200) throw new Error(`Admin stats failed with status ${statsRes.status}`);
        const statsData = await statsRes.json();
        if (!statsData.stats || !statsData.tutors) throw new Error('Invalid stats payload response');
        console.log('✅ GET /api/admin/stats passed');

        // Test 7: POST /api/stats/view
        console.log('Testing POST /api/stats/view...');
        const viewRes = await fetch(`${BASE_URL}/api/stats/view`, { method: 'POST' });
        if (viewRes.status !== 200) throw new Error(`Stats view failed with status ${viewRes.status}`);
        console.log('✅ POST /api/stats/view passed');

        console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    } finally {
        if (server) server.close();
    }
};

runTests();
