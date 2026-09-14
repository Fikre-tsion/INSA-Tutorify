const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 3999;
process.env.PORT = PORT;
const DB_FILE = path.join(__dirname, 'db.json');

// Save initial DB content to restore after tests
const initialDBContent = fs.readFileSync(DB_FILE, 'utf8');

const server = require('./server.js');

function makeRequest(path, method, body) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(body);
        const req = http.request({
            hostname: '127.0.0.1',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    try {
        console.log('Testing server endpoints...');
        const testEmail = `test_${Date.now()}@example.com`;
        const testPassword = 'password123';

        // Test Registration
        console.log('1. Testing /api/register...');
        const regRes = await makeRequest('/api/register', 'POST', {
            name: 'Test User',
            email: testEmail,
            password: testPassword,
            role: 'user'
        });
        console.assert(regRes.statusCode === 201, `Expected status 201, got ${regRes.statusCode}`);
        console.assert(regRes.body.message === 'User registered successfully', 'Unexpected registration response');
        console.log('   Registration PASSED');

        // Test Login
        console.log('2. Testing /api/login...');
        const loginRes = await makeRequest('/api/login', 'POST', {
            email: testEmail,
            password: testPassword,
            role: 'user'
        });
        console.assert(loginRes.statusCode === 200, `Expected status 200, got ${loginRes.statusCode}`);
        console.assert(loginRes.body.token, 'Token missing from login response');
        console.assert(loginRes.body.user.email === testEmail, 'User email mismatch in login response');
        console.log('   Login PASSED');

        console.log('All API tests passed successfully!');
    } finally {
        // Restore initial DB state after tests finish
        fs.writeFileSync(DB_FILE, initialDBContent, 'utf8');
        process.exit(0);
    }
}

setTimeout(runTests, 500);
