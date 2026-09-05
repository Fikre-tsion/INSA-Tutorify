const http = require('http');
const assert = require('assert');

// Simple integration test for register and login endpoints
async function runTests() {
    const { spawn } = require('child_process');
    const PORT = 3001;
    const env = { ...process.env, PORT };

    console.log('Starting server for testing...');
    const serverProcess = spawn('node', ['server.js'], { env });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const testUser = {
            name: 'Test Runner',
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
            role: 'user'
        };

        // Helper function for making JSON HTTP requests
        const request = (path, method, body) => {
            return new Promise((resolve, reject) => {
                const data = JSON.stringify(body);
                const req = http.request({
                    hostname: 'localhost',
                    port: PORT,
                    path,
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data)
                    }
                }, res => {
                    let resData = '';
                    res.on('data', chunk => resData += chunk);
                    res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(resData || '{}') }));
                });
                req.on('error', reject);
                req.write(data);
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
            role: testUser.role
        });
        assert.strictEqual(loginRes.status, 200, 'Login should return 200');
        assert.ok(loginRes.body.token, 'Response should contain JWT token');
        assert.strictEqual(loginRes.body.user.email, testUser.email);

        console.log('All tests passed successfully!');
    } catch (err) {
        console.error('Test failed:', err);
        process.exitCode = 1;
    } finally {
        serverProcess.kill();
    }
}

runTests();
