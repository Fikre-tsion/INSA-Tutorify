const http = require('http');
const assert = require('assert');

async function runTests() {
    const { spawn } = require('child_process');
    const PORT = 3002;
    const env = { ...process.env, PORT };

    console.log('Starting server for testing...');
    const serverProcess = spawn('node', ['server.js'], { env });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const testUser = {
            name: 'Test Runner',
            email: `test_${Date.now()}@example.com`,
            password: 'password123'
        };

        const request = (path, method, body, headers = {}) => {
            return new Promise((resolve, reject) => {
                const data = body ? JSON.stringify(body) : '';
                const reqHeaders = {
                    'Content-Type': 'application/json',
                    ...headers
                };
                if (data) {
                    reqHeaders['Content-Length'] = Buffer.byteLength(data);
                }

                const req = http.request({
                    hostname: 'localhost',
                    port: PORT,
                    path,
                    method,
                    headers: reqHeaders
                }, res => {
                    let resData = '';
                    res.on('data', chunk => resData += chunk);
                    res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(resData || '{}') }));
                });
                req.on('error', reject);
                if (data) req.write(data);
                req.end();
            });
        };

        console.log('Testing /api/register...');
        const regRes = await request('/api/register', 'POST', testUser);
        assert.strictEqual(regRes.status, 201, 'Registration should return 201');
        assert.strictEqual(regRes.body.message, 'User registered successfully');

        console.log('Testing duplicate /api/register...');
        const dupRes = await request('/api/register', 'POST', testUser);
        assert.strictEqual(dupRes.status, 400, 'Duplicate registration should return 400');

        console.log('Testing /api/login...');
        const loginRes = await request('/api/login', 'POST', {
            email: testUser.email,
            password: testUser.password,
            role: 'user'
        });
        assert.strictEqual(loginRes.status, 200, 'Login should return 200');
        assert.ok(loginRes.body.token, 'Response should contain JWT token');

        console.log('Testing admin /api/login...');
        const adminLoginRes = await request('/api/login', 'POST', {
            email: 'admin@tutorify.com',
            password: 'password123',
            role: 'admin'
        });
        assert.strictEqual(adminLoginRes.status, 200, 'Admin login should return 200');
        assert.ok(adminLoginRes.body.token, 'Admin login should return JWT token');

        console.log('Testing authenticated /api/stats...');
        const statsRes = await request('/api/stats', 'GET', null, {
            'Authorization': `Bearer ${adminLoginRes.body.token}`
        });
        assert.strictEqual(statsRes.status, 200, 'Stats endpoint should return 200 for admin');

        console.log('Testing /api/courses...');
        const coursesRes = await request('/api/courses', 'GET');
        assert.strictEqual(coursesRes.status, 200, 'Courses should return 200');
        assert.ok(Array.isArray(coursesRes.body), 'Courses response should be an array');

        console.log('Testing /api/contact...');
        const contactRes = await request('/api/contact', 'POST', {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            message: 'Hello Tutorify!'
        });
        assert.strictEqual(contactRes.status, 201, 'Contact submission should return 201');

        console.log('Testing /api/stats/view...');
        const viewRes = await request('/api/stats/view', 'POST');
        assert.strictEqual(viewRes.status, 200, 'View increment should return 200');

        console.log('All tests passed successfully!');
    } catch (err) {
        console.error('Test failed:', err);
        process.exitCode = 1;
    } finally {
        serverProcess.kill();
    }
}

runTests();
