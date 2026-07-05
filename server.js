const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret_key';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Helper function to read database
const readDB = async () => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        const db = JSON.parse(data);
        // Ensure all required collections exist
        if (!db.users) db.users = [];
        if (!db.courses) db.courses = [];
        if (!db.messages) db.messages = [];
        if (!db.stats) db.stats = { views: 0 };
        return db;
    } catch (error) {
        return { users: [], courses: [], messages: [], stats: { views: 0 } };
    }
};

// Helper function to write to database
const writeDB = async (data) => {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Auto-seeding mechanism
const seedDB = async () => {
    const db = await readDB();
    let updated = false;

    if (db.users.length === 0) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        db.users.push({
            id: 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
        updated = true;
    }

    if (db.courses.length === 0) {
        db.courses = [
            { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
            { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
            { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
            { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
            { id: 5, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO and social media marketing.', image: './images/digitalmarketing.png' },
            { id: 6, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology and real-world applications.', image: './images/blockchain.png' }
        ];
        updated = true;
    }

    if (updated) {
        await writeDB(db);
        console.log('Database seeded successfully.');
    }
};

// Endpoints
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const db = await readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password: hashedPassword,
        role: role || 'user'
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = await readDB();

    const user = db.users.find(u => u.email === email && u.role === role);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

app.get('/api/stats', async (req, res) => {
    const db = await readDB();
    res.json({
        views: db.stats.views,
        courses: db.courses.length,
        users: db.users.length,
        messages: db.messages.length,
        recentMessages: db.messages.slice(-5).reverse(),
        recentUsers: db.users.slice(-5).reverse()
    });
});

app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();

    const newMessage = {
        id: db.messages.length + 1,
        name: `${firstName} ${lastName}`,
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.json({ message: 'Message sent successfully' });
});

app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

app.listen(PORT, async () => {
    await seedDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
