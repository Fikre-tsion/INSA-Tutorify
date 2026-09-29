const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');

const PORT = 3001;
process.env.PORT = PORT;
process.env.JWT_SECRET = 'test_jwt_secret_123';

function request(method, path, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : '';
        const req = http.request({
            hostname: 'localhost',
            port: PORT,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('Starting server process for testing...');
    const serverProcess = spawn('node', ['server.js'], {
        env: { ...process.env, PORT },
        stdio: 'ignore'
    });

    // Wait for server startup
    await new Promise(r => setTimeout(r, 1200));

    try {
        const testEmail = `testuser_${Date.now()}@example.com`;

        console.log('Test 1: User Registration');
        const regRes = await request('POST', '/api/register', {
            name: 'Test User',
            email: testEmail,
            password: 'password123',
            role: 'admin' // Attempting privilege escalation
        });
        assert.strictEqual(regRes.status, 201, 'Registration status should be 201');

        console.log('Test 2: User Login & Role Hardcoding Verification');
        const loginRes = await request('POST', '/api/login', {
            email: testEmail,
            password: 'password123'
        });
        assert.strictEqual(loginRes.status, 200, 'Login status should be 200');
        assert.ok(loginRes.data.token, 'Token should be returned');
        assert.strictEqual(loginRes.data.user.role, 'user', 'Role must be hardcoded to "user"');
        const userToken = loginRes.data.token;

        console.log('Test 3: Admin Login');
        const adminLoginRes = await request('POST', '/api/login', {
            email: 'admin@tutorify.com',
            password: 'admin123'
        });
        assert.strictEqual(adminLoginRes.status, 200, 'Admin login status should be 200');
        assert.strictEqual(adminLoginRes.data.user.role, 'admin', 'Admin role should be "admin"');
        const adminToken = adminLoginRes.data.token;

        console.log('Test 4: GET /api/courses');
        const coursesRes = await request('GET', '/api/courses');
        assert.strictEqual(coursesRes.status, 200, 'Courses status should be 200');
        assert.ok(Array.isArray(coursesRes.data), 'Courses response should be an array');
        assert.ok(coursesRes.data.length >= 1, 'Should have initial courses');

        console.log('Test 5: POST /api/contact');
        const contactRes = await request('POST', '/api/contact', {
            firstName: 'Alice',
            lastName: 'Smith',
            email: 'alice@example.com',
            message: 'Hello, Tutorify team!'
        });
        assert.strictEqual(contactRes.status, 201, 'Contact status should be 201');

        console.log('Test 6: GET /api/stats (Auth Checks)');
        const noAuthStats = await request('GET', '/api/stats');
        assert.strictEqual(noAuthStats.status, 401, 'No auth should return 401');

        const userAuthStats = await request('GET', '/api/stats', null, {
            'Authorization': `Bearer ${userToken}`
        });
        assert.strictEqual(userAuthStats.status, 403, 'Regular user should return 403');

        const adminAuthStats = await request('GET', '/api/stats', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        assert.strictEqual(adminAuthStats.status, 200, 'Admin auth should return 200');
        assert.ok(adminAuthStats.data.totalCourses >= 1, 'Stats totalCourses should be present');

        console.log('Test 7: POST /api/stats/view');
        const pageViewRes = await request('POST', '/api/stats/view');
        assert.strictEqual(pageViewRes.status, 200, 'Stats view status should be 200');
        assert.ok(typeof pageViewRes.data.pageViews === 'number', 'pageViews should be a number');

        console.log('\nAll 7 test suites passed successfully! 🎉');
    } catch (err) {
        console.error('Test suite failed:', err);
        process.exitCode = 1;
    } finally {
        serverProcess.kill();
    }
}

runTests();
