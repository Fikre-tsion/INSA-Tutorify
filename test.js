const http = require('http');
const assert = require('assert');
const { app, seedDatabase, readDB } = require('./server');

let server;
let port;

function request(method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const reqOpts = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
        };

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

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('Starting Tutorify integration test suite...');

    await seedDatabase();

    server = http.createServer(app);
    await new Promise((resolve) => {
        server.listen(0, () => {
            port = server.address().port;
            console.log(`Test server running on port ${port}`);
            resolve();
        });
    });

    try {
        const testEmail = `student_${Date.now()}@example.com`;

        // Test 1: Course listing
        console.log('Test 1: GET /api/courses');
        const coursesRes = await request('GET', '/api/courses');
        assert.strictEqual(coursesRes.status, 200, 'GET /api/courses should return status 200');
        assert(Array.isArray(coursesRes.body), 'GET /api/courses body should be an array');
        assert(coursesRes.body.length >= 1, 'Should have initial courses loaded');

        // Test 2: User Registration (role privilege escalation protection)
        console.log('Test 2: POST /api/register');
        const regRes = await request('POST', '/api/register', {}, {
            name: 'Test Student',
            email: testEmail,
            password: 'password123',
            role: 'admin' // Attempting privilege escalation
        });
        assert.strictEqual(regRes.status, 201, 'Registration should succeed');

        // Verify role is hardcoded to 'user'
        const db = await readDB();
        const createdUser = db.users.find(u => u.email === testEmail);
        assert(createdUser, 'User should exist in database');
        assert.strictEqual(createdUser.role, 'user', 'Role should be hardcoded to "user"');

        // Test 3: User Login
        console.log('Test 3: POST /api/login for user');
        const userLoginRes = await request('POST', '/api/login', {}, {
            email: testEmail,
            password: 'password123',
            role: 'user'
        });
        assert.strictEqual(userLoginRes.status, 200, 'User login should succeed');
        assert(userLoginRes.body.token, 'Response should include JWT token');
        assert.strictEqual(userLoginRes.body.user.role, 'user', 'User role should match');

        // Test 4: Admin Login
        console.log('Test 4: POST /api/login for seeded admin');
        const adminLoginRes = await request('POST', '/api/login', {}, {
            email: 'admin@tutorify.com',
            password: 'password123',
            role: 'admin'
        });
        assert.strictEqual(adminLoginRes.status, 200, 'Admin login should succeed');
        assert(adminLoginRes.body.token, 'Response should include JWT token');
        const adminToken = adminLoginRes.body.token;

        // Test 5: Contact Form Submission
        console.log('Test 5: POST /api/contact');
        const contactRes = await request('POST', '/api/contact', {}, {
            firstName: 'Abebe',
            lastName: 'Bikila',
            email: 'abebe@example.com',
            message: 'Inquiring about physics tutoring'
        });
        assert.strictEqual(contactRes.status, 201, 'Contact form submission should succeed');

        // Test 6: Page View Stats Increment
        console.log('Test 6: POST /api/stats/view');
        const viewRes = await request('POST', '/api/stats/view');
        assert.strictEqual(viewRes.status, 200, 'Page view stat recording should succeed');
        assert(viewRes.body.pageViews > 0, 'Page views count should increment');

        // Test 7: Admin Stats (Unauthorized without token)
        console.log('Test 7: GET /api/stats without token');
        const unauthStatsRes = await request('GET', '/api/stats');
        assert.strictEqual(unauthStatsRes.status, 401, 'Unauthenticated stats request should be rejected');

        // Test 8: Admin Stats (Authorized with token)
        console.log('Test 8: GET /api/stats with admin token');
        const adminStatsRes = await request('GET', '/api/stats', {
            'Authorization': `Bearer ${adminToken}`
        });
        assert.strictEqual(adminStatsRes.status, 200, 'Authenticated admin stats request should succeed');
        assert(adminStatsRes.body.messagesCount >= 1, 'Messages count should reflect submitted message');

        console.log('All integration tests passed successfully!');
    } catch (err) {
        console.error('Test suite failed:', err);
        process.exitCode = 1;
    } finally {
        server.close();
    }
}

runTests();
