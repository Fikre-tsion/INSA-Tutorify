const assert = require('assert');
const http = require('http');

// Simple integration test for backend API
async function runTests() {
    console.log('Starting automated API verification test...');

    // Start server on free port for test
    process.env.PORT = '3001';
    const server = require('./server.js');

    // Give server a moment to spin up
    await new Promise(r => setTimeout(r, 500));

    const makeRequest = (path, method, data) => {
        return new Promise((resolve, reject) => {
            const bodyString = data ? JSON.stringify(data) : '';
            const req = http.request({
                hostname: 'localhost',
                port: 3001,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(bodyString)
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(body) });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: body });
                    }
                });
            });
            req.on('error', reject);
            if (bodyString) req.write(bodyString);
            req.end();
        });
    };

    try {
        const testEmail = `test_${Date.now()}@example.com`;

        // 1. Test Registration
        console.log('Testing /api/register...');
        const regRes = await makeRequest('/api/register', 'POST', {
            name: 'Speedy Test User',
            email: testEmail,
            password: 'password123',
            role: 'user'
        });
        assert.strictEqual(regRes.status, 201, `Expected 201, got ${regRes.status}`);
        assert.strictEqual(regRes.data.message, 'User registered successfully');

        // 2. Test Login & Cache Performance
        console.log('Testing /api/login...');
        const start = performance.now();
        const loginRes = await makeRequest('/api/login', 'POST', {
            email: testEmail,
            password: 'password123',
            role: 'user'
        });
        const duration = performance.now() - start;
        console.log(`Login response time: ${duration.toFixed(2)}ms`);

        assert.strictEqual(loginRes.status, 200, `Expected 200, got ${loginRes.status}`);
        assert.ok(loginRes.data.token, 'Expected JWT token');
        assert.strictEqual(loginRes.data.user.email, testEmail);

        console.log('✅ All backend tests passed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
}

runTests();
