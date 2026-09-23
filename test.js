const http = require('http');
const { spawn } = require('child_process');

const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess = null;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(url, options, (res) => {
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('Starting server for integration testing on port', PORT);
    serverProcess = spawn('node', ['server.js'], {
        env: { ...process.env, PORT: PORT.toString(), JWT_SECRET: 'testsecret' },
        stdio: 'inherit'
    });

    // Wait for server startup
    await sleep(1500);

    try {
        console.log('1. Testing GET /api/courses');
        const coursesRes = await request('GET', '/api/courses');
        if (coursesRes.status !== 200 || !Array.isArray(coursesRes.body) || coursesRes.body.length === 0) {
            throw new Error(`GET /api/courses failed: status ${coursesRes.status}`);
        }
        console.log('   ✓ Courses endpoint passed, count:', coursesRes.body.length);

        console.log('2. Testing POST /api/register (User Registration)');
        const testUser = {
            name: 'Test Student',
            email: `student_${Date.now()}@example.com`,
            password: 'password123'
        };
        const regRes = await request('POST', '/api/register', testUser);
        if (regRes.status !== 201 || regRes.body.message !== 'User registered successfully') {
            throw new Error(`POST /api/register failed: status ${regRes.status}`);
        }
        console.log('   ✓ User registration endpoint passed');

        console.log('3. Testing POST /api/login (Student Login)');
        const loginRes = await request('POST', '/api/login', {
            email: testUser.email,
            password: testUser.password,
            role: 'user'
        });
        if (loginRes.status !== 200 || !loginRes.body.token) {
            throw new Error(`POST /api/login user failed: status ${loginRes.status}`);
        }
        console.log('   ✓ Student login endpoint passed');

        console.log('4. Testing POST /api/login (Default Admin Login)');
        const adminLoginRes = await request('POST', '/api/login', {
            email: 'admin@tutorify.com',
            password: 'password123',
            role: 'admin'
        });
        if (adminLoginRes.status !== 200 || !adminLoginRes.body.token) {
            throw new Error(`POST /api/login admin failed: status ${adminLoginRes.status}`);
        }
        const adminToken = adminLoginRes.body.token;
        console.log('   ✓ Admin login endpoint passed');

        console.log('5. Testing POST /api/contact (Message Submission)');
        const contactRes = await request('POST', '/api/contact', {
            firstName: 'Abebe',
            lastName: 'Bikila',
            email: 'abebe@example.com',
            message: 'Hello, I need tutoring in Mathematics!'
        });
        if (contactRes.status !== 201) {
            throw new Error(`POST /api/contact failed: status ${contactRes.status}`);
        }
        console.log('   ✓ Contact message submission endpoint passed');

        console.log('6. Testing POST /api/stats/view (Page View Metric)');
        const viewRes = await request('POST', '/api/stats/view');
        if (viewRes.status !== 200 || typeof viewRes.body.views !== 'number') {
            throw new Error(`POST /api/stats/view failed: status ${viewRes.status}`);
        }
        console.log('   ✓ Page view tracking endpoint passed');

        console.log('7. Testing GET /api/stats (Admin Stats Protection)');
        const unauthStatsRes = await request('GET', '/api/stats');
        if (unauthStatsRes.status !== 401) {
            throw new Error(`GET /api/stats unauthenticated should return 401, got ${unauthStatsRes.status}`);
        }

        const authStatsRes = await request('GET', '/api/stats', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        if (authStatsRes.status !== 200 || typeof authStatsRes.body.courseCount !== 'number') {
            throw new Error(`GET /api/stats authenticated failed: status ${authStatsRes.status}`);
        }
        console.log('   ✓ Admin stats endpoint security & data passed');

        console.log('\n✅ ALL INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
    } catch (err) {
        console.error('\n❌ INTEGRATION TEST FAILED:', err.message);
        process.exitCode = 1;
    } finally {
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
        }
    }
}

runTests();
