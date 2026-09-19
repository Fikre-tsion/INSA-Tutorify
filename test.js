const http = require('http');
const assert = require('assert');

// Simple integration test suite using standard Node.js http module
const BASE_URL = 'http://localhost:3000';

function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const reqOpts = {
            method: options.method || 'GET',
            headers: options.headers || {},
        };

        const req = http.request(url, reqOpts, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = body;
                try {
                    parsed = JSON.parse(body);
                } catch (e) {}
                resolve({ status: res.statusCode, headers: res.headers, data: parsed });
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting Integration Test Suite...');

    // 1. Test User Registration (Privilege escalation guard)
    const testUser = {
        name: 'Test Runner',
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
        role: 'admin' // Attempt privilege escalation
    };

    const regRes = await request('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: testUser
    });
    assert.strictEqual(regRes.status, 201, 'User registration should succeed');
    console.log('✅ POST /api/register - Success');

    // 2. Test User Login
    const loginRes = await request('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { email: testUser.email, password: testUser.password, role: 'user' }
    });
    assert.strictEqual(loginRes.status, 200, 'User login should succeed');
    assert.ok(loginRes.data.token, 'Token should be returned');
    assert.strictEqual(loginRes.data.user.role, 'user', 'Enforced user role check');
    console.log('✅ POST /api/login (User) - Success');

    // 3. Test Admin Login
    const adminLoginRes = await request('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'admin@tutorify.com', password: 'password123', role: 'admin' }
    });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login should succeed');
    const adminToken = adminLoginRes.data.token;
    console.log('✅ POST /api/login (Admin) - Success');

    // 4. Test GET Courses API
    const coursesRes = await request('/api/courses');
    assert.strictEqual(coursesRes.status, 200, 'Courses endpoint should return 200');
    assert.ok(Array.isArray(coursesRes.data), 'Courses response should be an array');
    console.log(`✅ GET /api/courses - Returned ${coursesRes.data.length} courses`);

    // 5. Test POST Contact API
    const contactRes = await request('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            message: 'Hello, this is a test message!'
        }
    });
    assert.strictEqual(contactRes.status, 201, 'Contact submission should succeed');
    console.log('✅ POST /api/contact - Success');

    // 6. Test Analytics Tracking
    const viewRes = await request('/api/stats/view', { method: 'POST' });
    assert.strictEqual(viewRes.status, 200, 'View counter should update');
    assert.ok(viewRes.data.profileViews > 0, 'Profile views counter incremented');
    console.log('✅ POST /api/stats/view - Success');

    // 7. Test Admin Stats GET Endpoint
    const statsRes = await request('/api/stats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(statsRes.status, 200, 'Admin stats should return 200');
    assert.ok(statsRes.data.stats, 'Stats payload structure valid');
    console.log('✅ GET /api/stats - Success');

    console.log('🎉 All integration tests passed successfully!');
}

// Start temporary server instance for test execution if server is not already running
const { spawn } = require('child_process');
const serverProcess = spawn('node', ['server.js'], { stdio: 'pipe' });

setTimeout(async () => {
    try {
        await runTests();
        serverProcess.kill();
        process.exit(0);
    } catch (err) {
        console.error('❌ Test execution failed:', err);
        serverProcess.kill();
        process.exit(1);
    }
}, 1000);
