const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log('🚀 Starting API Verification Tests...');

    try {
        // 1. Test Courses Endpoint
        console.log('\n--- 1. Testing GET /api/courses ---');
        const coursesRes = await fetch(`${BASE_URL}/api/courses`);
        const coursesData = await coursesRes.json();
        if (coursesRes.ok && Array.isArray(coursesData)) {
            console.log('✅ Courses fetched successfully');
        } else {
            console.error('❌ Failed to fetch courses');
        }

        // 2. Test Contact Endpoint
        console.log('\n--- 2. Testing POST /api/contact ---');
        const contactRes = await fetch(`${BASE_URL}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                message: 'Hello from verification script!'
            })
        });
        if (contactRes.ok) {
            console.log('✅ Contact message sent successfully');
        } else {
            console.error('❌ Failed to send contact message');
        }

        // 3. Test Admin Login and Stats
        console.log('\n--- 3. Testing Admin Login and Stats ---');
        const loginRes = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin'
            })
        });
        const loginData = await loginRes.json();

        if (loginRes.ok && loginData.token) {
            console.log('✅ Admin login successful');

            const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
                headers: { 'Authorization': `Bearer ${loginData.token}` }
            });
            const statsData = await statsRes.json();

            if (statsRes.ok && statsData.stats) {
                console.log('✅ Admin stats fetched successfully');
            } else {
                console.error('❌ Failed to fetch admin stats');
            }
        } else {
            console.error('❌ Admin login failed');
        }

        console.log('\n🏁 API Verification Tests Completed!');
    } catch (error) {
        console.error('💥 An error occurred during tests:', error.message);
    }
}

runTests();
