const { spawn } = require('child_process');
const path = require('path');

const PORT = 3005;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess = null;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('Starting test server...');
    serverProcess = spawn('node', ['server.js'], {
        env: { ...process.env, PORT: PORT, JWT_SECRET: 'test_jwt_secret' },
        stdio: 'inherit'
    });

    await sleep(1500);

    let failed = false;
    const assert = (condition, message) => {
        if (!condition) {
            console.error(`❌ FAIL: ${message}`);
            failed = true;
        } else {
            console.log(`✅ PASS: ${message}`);
        }
    };

    try {
        // 1. Test Courses Endpoint
        const coursesRes = await fetch(`${BASE_URL}/api/courses`);
        assert(coursesRes.ok, 'GET /api/courses returns 200');
        const coursesData = await coursesRes.json();
        assert(Array.isArray(coursesData) && coursesData.length >= 18, 'GET /api/courses returns seeded courses array');

        // 2. Test Register Endpoint (Security check: hardcode user role)
        const testUser = {
            name: 'Test Student',
            email: `student_${Date.now()}@example.com`,
            password: 'password123',
            role: 'admin' // Attempt privilege escalation
        };
        const regRes = await fetch(`${BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        assert(regRes.status === 201, 'POST /api/register returns 201');

        // 3. Test Login Endpoint (for newly registered user with role 'user')
        const loginRes = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUser.email, password: testUser.password, role: 'user' })
        });
        assert(loginRes.ok, 'POST /api/login succeeds for user role');
        const loginData = await loginRes.json();
        assert(loginData.token && loginData.user.role === 'user', 'Registered user has role "user" (privilege escalation prevented)');

        // 4. Test Login as Admin (seeded admin)
        const adminLoginRes = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@tutorify.com', password: 'password123', role: 'admin' })
        });
        assert(adminLoginRes.ok, 'POST /api/login succeeds for seeded admin');
        const adminData = await adminLoginRes.json();
        assert(adminData.token && adminData.user.role === 'admin', 'Admin login returns token and admin role');

        // 5. Test Contact Endpoint
        const contactRes = await fetch(`${BASE_URL}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com',
                message: 'Hello, I have a question about courses.'
            })
        });
        assert(contactRes.status === 201, 'POST /api/contact returns 201');

        // 6. Test Stats View Tracking
        const viewRes = await fetch(`${BASE_URL}/api/stats/view`, { method: 'POST' });
        assert(viewRes.ok, 'POST /api/stats/view returns 200');

        // 7. Test Stats Protection
        const unauthorizedStatsRes = await fetch(`${BASE_URL}/api/stats`);
        assert(unauthorizedStatsRes.status === 401, 'GET /api/stats without token returns 401 Unauthorized');

        const authorizedStatsRes = await fetch(`${BASE_URL}/api/stats`, {
            headers: { 'Authorization': `Bearer ${adminData.token}` }
        });
        assert(authorizedStatsRes.ok, 'GET /api/stats with admin token returns 200');
        const statsData = await authorizedStatsRes.json();
        assert(statsData.stats && statsData.messagesCount >= 1, 'GET /api/stats returns stats and recorded message');

    } catch (err) {
        console.error('Error executing integration tests:', err);
        failed = true;
    } finally {
        if (serverProcess) {
            serverProcess.kill();
        }
        if (failed) {
            console.error('Integration tests FAILED');
            process.exit(1);
        } else {
            console.log('All integration tests PASSED successfully!');
            process.exit(0);
        }
    }
}

runTests();
