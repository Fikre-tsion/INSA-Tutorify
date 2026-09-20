const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');

let serverProcess;
const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const reqHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: reqHeaders
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = body;
                try {
                    parsed = JSON.parse(body);
                } catch (e) {}
                resolve({ status: res.statusCode, body: parsed });
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('Starting server for integration testing...');
    serverProcess = spawn('node', ['server.js'], { stdio: 'inherit' });

    // Wait for server to start
    await new Promise(res => setTimeout(res, 1500));

    try {
        console.log('\n--- Test 1: GET /api/courses ---');
        const coursesRes = await makeRequest('GET', '/api/courses');
        assert.strictEqual(coursesRes.status, 200, 'Expected 200 OK for courses');
        assert(Array.isArray(coursesRes.body), 'Expected courses array');
        assert(coursesRes.body.length >= 18, 'Expected at least 18 courses');
        console.log('✅ GET /api/courses passed');

        console.log('\n--- Test 2: POST /api/register ---');
        const testUserEmail = `test_${Date.now()}@example.com`;
        const regRes = await makeRequest('POST', '/api/register', {
            name: 'Test Student',
            email: testUserEmail,
            password: 'password123',
            role: 'admin' // Security check: role must be overridden to 'user'
        });
        assert.strictEqual(regRes.status, 201, 'Expected 201 Created');
        console.log('✅ POST /api/register passed');

        console.log('\n--- Test 3: POST /api/login (User) ---');
        const loginUserRes = await makeRequest('POST', '/api/login', {
            email: testUserEmail,
            password: 'password123',
            role: 'user'
        });
        assert.strictEqual(loginUserRes.status, 200, 'Expected 200 OK for user login');
        assert(loginUserRes.body.token, 'Expected JWT token in login response');
        assert.strictEqual(loginUserRes.body.user.role, 'user', 'Enforced user role verified');
        console.log('✅ POST /api/login (User) passed');

        console.log('\n--- Test 4: POST /api/login (Admin Default) ---');
        const loginAdminRes = await makeRequest('POST', '/api/login', {
            email: 'admin@tutorify.com',
            password: 'password123',
            role: 'admin'
        });
        assert.strictEqual(loginAdminRes.status, 200, 'Expected 200 OK for admin login');
        const adminToken = loginAdminRes.body.token;
        assert(adminToken, 'Expected JWT token for admin');
        console.log('✅ POST /api/login (Admin) passed');

        console.log('\n--- Test 5: POST /api/contact ---');
        const contactRes = await makeRequest('POST', '/api/contact', {
            firstName: 'Abebe',
            lastName: 'Bikila',
            email: 'abebe@example.com',
            message: 'Inquiring about tutoring availability for Mathematics.'
        });
        assert.strictEqual(contactRes.status, 201, 'Expected 201 Created for contact message');
        console.log('✅ POST /api/contact passed');

        console.log('\n--- Test 6: POST /api/stats/view ---');
        const viewRes = await makeRequest('POST', '/api/stats/view');
        assert.strictEqual(viewRes.status, 200, 'Expected 200 OK for view recording');
        assert(viewRes.body.profileViews !== undefined, 'Expected updated profileViews');
        console.log('✅ POST /api/stats/view passed');

        console.log('\n--- Test 7: GET /api/stats (Secured Admin) ---');
        const unauthRes = await makeRequest('GET', '/api/stats');
        assert.strictEqual(unauthRes.status, 401, 'Expected 401 Unauthorized without token');

        const authRes = await makeRequest('GET', '/api/stats', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        assert.strictEqual(authRes.status, 200, 'Expected 200 OK with valid admin token');
        assert(authRes.body.stats, 'Expected stats object');
        assert(Array.isArray(authRes.body.messages), 'Expected messages array');
        console.log('✅ GET /api/stats (Secured Admin) passed');

        console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exitCode = 1;
    } finally {
        if (serverProcess) {
            serverProcess.kill();
        }
    }
}

runTests();
