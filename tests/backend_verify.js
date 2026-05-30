const http = require('http');

const testEndpoint = (path, method = 'GET', body = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        body: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        body: data
                    });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

(async () => {
    try {
        console.log('Testing /api/courses...');
        const courses = await testEndpoint('/api/courses');
        console.log('Courses Status:', courses.statusCode);

        console.log('Testing /api/contact...');
        const contact = await testEndpoint('/api/contact', 'POST', {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            message: 'Hello'
        });
        console.log('Contact Status:', contact.statusCode);

        console.log('Testing /api/stats...');
        const stats = await testEndpoint('/api/stats');
        console.log('Stats Status:', stats.statusCode);

        console.log('Verification finished.');
    } catch (e) {
        console.error('Verification failed:', e);
        process.exit(1);
    }
})();
