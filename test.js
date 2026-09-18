const assert = require('assert');
const http = require('http');

const PORT = 3001;
process.env.PORT = PORT;
process.env.JWT_SECRET = 'test_secret_key';

const server = require('./server');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
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

        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- Starting Integration Tests ---');
    // Allow server to initialize
    await new Promise(r => setTimeout(r, 500));

    const testEmail = `student_${Date.now()}@example.com`;

    try {
        // Test 1: Get Courses
        console.log('Test 1: GET /api/courses');
        const coursesRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/courses',
            method: 'GET'
        });
        assert.strictEqual(coursesRes.status, 200, 'GET /api/courses should return 200');
        assert(Array.isArray(coursesRes.data), 'GET /api/courses should return an array');
        assert(coursesRes.data.length > 0, 'Courses array should not be empty');
        console.log('✓ GET /api/courses passed');

        // Test 2: Register User & Role Enforcement
        console.log('Test 2: POST /api/register (privilege escalation check)');
        const regRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            name: 'Test Student',
            email: testEmail,
            password: 'studentpassword123',
            role: 'admin' // Attempting privilege escalation
        });
        assert.strictEqual(regRes.status, 201, 'Registration should return 201');
        console.log('✓ Registration endpoint passed');

        // Test 3: Login User
        console.log('Test 3: POST /api/login (User role)');
        const userLoginRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: testEmail,
            password: 'studentpassword123',
            role: 'user'
        });
        assert.strictEqual(userLoginRes.status, 200, 'User login should return 200');
        assert(userLoginRes.data.token, 'Login should return JWT token');
        assert.strictEqual(userLoginRes.data.user.role, 'user', 'Role should be user');
        const userToken = userLoginRes.data.token;
        console.log('✓ User login passed');

        // Test 4: Login Admin
        console.log('Test 4: POST /api/login (Admin role)');
        const adminLoginRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: 'admin@tutorify.com',
            password: 'password123',
            role: 'admin'
        });
        assert.strictEqual(adminLoginRes.status, 200, 'Admin login should return 200');
        assert(adminLoginRes.data.token, 'Admin login should return token');
        const adminToken = adminLoginRes.data.token;
        console.log('✓ Admin login passed');

        // Test 5: Contact Form
        console.log('Test 5: POST /api/contact');
        const contactRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/contact',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            firstName: 'Abebe',
            lastName: 'Bikila',
            email: 'abebe@example.com',
            message: 'Hello, I would like to inquire about tutoring.'
        });
        assert.strictEqual(contactRes.status, 201, 'Contact form submission should return 201');
        console.log('✓ Contact submission passed');

        // Test 6: Page View Analytics
        console.log('Test 6: POST /api/stats/view');
        const viewRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/stats/view',
            method: 'POST'
        });
        assert.strictEqual(viewRes.status, 200, 'Record page view should return 200');
        assert(typeof viewRes.data.views === 'number', 'Page view count should be a number');
        console.log('✓ Page view analytics passed');

        // Test 7: Unauthorized Stats Access
        console.log('Test 7: GET /api/stats without auth');
        const noAuthRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/stats',
            method: 'GET'
        });
        assert.strictEqual(noAuthRes.status, 401, 'Unauthenticated stats request should return 401');

        console.log('Test 8: GET /api/stats with User token');
        const userAuthRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/stats',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        assert.strictEqual(userAuthRes.status, 403, 'User stats request should return 403');

        // Test 8: Admin Stats Access
        console.log('Test 9: GET /api/stats with Admin token');
        const adminStatsRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/stats',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assert.strictEqual(adminStatsRes.status, 200, 'Admin stats request should return 200');
        assert(adminStatsRes.data.messages.length > 0, 'Admin stats should contain submitted contact message');
        console.log('✓ Admin stats authorization passed');

        console.log('\nALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
        process.exit(0);
    } catch (err) {
        console.error('Test failure:', err);
        process.exit(1);
    }
}

runTests();
