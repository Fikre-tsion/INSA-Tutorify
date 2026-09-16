const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./server');

let server;
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);

        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

async function runTests() {
    // Preserve initial DB content
    const initialDbContent = fs.readFileSync(DB_FILE, 'utf8');

    server = app.listen(PORT);

    try {
        console.log('Testing /api/register...');
        const regRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            name: 'Test User',
            email: 'test' + Date.now() + '@example.com',
            password: 'password123',
            role: 'student'
        });

        assert.strictEqual(regRes.statusCode, 201, `Expected 201, got ${regRes.statusCode}`);
        assert.strictEqual(regRes.body.message, 'User registered successfully');
        console.log('✓ /api/register passed');

        console.log('Testing /api/login...');
        const testEmail = 'login' + Date.now() + '@example.com';
        await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            name: 'Login User',
            email: testEmail,
            password: 'password123',
            role: 'student'
        });

        const loginRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: testEmail,
            password: 'password123',
            role: 'student'
        });

        assert.strictEqual(loginRes.statusCode, 200, `Expected 200, got ${loginRes.statusCode}`);
        assert.ok(loginRes.body.token, 'Expected token in response');
        assert.strictEqual(loginRes.body.user.email, testEmail);
        console.log('✓ /api/login passed');

        console.log('All tests passed successfully!');
    } catch (err) {
        console.error('Test failed:', err);
        process.exitCode = 1;
    } finally {
        server.close();
        // Restore DB content
        fs.writeFileSync(DB_FILE, initialDbContent, 'utf8');
    }
}

runTests();
