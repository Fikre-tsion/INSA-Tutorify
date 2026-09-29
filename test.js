const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');

let serverProcess;

function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'object' ? JSON.stringify(body) : body);
        }
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting Tutorify Server for Integration Tests...');
    serverProcess = spawn('node', ['server.js'], { stdio: 'pipe', env: { ...process.env, PORT: 3001 } });

    // Wait for server initialization
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        console.log('--- Test 1: GET /api/courses ---');
        const coursesRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/courses',
            method: 'GET'
        });
        assert.strictEqual(coursesRes.statusCode, 200, 'Courses status should be 200');
        assert(Array.isArray(coursesRes.body.courses), 'Courses should be an array');
        assert(coursesRes.body.courses.length >= 1, 'Courses array should not be empty');
        console.log('✅ GET /api/courses passed!');

        console.log('--- Test 2: POST /api/register ---');
        const testUserEmail = `test_${Date.now()}@example.com`;
        const regRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { name: 'Test User', email: testUserEmail, password: 'password123', role: 'admin' });
        assert.strictEqual(regRes.statusCode, 201, 'Register status should be 201');
        console.log('✅ POST /api/register passed!');

        console.log('--- Test 3: POST /api/login & Role Hardcoding Verification ---');
        const loginRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: testUserEmail, password: 'password123' });
        assert.strictEqual(loginRes.statusCode, 200, 'Login status should be 200');
        assert(loginRes.body.token, 'Token should be returned');
        assert.strictEqual(loginRes.body.user.role, 'user', 'Role should be hardcoded to user for security');
        console.log('✅ POST /api/login passed!');

        console.log('--- Test 4: POST /api/contact ---');
        const contactRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/contact',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', message: 'Hello Tutorify!' });
        assert.strictEqual(contactRes.statusCode, 201, 'Contact submission should return 201');
        console.log('✅ POST /api/contact passed!');

        console.log('--- Test 5: GET /api/stats (Admin Only) ---');
        const adminLoginRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'admin@tutorify.com', password: 'admin123', role: 'admin' });
        assert.strictEqual(adminLoginRes.statusCode, 200, 'Admin login status should be 200');

        const statsRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/stats',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminLoginRes.body.token}` }
        });
        assert.strictEqual(statsRes.statusCode, 200, 'Admin stats status should be 200');
        assert(statsRes.body.stats, 'Stats data should exist');
        assert(Array.isArray(statsRes.body.messages), 'Messages should be an array');
        console.log('✅ GET /api/stats passed!');

        console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Test execution failed:', err);
        process.exitCode = 1;
    } finally {
        if (serverProcess) {
            serverProcess.kill();
        }
    }
}

runTests();
