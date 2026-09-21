const http = require('http');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
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
    console.log('Starting API tests...');

    // Test 1: Get Courses
    console.log('Test 1: GET /api/courses');
    const coursesRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/courses',
        method: 'GET'
    });
    if (coursesRes.status !== 200 || !Array.isArray(coursesRes.body) || coursesRes.body.length === 0) {
        throw new Error(`GET /api/courses failed: ${coursesRes.status}`);
    }
    console.log(`✅ Passed: Received ${coursesRes.body.length} courses`);

    // Test 2: Contact Form Submission
    console.log('Test 2: POST /api/contact');
    const contactRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/contact',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        message: 'Hello, this is a test message.'
    });
    if (contactRes.status !== 201) {
        throw new Error(`POST /api/contact failed: ${contactRes.status}`);
    }
    console.log('✅ Passed: Contact form submission success');

    // Test 3: Admin Login
    console.log('Test 3: POST /api/login (Admin)');
    const loginRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        email: 'admin@tutorify.com',
        password: 'password123',
        role: 'admin'
    });
    if (loginRes.status !== 200 || !loginRes.body.token) {
        throw new Error(`POST /api/login failed: ${loginRes.status}`);
    }
    const adminToken = loginRes.body.token;
    console.log('✅ Passed: Admin login success and token received');

    // Test 4: Get Stats (Admin Protected)
    console.log('Test 4: GET /api/stats');
    const statsRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/stats',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (statsRes.status !== 200 || !statsRes.body.stats || !statsRes.body.messages) {
        throw new Error(`GET /api/stats failed: ${statsRes.status}`);
    }
    console.log('✅ Passed: GET /api/stats returned stats and messages');

    // Test 5: Track Page View
    console.log('Test 5: POST /api/stats/view');
    const viewRes = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/stats/view',
        method: 'POST'
    });
    if (viewRes.status !== 200 || typeof viewRes.body.pageViews !== 'number') {
        throw new Error(`POST /api/stats/view failed: ${viewRes.status}`);
    }
    console.log(`✅ Passed: Page views updated to ${viewRes.body.pageViews}`);

    console.log('\nAll tests passed successfully! 🎉');
}

runTests().catch(err => {
    console.error('❌ Test execution failed:', err);
    process.exit(1);
});
