const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');

const PORT = 3001;
let serverProcess = null;

function makeRequest(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const reqHeaders = { ...headers };
        let payload = null;

        if (body) {
            payload = JSON.stringify(body);
            reqHeaders['Content-Type'] = 'application/json';
            reqHeaders['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = http.request({
            hostname: '127.0.0.1',
            port: PORT,
            path,
            method,
            headers: reqHeaders
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function waitForServer(retries = 10) {
    for (let i = 0; i < retries; i++) {
        try {
            await makeRequest('/api/courses');
            return true;
        } catch (e) {
            await new Promise(r => setTimeout(r, 300));
        }
    }
    throw new Error('Server failed to start');
}

async function runTests() {
    console.log('Starting server process for testing on port', PORT, '...');
    serverProcess = spawn('node', ['server.js'], {
        env: { ...process.env, PORT: PORT.toString() },
        stdio: 'ignore'
    });

    try {
        await waitForServer();
        console.log('Server started successfully.');

        // 1. User Registration with Timestamped Email
        const uniqueEmail = `user_${Date.now()}@example.com`;
        const regRes = await makeRequest('/api/register', 'POST', {
            name: 'Test Student',
            email: uniqueEmail,
            password: 'password123',
            role: 'user'
        });
        assert.strictEqual(regRes.status, 201, 'Registration should return 201');
        assert.strictEqual(regRes.data.message, 'User registered successfully');
        console.log('✅ User Registration test passed.');

        // 2. User Login
        const loginRes = await makeRequest('/api/login', 'POST', {
            email: uniqueEmail,
            password: 'password123',
            role: 'user'
        });
        assert.strictEqual(loginRes.status, 200, 'User login should return 200');
        assert.ok(loginRes.data.token, 'Token should be present in response');
        assert.strictEqual(loginRes.data.user.role, 'user', 'User role should be user');
        console.log('✅ User Login test passed.');

        // 3. Admin Login
        const adminLoginRes = await makeRequest('/api/login', 'POST', {
            email: 'admin@tutorify.com',
            password: 'admin123',
            role: 'admin'
        });
        assert.strictEqual(adminLoginRes.status, 200, 'Admin login should return 200');
        const adminToken = adminLoginRes.data.token;
        assert.ok(adminToken, 'Admin token should be present');
        assert.strictEqual(adminLoginRes.data.user.role, 'admin', 'User role should be admin');
        console.log('✅ Admin Login test passed.');

        // 4. GET /api/courses
        const coursesRes = await makeRequest('/api/courses');
        assert.strictEqual(coursesRes.status, 200, 'Courses endpoint should return 200');
        assert.ok(Array.isArray(coursesRes.data), 'Courses response should be an array');
        assert.ok(coursesRes.data.length > 0, 'Courses array should not be empty');
        console.log('✅ Fetch Courses test passed.');

        // 5. POST /api/contact
        const contactRes = await makeRequest('/api/contact', 'POST', {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            message: 'Hello, I have a question about web development courses!'
        });
        assert.strictEqual(contactRes.status, 201, 'Contact endpoint should return 201');
        console.log('✅ Submit Contact Form test passed.');

        // 6. POST /api/stats/view
        const viewRes = await makeRequest('/api/stats/view', 'POST');
        assert.strictEqual(viewRes.status, 200, 'Page view tracking should return 200');
        assert.ok(typeof viewRes.data.pageViews === 'number', 'pageViews should be a number');
        console.log('✅ Track Page View test passed.');

        // 7. GET /api/stats (Authorized Admin)
        const statsRes = await makeRequest('/api/stats', 'GET', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        assert.strictEqual(statsRes.status, 200, 'Stats endpoint with admin token should return 200');
        assert.ok(typeof statsRes.data.usersCount === 'number', 'usersCount should be present');
        assert.ok(typeof statsRes.data.coursesCount === 'number', 'coursesCount should be present');
        assert.ok(typeof statsRes.data.messagesCount === 'number', 'messagesCount should be present');
        assert.ok(typeof statsRes.data.pageViews === 'number', 'pageViews should be present');
        console.log('✅ Get Admin Stats test passed.');

        // 8. GET /api/stats (Unauthorized)
        const unauthRes = await makeRequest('/api/stats', 'GET');
        assert.strictEqual(unauthRes.status, 401, 'Unauthenticated stats request should return 401');
        console.log('✅ Unauthorized Stats Access test passed.');

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        if (serverProcess) {
            serverProcess.kill();
        }
    }
}

runTests();
