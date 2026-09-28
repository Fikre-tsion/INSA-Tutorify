const http = require('http');
const app = require('./server');

let server;
const PORT = 3001;

function makeRequest(path, method, body) {
    return new Promise((resolve, reject) => {
        const dataString = JSON.stringify(body);
        const req = http.request({
            hostname: '127.0.0.1',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(dataString)
            }
        }, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(responseData) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: responseData });
                }
            });
        });

        req.on('error', reject);
        req.write(dataString);
        req.end();
    });
}

async function runTests() {
    server = app.listen(PORT, async () => {
        try {
            console.log('Test server listening on port', PORT);

            const testEmail = `test_${Date.now()}@example.com`;

            // Test Registration
            const regRes = await makeRequest('/api/register', 'POST', {
                name: 'Test User',
                email: testEmail,
                password: 'password123',
                role: 'user'
            });

            console.log('Register response:', regRes);
            if (regRes.status !== 201) {
                throw new Error(`Registration failed with status ${regRes.status}`);
            }

            // Test Login
            const loginRes = await makeRequest('/api/login', 'POST', {
                email: testEmail,
                password: 'password123',
                role: 'user'
            });

            console.log('Login response:', loginRes);
            if (loginRes.status !== 200 || !loginRes.body.token) {
                throw new Error(`Login failed with status ${loginRes.status}`);
            }

            console.log('All tests passed successfully!');
            server.close();
            process.exit(0);
        } catch (err) {
            console.error('Test failed:', err);
            if (server) server.close();
            process.exit(1);
        }
    });
}

runTests();
