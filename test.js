const http = require('http');
const assert = require('assert');

// Start server process in background or test against local endpoint
const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET', headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
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
}

async function runTests() {
    console.log('--- Starting Integration Tests ---');

    // Test GET /api/courses
    console.log('Testing GET /api/courses...');
    const coursesRes = await makeRequest('/api/courses');
    assert.strictEqual(coursesRes.status, 200, 'Courses endpoint should return HTTP 200');
    assert(Array.isArray(coursesRes.body), 'Courses response should be an array');
    console.log('✅ GET /api/courses passed');

    // Test POST /api/register
    console.log('Testing POST /api/register...');
    const testEmail = `test_${Date.now()}@example.com`;
    const regRes = await makeRequest('/api/register', 'POST', {}, {
        name: 'Test User',
        email: testEmail,
        password: 'password123',
        role: 'user'
    });
    assert.strictEqual(regRes.status, 201, 'Register endpoint should return HTTP 201');
    assert.strictEqual(regRes.body.message, 'User registered successfully');
    console.log('✅ POST /api/register passed');

    // Test POST /api/login
    console.log('Testing POST /api/login...');
    const loginRes = await makeRequest('/api/login', 'POST', {}, {
        email: testEmail,
        password: 'password123',
        role: 'user'
    });
    assert.strictEqual(loginRes.status, 200, 'Login endpoint should return HTTP 200');
    assert(loginRes.body.token, 'Login response should include JWT token');
    console.log('✅ POST /api/login passed');

    // Test POST /api/contact
    console.log('Testing POST /api/contact...');
    const contactRes = await makeRequest('/api/contact', 'POST', {}, {
        name: 'Test Sender',
        email: 'sender@example.com',
        message: 'Hello, I have a question about Tutorify courses!'
    });
    assert.strictEqual(contactRes.status, 201, 'Contact endpoint should return HTTP 201');
    assert.strictEqual(contactRes.body.message, 'Message submitted successfully');
    console.log('✅ POST /api/contact passed');

    // Test Admin Login & GET /api/stats
    console.log('Testing Admin Login and GET /api/stats...');
    const adminLoginRes = await makeRequest('/api/login', 'POST', {}, {
        email: 'admin@tutorify.com',
        password: 'admin123',
        role: 'admin'
    });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login should succeed');
    const adminToken = adminLoginRes.body.token;

    const statsRes = await makeRequest('/api/stats', 'GET', {
        'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(statsRes.status, 200, 'Stats endpoint should return HTTP 200 for admin');
    assert(typeof statsRes.body.usersCount === 'number', 'Stats should contain usersCount');
    console.log('✅ GET /api/stats passed');

    console.log('🎉 All integration tests passed successfully!');
}

// Spawn server process and execute tests
const { spawn } = require('child_process');
const serverProcess = spawn('node', ['server.js'], { stdio: 'pipe' });

let serverStarted = false;
serverProcess.stdout.on('data', async (data) => {
    const output = data.toString();
    if (output.includes('Server is running') && !serverStarted) {
        serverStarted = true;
        try {
            await runTests();
            serverProcess.kill();
            process.exit(0);
        } catch (err) {
            console.error('❌ Test failed:', err);
            serverProcess.kill();
            process.exit(1);
        }
    }
});

serverProcess.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
});

setTimeout(() => {
    if (!serverStarted) {
        console.error('Timed out waiting for server to start');
        serverProcess.kill();
        process.exit(1);
    }
}, 5000);
