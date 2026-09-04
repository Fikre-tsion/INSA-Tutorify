const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');

const PORT = 3099;
let serverProcess;

function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {}
                resolve({ statusCode: res.statusCode, body: parsed, headers: res.headers });
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
    console.log('Starting server for integration testing...');
    serverProcess = spawn('node', ['server.js'], {
        env: { ...process.env, PORT: PORT.toString() },
        stdio: 'inherit'
    });

    // Wait for server to boot up
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        console.log('Test 1: GET /api/courses');
        const resCourses = await request({
            hostname: 'localhost',
            port: PORT,
            path: '/api/courses',
            method: 'GET'
        });
        assert.strictEqual(resCourses.statusCode, 200, 'GET /api/courses status should be 200');
        assert(Array.isArray(resCourses.body), 'Courses response should be an array');
        assert(resCourses.body.length > 0, 'Courses array should not be empty');

        console.log('Test 2: POST /api/contact');
        const resContact = await request({
            hostname: 'localhost',
            port: PORT,
            path: '/api/contact',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            message: 'Hello from test'
        });
        assert.strictEqual(resContact.statusCode, 201, 'POST /api/contact status should be 201');
        assert.strictEqual(resContact.body.message, 'Message sent successfully');

        console.log('Test 3: POST /api/login for default admin');
        const resAdminLogin = await request({
            hostname: 'localhost',
            port: PORT,
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: 'admin@tutorify.com',
            password: 'password123',
            role: 'admin'
        });
        assert.strictEqual(resAdminLogin.statusCode, 200, 'Admin login should succeed with 200');
        assert(resAdminLogin.body.token, 'Token should be returned on login');
        const adminToken = resAdminLogin.body.token;

        console.log('Test 4: GET /api/stats with Admin Auth Header');
        const resStats = await request({
            hostname: 'localhost',
            port: PORT,
            path: '/api/stats',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        assert.strictEqual(resStats.statusCode, 200, 'GET /api/stats status should be 200 for admin');
        assert(resStats.body.stats, 'Stats object should be returned');

        console.log('Test 5: POST /api/register new user');
        const testEmail = `user_${Date.now()}@example.com`;
        const resReg = await request({
            hostname: 'localhost',
            port: PORT,
            path: '/api/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            name: 'New Tester',
            email: testEmail,
            password: 'password123',
            role: 'user'
        });
        assert.strictEqual(resReg.statusCode, 201, 'User registration should succeed');

        console.log('Test 6: POST /api/stats/view');
        const resView = await request({
            hostname: 'localhost',
            port: PORT,
            path: '/api/stats/view',
            method: 'POST'
        });
        assert.strictEqual(resView.statusCode, 200, 'View endpoint should return 200');

        console.log('\n✅ All fullstack integration tests passed successfully!');
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
