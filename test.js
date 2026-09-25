const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');

let serverProcess;
const PORT = 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method: method,
            headers: headers
        };

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = data ? JSON.parse(data) : {};
                    resolve({ statusCode: res.statusCode, body: json });
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
    console.log('Starting server for integration testing...');
    serverProcess = spawn('node', ['server.js'], {
        env: { ...process.env, PORT: PORT, JWT_SECRET: 'test_jwt_secret' },
        stdio: 'inherit'
    });

    // Wait for server to boot
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        const testEmail = `student_${Date.now()}@example.com`;

        console.log('Test 1: User Registration');
        const regRes = await makeRequest('POST', '/api/register', {
            name: 'Test Student',
            email: testEmail,
            password: 'password123',
            role: 'admin' // Attempting privilege escalation
        });
        assert.strictEqual(regRes.statusCode, 201, 'User registration should succeed');
        assert.strictEqual(regRes.body.message, 'User registered successfully');

        console.log('Test 2: User Login');
        const loginRes = await makeRequest('POST', '/api/login', {
            email: testEmail,
            password: 'password123',
            role: 'user'
        });
        assert.strictEqual(loginRes.statusCode, 200, 'User login should succeed');
        assert.strictEqual(loginRes.body.user.role, 'user', 'Role must be user (privilege escalation prevented)');
        const userToken = loginRes.body.token;
        assert.ok(userToken, 'Token should be returned');

        console.log('Test 3: Admin Login');
        const adminLoginRes = await makeRequest('POST', '/api/login', {
            email: 'admin@tutorify.com',
            password: 'admin123',
            role: 'admin'
        });
        assert.strictEqual(adminLoginRes.statusCode, 200, 'Admin login should succeed');
        const adminToken = adminLoginRes.body.token;
        assert.ok(adminToken, 'Admin token should be returned');

        console.log('Test 4: Protected Stats Endpoint Authorization');
        const unauthStatsRes = await makeRequest('GET', '/api/stats');
        assert.strictEqual(unauthStatsRes.statusCode, 401, 'Unauthorized request should be rejected');

        const userStatsRes = await makeRequest('GET', '/api/stats', null, userToken);
        assert.strictEqual(userStatsRes.statusCode, 403, 'Non-admin user should be forbidden');

        const adminStatsRes = await makeRequest('GET', '/api/stats', null, adminToken);
        assert.strictEqual(adminStatsRes.statusCode, 200, 'Admin request should succeed');
        assert.ok(typeof adminStatsRes.body.views === 'number', 'Views stat present');
        assert.ok(typeof adminStatsRes.body.coursesCount === 'number', 'Courses stat present');

        console.log('Test 5: Fetch Courses List');
        const coursesRes = await makeRequest('GET', '/api/courses');
        assert.strictEqual(coursesRes.statusCode, 200, 'Get courses should succeed');
        assert.ok(Array.isArray(coursesRes.body), 'Courses response should be an array');
        assert.ok(coursesRes.body.length > 0, 'Course array should contain default courses');

        console.log('Test 6: Submit Contact Form');
        const contactRes = await makeRequest('POST', '/api/contact', {
            firstName: 'Alex',
            lastName: 'Mercer',
            email: 'alex@example.com',
            message: 'Hello, I have a question about the courses.'
        });
        assert.strictEqual(contactRes.statusCode, 201, 'Contact message submission should succeed');

        console.log('Test 7: Record Page View Analytics');
        const viewRes = await makeRequest('POST', '/api/stats/view');
        assert.strictEqual(viewRes.statusCode, 200, 'Record view should succeed');
        assert.ok(viewRes.body.views > 0, 'Views count updated');

        console.log('\n✅ All integration tests passed successfully!');
    } catch (err) {
        console.error('\n❌ Test failed:', err);
        process.exitCode = 1;
    } finally {
        if (serverProcess) {
            serverProcess.kill();
        }
    }
}

runTests();
