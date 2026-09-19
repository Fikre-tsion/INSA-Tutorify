const http = require('http');
const assert = require('assert');
const { app, server, readDB } = require('./server');

const request = (method, path, body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const port = server.address().port;
        const reqHeaders = { 'Content-Type': 'application/json', ...headers };
        const req = http.request({
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: reqHeaders
        }, (res) => {
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
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

async function runTests() {
    console.log('--- Starting Backend Integration Tests ---');
    try {
        await readDB();

        // Test 1: User Registration
        console.log('1. Testing POST /api/register...');
        const testEmail = `testuser_${Date.now()}@example.com`;
        const regRes = await request('POST', '/api/register', {
            name: 'Test Student',
            email: testEmail,
            password: 'password123'
        });
        assert.strictEqual(regRes.status, 201, 'Registration should return 201');
        assert.strictEqual(regRes.body.message, 'User registered successfully');

        // Test 2: User Login
        console.log('2. Testing POST /api/login...');
        const loginRes = await request('POST', '/api/login', {
            email: testEmail,
            password: 'password123',
            role: 'user'
        });
        assert.strictEqual(loginRes.status, 200, 'User login should return 200');
        assert.ok(loginRes.body.token, 'Login response should contain token');
        assert.strictEqual(loginRes.body.user.role, 'user');

        // Test 3: Admin Login
        console.log('3. Testing Admin Login...');
        const adminLoginRes = await request('POST', '/api/login', {
            email: 'admin@tutorify.com',
            password: 'password123',
            role: 'admin'
        });
        assert.strictEqual(adminLoginRes.status, 200, 'Admin login should return 200');
        assert.ok(adminLoginRes.body.token, 'Admin login should return token');
        const adminToken = adminLoginRes.body.token;

        // Test 4: Record Page View
        console.log('4. Testing POST /api/stats/view...');
        const viewRes = await request('POST', '/api/stats/view');
        assert.strictEqual(viewRes.status, 200);
        assert.strictEqual(viewRes.body.success, true);

        // Test 5: Fetch Courses
        console.log('5. Testing GET /api/courses...');
        const coursesRes = await request('GET', '/api/courses');
        assert.strictEqual(coursesRes.status, 200);
        assert.ok(Array.isArray(coursesRes.body.courses), 'Courses should be an array');
        assert.ok(coursesRes.body.courses.length > 0, 'Courses list should not be empty');

        // Test 6: Contact Form Submission
        console.log('6. Testing POST /api/contact...');
        const contactRes = await request('POST', '/api/contact', {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            message: 'Hello, I have a query about the Python course!'
        });
        assert.strictEqual(contactRes.status, 201);
        assert.strictEqual(contactRes.body.message, 'Message sent successfully');

        // Test 7: Admin Stats Endpoint Access
        console.log('7. Testing GET /api/stats (Unauthorized & Authorized)...');
        const unauthStats = await request('GET', '/api/stats');
        assert.strictEqual(unauthStats.status, 401, 'Unauthenticated request should return 401');

        const authStats = await request('GET', '/api/stats', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        assert.strictEqual(authStats.status, 200, 'Authorized admin request should return 200');
        assert.ok(authStats.body.views >= 1);
        assert.ok(authStats.body.coursesCount > 0);
        assert.ok(authStats.body.messagesCount > 0);

        console.log('✅ ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Integration Test Failure:', err);
        process.exitCode = 1;
    } finally {
        server.close();
    }
}

runTests();
