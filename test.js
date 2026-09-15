const http = require('http');
const app = require('./server.js');

let server;
const PORT = 3001;

function request(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : '';
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function runTests() {
    console.log('Starting Integration Tests...');
    let adminToken = '';
    let userToken = '';

    try {
        // 1. GET /api/courses
        console.log('Test 1: GET /api/courses');
        const coursesRes = await request('GET', '/api/courses');
        if (coursesRes.status !== 200 || !Array.isArray(coursesRes.body) || coursesRes.body.length === 0) {
            throw new Error(`Failed GET /api/courses: status ${coursesRes.status}`);
        }
        console.log('  PASS: Courses fetched successfully. Count:', coursesRes.body.length);

        // 2. POST /api/register
        console.log('Test 2: POST /api/register');
        const regEmail = `testuser_${Date.now()}@example.com`;
        const regRes = await request('POST', '/api/register', {
            name: 'Test Student',
            email: regEmail,
            password: 'password123'
        });
        if (regRes.status !== 201) {
            throw new Error(`Failed POST /api/register: status ${regRes.status}, message: ${JSON.stringify(regRes.body)}`);
        }
        console.log('  PASS: User registered successfully.');

        // 3. POST /api/login (User)
        console.log('Test 3: POST /api/login (User)');
        const loginRes = await request('POST', '/api/login', {
            email: regEmail,
            password: 'password123'
        });
        if (loginRes.status !== 200 || !loginRes.body.token) {
            throw new Error(`Failed POST /api/login: status ${loginRes.status}`);
        }
        userToken = loginRes.body.token;
        console.log('  PASS: User login successful.');

        // 4. POST /api/login (Admin)
        console.log('Test 4: POST /api/login (Admin)');
        const adminLoginRes = await request('POST', '/api/login', {
            email: 'admin@tutorify.com',
            password: 'password123'
        });
        if (adminLoginRes.status !== 200 || !adminLoginRes.body.token) {
            throw new Error(`Failed Admin login: status ${adminLoginRes.status}`);
        }
        adminToken = adminLoginRes.body.token;
        console.log('  PASS: Admin login successful.');

        // 5. POST /api/contact
        console.log('Test 5: POST /api/contact');
        const contactRes = await request('POST', '/api/contact', {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            message: 'Hello, I have a question about courses.'
        });
        if (contactRes.status !== 201) {
            throw new Error(`Failed POST /api/contact: status ${contactRes.status}`);
        }
        console.log('  PASS: Contact form submitted successfully.');

        // 6. POST /api/stats/view
        console.log('Test 6: POST /api/stats/view');
        const viewRes = await request('POST', '/api/stats/view');
        if (viewRes.status !== 200 || typeof viewRes.body.pageViews !== 'number') {
            throw new Error(`Failed POST /api/stats/view: status ${viewRes.status}`);
        }
        console.log('  PASS: Page view tracked successfully. Views:', viewRes.body.pageViews);

        // 7. GET /api/stats (Unauthorized without token)
        console.log('Test 7: GET /api/stats (Unauthorized)');
        const unauthStatsRes = await request('GET', '/api/stats');
        if (unauthStatsRes.status !== 401) {
            throw new Error(`Expected 401 for unauthenticated stats, got ${unauthStatsRes.status}`);
        }
        console.log('  PASS: Unauthenticated stats request blocked.');

        // 8. GET /api/stats (Authorized as Admin)
        console.log('Test 8: GET /api/stats (Admin Authorized)');
        const adminStatsRes = await request('GET', '/api/stats', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        if (adminStatsRes.status !== 200 || typeof adminStatsRes.body.pageViews !== 'number') {
            throw new Error(`Failed GET /api/stats: status ${adminStatsRes.status}`);
        }
        console.log('  PASS: Admin stats fetched successfully. User count:', adminStatsRes.body.userCount);

        console.log('\nALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    } catch (err) {
        console.error('\nTEST FAILURE:', err.message);
        process.exitCode = 1;
    } finally {
        if (server) {
            server.close();
        }
    }
}

server = app.listen(PORT, async () => {
    await runTests();
    server.close(() => {
        process.exit(process.exitCode || 0);
    });
});
