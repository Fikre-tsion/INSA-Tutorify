const http = require('http');
const assert = require('assert');
const app = require('./server');

function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Running integration tests...');

    const port = 3001;
    const server = app.listen(port, async () => {
        try {
            // Test 1: Register User
            console.log('Test 1: POST /api/register');
            const testEmail = `test_${Date.now()}@example.com`;
            const regRes = await request({
                hostname: 'localhost',
                port,
                path: '/api/register',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { name: 'Test User', email: testEmail, password: 'password123' });

            assert.strictEqual(regRes.status, 201, 'Registration should return 201');
            assert.strictEqual(regRes.body.user.role, 'user', 'Role should be enforced as user');

            // Test 2: Login User
            console.log('Test 2: POST /api/login');
            const loginRes = await request({
                hostname: 'localhost',
                port,
                path: '/api/login',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { email: testEmail, password: 'password123', role: 'user' });

            assert.strictEqual(loginRes.status, 200, 'User login should return 200');
            assert.ok(loginRes.body.token, 'Should return JWT token');

            // Test 3: Login Admin
            console.log('Test 3: POST /api/login (Admin)');
            const adminLoginRes = await request({
                hostname: 'localhost',
                port,
                path: '/api/login',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { email: 'admin@tutorify.com', password: 'password123', role: 'admin' });

            assert.strictEqual(adminLoginRes.status, 200, 'Admin login should return 200');
            assert.ok(adminLoginRes.body.token, 'Should return admin token');
            const adminToken = adminLoginRes.body.token;

            // Test 4: Get Courses
            console.log('Test 4: GET /api/courses');
            const coursesRes = await request({
                hostname: 'localhost',
                port,
                path: '/api/courses',
                method: 'GET'
            });

            assert.strictEqual(coursesRes.status, 200, 'GET /api/courses should return 200');
            assert.ok(Array.isArray(coursesRes.body), 'Courses response should be an array');
            assert.ok(coursesRes.body.length > 0, 'Should return non-empty course list');

            // Test 5: Post Contact Message
            console.log('Test 5: POST /api/contact');
            const contactRes = await request({
                hostname: 'localhost',
                port,
                path: '/api/contact',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { name: 'Student Tester', email: 'student@example.com', message: 'Hello Tutorify!' });

            assert.strictEqual(contactRes.status, 201, 'POST /api/contact should return 201');

            // Test 6: Record Page View
            console.log('Test 6: POST /api/stats/view');
            const viewRes = await request({
                hostname: 'localhost',
                port,
                path: '/api/stats/view',
                method: 'POST'
            });

            assert.strictEqual(viewRes.status, 200, 'POST /api/stats/view should return 200');

            // Test 7: Get Admin Stats
            console.log('Test 7: GET /api/stats');
            const statsRes = await request({
                hostname: 'localhost',
                port,
                path: '/api/stats',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            assert.strictEqual(statsRes.status, 200, 'GET /api/stats should return 200');
            assert.ok(typeof statsRes.body.views === 'number', 'Stats should return view count');
            assert.ok(Array.isArray(statsRes.body.messages), 'Stats should include messages array');

            console.log('✅ All integration tests passed successfully!');
            server.close(() => process.exit(0));
        } catch (err) {
            console.error('❌ Test failed:', err);
            server.close(() => process.exit(1));
        }
    });
}

runTests();
