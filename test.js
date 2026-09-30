const assert = require('assert');
const http = require('http');
const { spawn } = require('child_process');

let serverProcess = null;
const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
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
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, rawBody: data });
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
    console.log('Starting server process for automated tests...');
    serverProcess = spawn('node', ['server.js'], {
        env: { ...process.env, PORT: PORT, JWT_SECRET: 'test_jwt_secret' }
    });

    // Wait for server to boot up
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        console.log('1. Testing GET /api/courses...');
        const coursesRes = await makeRequest('/api/courses');
        assert.strictEqual(coursesRes.statusCode, 200, 'Courses endpoint should return 200');
        assert(Array.isArray(coursesRes.body), 'Courses response should be an array');
        assert(coursesRes.body.length > 0, 'Courses array should not be empty');
        console.log(`   ✓ Passed: Received ${coursesRes.body.length} courses`);

        console.log('2. Testing POST /api/register...');
        const testEmail = `testuser_${Date.now()}@example.com`;
        const regRes = await makeRequest('/api/register', 'POST', {
            name: 'Integration Test User',
            email: testEmail,
            password: 'password123',
            role: 'user'
        });
        assert.strictEqual(regRes.statusCode, 201, 'Register endpoint should return 201');
        assert.strictEqual(regRes.body.message, 'User registered successfully');
        console.log('   ✓ Passed: User registered');

        console.log('3. Testing POST /api/login for User...');
        const loginRes = await makeRequest('/api/login', 'POST', {
            email: testEmail,
            password: 'password123',
            role: 'user'
        });
        assert.strictEqual(loginRes.statusCode, 200, 'User login endpoint should return 200');
        assert(loginRes.body.token, 'Login should return JWT token');
        const userToken = loginRes.body.token;
        console.log('   ✓ Passed: User logged in');

        console.log('4. Testing POST /api/login for Admin...');
        const adminLoginRes = await makeRequest('/api/login', 'POST', {
            email: 'admin@tutorify.com',
            password: 'admin123',
            role: 'admin'
        });
        assert.strictEqual(adminLoginRes.statusCode, 200, 'Admin login endpoint should return 200');
        assert(adminLoginRes.body.token, 'Admin login should return token');
        const adminToken = adminLoginRes.body.token;
        console.log('   ✓ Passed: Admin logged in');

        console.log('5. Testing POST /api/contact...');
        const contactRes = await makeRequest('/api/contact', 'POST', {
            firstName: 'Test',
            lastName: 'Sender',
            email: 'sender@example.com',
            message: 'Hello Tutorify team!'
        });
        assert.strictEqual(contactRes.statusCode, 201, 'Contact endpoint should return 201');
        console.log('   ✓ Passed: Contact message recorded');

        console.log('6. Testing POST /api/stats/view...');
        const viewRes = await makeRequest('/api/stats/view', 'POST');
        assert.strictEqual(viewRes.statusCode, 200, 'Stats view endpoint should return 200');
        assert(viewRes.body.views > 0, 'Views should be greater than zero');
        console.log(`   ✓ Passed: Views counter is ${viewRes.body.views}`);

        console.log('7. Testing GET /api/stats (Admin access)...');
        const statsRes = await makeRequest('/api/stats', 'GET', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        assert.strictEqual(statsRes.statusCode, 200, 'Admin stats endpoint should return 200');
        assert(statsRes.body.stats, 'Stats object should exist');
        assert(Array.isArray(statsRes.body.recentMessages), 'Recent messages should be an array');
        console.log('   ✓ Passed: Admin stats retrieved');

        console.log('8. Testing GET /api/stats (Unauthorized non-admin token)...');
        const unauthorizedRes = await makeRequest('/api/stats', 'GET', null, {
            'Authorization': `Bearer ${userToken}`
        });
        assert.strictEqual(unauthorizedRes.statusCode, 403, 'Non-admin access should return 403 Forbidden');
        console.log('   ✓ Passed: Forbidden access rejected');

        console.log('\n✅ All automated integration tests passed successfully!');
    } catch (err) {
        console.error('\n❌ Test execution failed:', err);
        process.exitCode = 1;
    } finally {
        if (serverProcess) {
            serverProcess.kill();
        }
    }
}

runTests();
