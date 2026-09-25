const assert = require('assert');
const http = require('http');

const PORT = 3001;
process.env.PORT = PORT;

const app = require('./server.js');

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: '127.0.0.1',
            port: PORT,
            path,
            method,
            headers: {
                ...headers,
                ...(payload ? {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let json = null;
                try {
                    json = JSON.parse(data);
                } catch (e) {
                    json = data;
                }
                resolve({ status: res.statusCode, headers: res.headers, body: json });
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('Starting fullstack integration tests...');

    // Test 1: Register User
    const regRes = await request('POST', '/api/register', {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        role: 'admin' // role specified should be overridden to 'user' for safety
    });
    assert.strictEqual(regRes.status, 201, 'Registration should succeed with status 201');
    console.log('✔ Registration endpoint test passed');

    // Test 2: Login Admin (seeded admin user)
    const loginRes = await request('POST', '/api/login', {
        email: 'admin@tutorify.com',
        password: 'admin123',
        role: 'admin'
    });
    assert.strictEqual(loginRes.status, 200, 'Admin login should succeed');
    assert.ok(loginRes.body.token, 'Token should be returned');
    const adminToken = loginRes.body.token;
    console.log('✔ Login endpoint test passed');

    // Test 3: Get Courses
    const coursesRes = await request('GET', '/api/courses');
    assert.strictEqual(coursesRes.status, 200);
    assert.ok(Array.isArray(coursesRes.body), 'Courses response should be an array');
    assert.ok(coursesRes.body.length >= 18, 'Should return initial courses catalogue');
    console.log('✔ Get courses endpoint test passed');

    // Test 4: Contact Form Submission
    const contactRes = await request('POST', '/api/contact', {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        message: 'Hello Tutorify team!'
    });
    assert.strictEqual(contactRes.status, 201);
    console.log('✔ Contact submission test passed');

    // Test 5: Page View Analytics
    const viewRes = await request('POST', '/api/stats/view');
    assert.strictEqual(viewRes.status, 200);
    assert.ok(typeof viewRes.body.views === 'number');
    console.log('✔ Page view analytics test passed');

    // Test 6: Get Stats (Admin Auth)
    const statsRes = await request('GET', '/api/stats', null, {
        'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(statsRes.status, 200);
    assert.ok(statsRes.body.messages.length > 0, 'Messages should include recent submission');
    console.log('✔ Admin stats endpoint test passed');

    console.log('All backend integration tests passed successfully!');
    process.exit(0);
}

// Delay test execution briefly to allow server to initialize readDB
setTimeout(runTests, 500);
