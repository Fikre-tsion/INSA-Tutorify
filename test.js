const { exec } = require('child_process');
const assert = require('assert');

let serverProcess;

async function runTests() {
    console.log('Starting server for API integration tests...');
    serverProcess = exec('node server.js');

    // Wait for server to launch
    await new Promise(resolve => setTimeout(resolve, 1500));

    const baseUrl = 'http://localhost:3000';

    try {
        console.log('Test 1: User Registration');
        const testUser = {
            name: 'Test Student',
            email: `student_${Date.now()}@example.com`,
            password: 'password123',
            role: 'user'
        };

        const regRes = await fetch(`${baseUrl}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const regData = await regRes.json();
        assert.strictEqual(regRes.status, 201, `Registration failed: ${JSON.stringify(regData)}`);
        assert.strictEqual(regData.message, 'User registered successfully');

        console.log('Test 2: User Login');
        const loginRes = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUser.email, password: testUser.password })
        });
        const loginData = await loginRes.json();
        assert.strictEqual(loginRes.status, 200, `Login failed: ${JSON.stringify(loginData)}`);
        assert(loginData.token, 'Token missing from login response');
        assert.strictEqual(loginData.user.role, 'user');

        console.log('Test 3: Admin Login');
        const adminLoginRes = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@tutorify.com', password: 'admin123', role: 'admin' })
        });
        const adminData = await adminLoginRes.json();
        assert.strictEqual(adminLoginRes.status, 200, `Admin login failed: ${JSON.stringify(adminData)}`);
        const adminToken = adminData.token;
        assert(adminToken, 'Admin token missing');

        console.log('Test 4: Get Courses Public API');
        const coursesRes = await fetch(`${baseUrl}/api/courses`);
        const coursesData = await coursesRes.json();
        assert.strictEqual(coursesRes.status, 200);
        assert(Array.isArray(coursesData) && coursesData.length > 0, 'Courses array empty or invalid');

        console.log('Test 5: Add Course as Admin');
        const newCourseRes = await fetch(`${baseUrl}/api/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: 'Automated Test Course',
                category: 'Testing',
                description: 'Integration test course description',
                price: 'Free'
            })
        });
        const newCourseData = await newCourseRes.json();
        assert.strictEqual(newCourseRes.status, 201);
        assert.strictEqual(newCourseData.course.title, 'Automated Test Course');

        console.log('Test 6: Submit Contact Form');
        const contactRes = await fetch(`${baseUrl}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'Tester',
                lastName: 'Automated',
                email: 'tester@example.com',
                message: 'Hello from automated API test suite!'
            })
        });
        const contactData = await contactRes.json();
        assert.strictEqual(contactRes.status, 201);

        console.log('Test 7: Fetch Admin Messages');
        const msgsRes = await fetch(`${baseUrl}/api/messages`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const msgsData = await msgsRes.json();
        assert.strictEqual(msgsRes.status, 200);
        assert(Array.isArray(msgsData) && msgsData.length > 0);

        console.log('Test 8: Fetch Admin Stats');
        const statsRes = await fetch(`${baseUrl}/api/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const statsData = await statsRes.json();
        assert.strictEqual(statsRes.status, 200);
        assert(statsData.stats && statsData.usersCount > 0);

        console.log('Test 9: Record Page View');
        const viewRes = await fetch(`${baseUrl}/api/stats/view`, { method: 'POST' });
        const viewData = await viewRes.json();
        assert.strictEqual(viewRes.status, 200);
        assert(viewData.pageViews > 0);

        console.log('✅ ALL API INTEGRATION TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ TEST FAILED:', err);
        process.exitCode = 1;
    } finally {
        if (serverProcess) {
            serverProcess.kill();
        }
    }
}

runTests();
