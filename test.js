const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');

const PORT = 3099;
let serverProcess = null;

function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const reqOpts = {
            hostname: '127.0.0.1',
            port: PORT,
            path,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        if (options.body) {
            reqOpts.headers['Content-Type'] = 'application/json';
        }

        const req = http.request(reqOpts, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, body: parsed });
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('Starting server process for integration testing...');
    serverProcess = spawn('node', ['server.js'], {
        env: { ...process.env, PORT: PORT.toString() }
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        console.log('Testing GET /api/courses...');
        const coursesRes = await request('/api/courses');
        assert.strictEqual(coursesRes.status, 200, 'GET /api/courses should return status 200');
        assert(Array.isArray(coursesRes.body), 'GET /api/courses should return an array');
        assert(coursesRes.body.length >= 1, 'Courses array should not be empty');
        console.log('✔ GET /api/courses passed');

        console.log('Testing POST /api/register...');
        const regEmail = `testuser_${Date.now()}@example.com`;
        const regRes = await request('/api/register', {
            method: 'POST',
            body: { name: 'Test User', email: regEmail, password: 'password123', role: 'user' }
        });
        assert.strictEqual(regRes.status, 201, 'POST /api/register should return status 201');
        assert.strictEqual(regRes.body.message, 'User registered successfully');
        console.log('✔ POST /api/register passed');

        console.log('Testing POST /api/login...');
        const loginRes = await request('/api/login', {
            method: 'POST',
            body: { email: regEmail, password: 'password123', role: 'user' }
        });
        assert.strictEqual(loginRes.status, 200, 'POST /api/login should return status 200');
        assert(loginRes.body.token, 'Login should return JWT token');
        assert.strictEqual(loginRes.body.user.role, 'user', 'Role should be user');
        console.log('✔ POST /api/login passed');

        console.log('Testing Admin Login...');
        const adminLoginRes = await request('/api/login', {
            method: 'POST',
            body: { email: 'admin@tutorify.com', password: 'password123', role: 'admin' }
        });
        assert.strictEqual(adminLoginRes.status, 200, 'Admin login should return status 200');
        const adminToken = adminLoginRes.body.token;
        assert(adminToken, 'Admin token should be present');
        console.log('✔ Admin Login passed');

        console.log('Testing GET /api/stats authorization guard...');
        const unauthStatsRes = await request('/api/stats');
        assert.strictEqual(unauthStatsRes.status, 401, 'Unauthenticated stats request should return 401');

        const authStatsRes = await request('/api/stats', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assert.strictEqual(authStatsRes.status, 200, 'Authenticated admin stats request should return 200');
        assert(typeof authStatsRes.body.totalCourses === 'number', 'Stats should contain totalCourses');
        console.log('✔ Admin Stats Guard passed');

        console.log('Testing POST /api/contact...');
        const contactRes = await request('/api/contact', {
            method: 'POST',
            body: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', message: 'Hello Tutorify!' }
        });
        assert.strictEqual(contactRes.status, 201, 'POST /api/contact should return status 201');
        console.log('✔ POST /api/contact passed');

        console.log('Testing POST /api/stats/view...');
        const viewRes = await request('/api/stats/view', { method: 'POST' });
        assert.strictEqual(viewRes.status, 200, 'POST /api/stats/view should return status 200');
        console.log('✔ POST /api/stats/view passed');

        console.log('\nAll integration tests passed successfully! 🎉');
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
