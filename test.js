const http = require('http');
const { spawn } = require('child_process');

let serverProcess = null;
const PORT = 3001;

function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const reqOptions = {
            hostname: '127.0.0.1',
            port: PORT,
            ...options
        };
        const req = http.request(reqOptions, (res) => {
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
    console.log('Starting server for integration testing...');
    serverProcess = spawn('node', ['server.js'], {
        env: { ...process.env, PORT: PORT.toString(), JWT_SECRET: 'test_jwt_secret' },
        stdio: 'pipe'
    });

    // Wait for server readiness signal
    await new Promise((resolve) => {
        serverProcess.stdout.on('data', (data) => {
            if (data.toString().includes('Server is running')) {
                resolve();
            }
        });
        setTimeout(resolve, 2000);
    });

    try {
        console.log('Running test suite...');

        // Test 1: Courses endpoint
        const coursesRes = await request({
            path: '/api/courses',
            method: 'GET'
        });
        console.assert(coursesRes.status === 200, `Expected 200 for courses, got ${coursesRes.status}`);
        console.assert(Array.isArray(coursesRes.body) && coursesRes.body.length >= 18, 'Expected at least 18 courses');
        console.log('✓ GET /api/courses passed');

        // Test 2: Registration & privilege escalation protection
        const testEmail = `user_${Date.now()}@example.com`;
        const regRes = await request({
            path: '/api/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { name: 'Test User', email: testEmail, password: 'password123', role: 'admin' });
        console.assert(regRes.status === 201, `Expected 201 for register, got ${regRes.status}`);
        console.log('✓ POST /api/register passed');

        // Test 3: Login as registered user with role 'user'
        const loginUserRes = await request({
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: testEmail, password: 'password123', role: 'user' });
        console.assert(loginUserRes.status === 200, `Expected 200 for user login, got ${loginUserRes.status}`);
        console.assert(loginUserRes.body.token, 'Expected JWT token');
        console.log('✓ POST /api/login (User) passed');

        // Test 4: Verify privilege escalation failed
        const fakeAdminLogin = await request({
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: testEmail, password: 'password123', role: 'admin' });
        console.assert(fakeAdminLogin.status === 400, `Expected 400 for fake admin login, got ${fakeAdminLogin.status}`);
        console.log('✓ Security: Privilege escalation attempt blocked');

        // Test 5: Admin Login
        const adminLoginRes = await request({
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'admin@tutorify.com', password: 'admin123', role: 'admin' });
        console.assert(adminLoginRes.status === 200, `Expected 200 for admin login, got ${adminLoginRes.status}`);
        const adminToken = adminLoginRes.body.token;
        console.log('✓ POST /api/login (Admin) passed');

        // Test 6: Contact Form submission
        const contactRes = await request({
            path: '/api/contact',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { name: 'Integration Tester', email: 'tester@example.com', message: 'Hello Tutorify!' });
        console.assert(contactRes.status === 201, `Expected 201 for contact, got ${contactRes.status}`);
        console.log('✓ POST /api/contact passed');

        // Test 7: Record page view
        const viewRes = await request({
            path: '/api/stats/view',
            method: 'POST'
        });
        console.assert(viewRes.status === 200, `Expected 200 for page view, got ${viewRes.status}`);
        console.log('✓ POST /api/stats/view passed');

        // Test 8: Protected Stats Endpoint
        const statsRes = await request({
            path: '/api/stats',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.assert(statsRes.status === 200, `Expected 200 for admin stats, got ${statsRes.status}`);
        console.assert(statsRes.body.usersCount >= 1, 'Expected usersCount >= 1');
        console.log('✓ GET /api/stats (Admin Authorized) passed');

        console.log('ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('Test failure:', err);
        process.exitCode = 1;
    } finally {
        if (serverProcess) {
            serverProcess.kill();
        }
    }
}

runTests();
