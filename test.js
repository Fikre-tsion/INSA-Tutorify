const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');

let serverProcess;

function request(path, method, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request({
            hostname: '127.0.0.1',
            port: 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: JSON.parse(data) });
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('Starting server...');
    serverProcess = spawn('node', ['server.js'], { stdio: 'inherit' });

    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const email = `testuser_${Date.now()}@example.com`;
        const password = 'password123';

        console.log('Testing /api/register...');
        const regRes = await request('/api/register', 'POST', {
            name: 'Test Bolt User',
            email,
            password,
            role: 'user'
        });

        assert.strictEqual(regRes.status, 201, 'Registration should return 201');
        assert.strictEqual(regRes.body.message, 'User registered successfully');
        console.log('✓ /api/register successful');

        console.log('Testing /api/login...');
        const loginRes = await request('/api/login', 'POST', {
            email,
            password,
            role: 'user'
        });

        assert.strictEqual(loginRes.status, 200, 'Login should return 200');
        assert.ok(loginRes.body.token, 'Response should contain token');
        assert.strictEqual(loginRes.body.user.email, email);
        console.log('✓ /api/login successful');

        console.log('ALL TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('TEST FAILED:', err);
        process.exitCode = 1;
    } finally {
        if (serverProcess) {
            serverProcess.kill();
        }
    }
}

runTests();
