const assert = require('assert');
const path = require('path');
const fs = require('fs');

process.env.PORT = '3001';

const app = require('./server.js');

const BASE_URL = 'http://localhost:3001';

async function request(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const text = await res.text();
    let body;
    try {
        body = JSON.parse(text);
    } catch (e) {
        body = text;
    }
    return { status: res.status, body };
}

async function runTests() {
    console.log('Starting integration tests...');

    await new Promise(r => setTimeout(r, 600));

    try {
        // 1. Test GET /api/courses
        console.log('Testing GET /api/courses...');
        const coursesRes = await request('/api/courses');
        assert.strictEqual(coursesRes.status, 200);
        assert(Array.isArray(coursesRes.body));
        assert(coursesRes.body.length >= 18);
        console.log('✓ GET /api/courses passed');

        // 2. Test POST /api/register (hardcoding role to user)
        console.log('Testing POST /api/register...');
        const testUserEmail = `test_${Date.now()}@example.com`;
        const regRes = await request('/api/register', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Test User',
                email: testUserEmail,
                password: 'password123',
                role: 'admin' // Attempting privilege escalation
            })
        });
        assert.strictEqual(regRes.status, 201);
        console.log('✓ POST /api/register passed');

        // 3. Test POST /api/login as user
        console.log('Testing POST /api/login (User)...');
        const loginRes = await request('/api/login', {
            method: 'POST',
            body: JSON.stringify({
                email: testUserEmail,
                password: 'password123',
                role: 'user'
            })
        });
        assert.strictEqual(loginRes.status, 200);
        assert(loginRes.body.token);
        assert.strictEqual(loginRes.body.user.role, 'user'); // Proves privilege escalation was blocked
        const userToken = loginRes.body.token;
        console.log('✓ POST /api/login (User) passed');

        // 4. Test POST /api/login as default seeded admin
        console.log('Testing POST /api/login (Admin)...');
        const adminLoginRes = await request('/api/login', {
            method: 'POST',
            body: JSON.stringify({
                email: 'admin@tutorify.com',
                password: 'password123',
                role: 'admin'
            })
        });
        assert.strictEqual(adminLoginRes.status, 200);
        assert(adminLoginRes.body.token);
        assert.strictEqual(adminLoginRes.body.user.role, 'admin');
        const adminToken = adminLoginRes.body.token;
        console.log('✓ POST /api/login (Admin) passed');

        // 5. Test POST /api/contact
        console.log('Testing POST /api/contact...');
        const contactRes = await request('/api/contact', {
            method: 'POST',
            body: JSON.stringify({
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com',
                message: 'Hello, I would like to inquire about tutoring sessions!'
            })
        });
        assert.strictEqual(contactRes.status, 201);
        console.log('✓ POST /api/contact passed');

        // 6. Test POST /api/stats/view
        console.log('Testing POST /api/stats/view...');
        const viewRes = await request('/api/stats/view', {
            method: 'POST'
        });
        assert.strictEqual(viewRes.status, 200);
        assert(typeof viewRes.body.views === 'number');
        console.log('✓ POST /api/stats/view passed');

        // 7. Test GET /api/stats access control
        console.log('Testing GET /api/stats access control...');

        // No token
        const noTokenRes = await request('/api/stats');
        assert.strictEqual(noTokenRes.status, 401);

        // Non-admin token
        const userStatsRes = await request('/api/stats', {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        assert.strictEqual(userStatsRes.status, 403);

        // Admin token
        const adminStatsRes = await request('/api/stats', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assert.strictEqual(adminStatsRes.status, 200);
        assert(adminStatsRes.body.views >= 1);
        assert(adminStatsRes.body.coursesCount >= 18);
        assert(adminStatsRes.body.messagesCount >= 1);
        console.log('✓ GET /api/stats access control passed');

        console.log('\nAll integration tests passed successfully! 🎉');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Test failed:', err);
        process.exit(1);
    }
}

runTests();
