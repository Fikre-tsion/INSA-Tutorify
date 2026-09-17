const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('./server');

let server;
let baseUrl;

test.before((t, done) => {
    server = http.createServer(app);
    server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        done();
    });
});

test.after((t, done) => {
    server.close(done);
});

function makeRequest(path, options = {}, body = null) {
    return new Promise((resolve, reject) => {
        const url = `${baseUrl}${path}`;
        const parsedUrl = new URL(url);

        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = http.request(reqOptions, (res) => {
            let resData = '';
            res.on('data', chunk => { resData += chunk; });
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(resData);
                } catch (e) {
                    parsed = resData;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

test('POST /api/register - creates new user successfully', async () => {
    const testUser = {
        name: 'Integration Test User',
        email: `test_${Date.now()}@example.com`,
        password: 'Password123!'
    };

    const res = await makeRequest('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, testUser);

    assert.equal(res.status, 201);
    assert.equal(res.data.message, 'User registered successfully');
});

test('POST /api/login - logs in admin user and returns token', async () => {
    const adminCreds = {
        email: 'admin@tutorify.com',
        password: 'password123',
        role: 'admin'
    };

    const res = await makeRequest('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, adminCreds);

    assert.equal(res.status, 200);
    assert.ok(res.data.token);
    assert.equal(res.data.user.email, 'admin@tutorify.com');
    assert.equal(res.data.user.role, 'admin');
});

test('GET /api/courses - returns course catalog', async () => {
    const res = await makeRequest('/api/courses');

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data));
    assert.ok(res.data.length >= 18);
});

test('POST /api/contact - submits contact form message', async () => {
    const msgData = {
        firstName: 'Test',
        lastName: 'Runner',
        email: 'runner@example.com',
        message: 'Hello, this is an automated integration test message.'
    };

    const res = await makeRequest('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, msgData);

    assert.equal(res.status, 201);
    assert.ok(res.data.message.includes('Thank you'));
});

test('GET /api/stats - requires admin auth token', async () => {
    // Unauthenticated request
    const unauthRes = await makeRequest('/api/stats');
    assert.equal(unauthRes.status, 401);

    // Authenticate as admin
    const adminLogin = await makeRequest('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@tutorify.com', password: 'password123', role: 'admin' });

    const adminToken = adminLogin.data.token;

    // Authenticated admin request
    const authRes = await makeRequest('/api/stats', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert.equal(authRes.status, 200);
    assert.ok(authRes.data.stats);
    assert.ok(Array.isArray(authRes.data.messages));
});

test('POST /api/stats/view - increments profile view count', async () => {
    const res = await makeRequest('/api/stats/view', { method: 'POST' });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
});
