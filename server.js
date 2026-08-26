const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Performance Optimization (Bolt ⚡): In-memory DB cache to eliminate blocking synchronous disk I/O on every request
let dbCache = null;

// Helper function to read database asynchronously into memory cache
const readDB = async () => {
    if (dbCache) return dbCache;

    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: [], messages: [], stats: { views: 1504 } };
            await writeDB(dbCache);
            return dbCache;
        }
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        if (!dbCache.courses) dbCache.courses = [];
        if (!dbCache.messages) dbCache.messages = [];
        if (!dbCache.stats) dbCache.stats = { views: 1504 };
        return dbCache;
    } catch (err) {
        console.error('Error reading DB:', err);
        return { users: [], courses: [], messages: [], stats: { views: 1504 } };
    }
};

// Helper function to write to database asynchronously without blocking request thread
const writeDB = async (data) => {
    dbCache = data;
    try {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing DB:', err);
    }
};

// Seed default admin user and sample courses if not present
const seedInitialData = async () => {
    const db = await readDB();
    if (!db.users.find(u => u.email === 'admin@tutorify.com')) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        db.users.push({
            id: db.users.length + 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
    }

    if (!db.courses || db.courses.length === 0) {
        db.courses = [
            {
                id: 1,
                title: 'Responsive Social Media Website UI Design',
                description: 'Learn how to build modern, responsive social media interfaces using HTML, CSS, and JavaScript.',
                image: './images/course1.jpg'
            },
            {
                id: 2,
                title: 'Responsive SmartHome Website Design',
                description: 'Build responsive smart home web apps with interactive UI components.',
                image: './images/course2.jpg'
            },
            {
                id: 3,
                title: 'Responsive Admin Dashboard UI Design',
                description: 'Design and code data-dense, fully responsive admin analytics dashboards.',
                image: './images/course3.jpg'
            }
        ];
    }

    await writeDB(db);
};

// Register endpoint
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

// Login endpoint
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

// GET /api/courses
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({ message: 'Email and message are required' });
    }

    const db = await readDB();
    const newMessage = {
        id: (db.messages || []).length + 1,
        firstName,
        lastName,
        email,
        message,
        date: new Date().toISOString()
    };

    if (!db.messages) db.messages = [];
    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message submitted successfully' });
});

// GET /api/stats (Admin Dashboard metrics)
app.get('/api/stats', async (req, res) => {
    const db = await readDB();
    const stats = {
        views: (db.stats && db.stats.views) || 1504,
        coursesCount: (db.courses || []).length,
        messagesCount: (db.messages || []).length,
        usersCount: (db.users || []).length,
        recentMessages: (db.messages || []).slice(-5).reverse(),
        users: (db.users || []).map(u => ({ id: u.id, name: u.name, role: u.role }))
    };
    res.json(stats);
});

app.listen(PORT, async () => {
    await seedInitialData();
    console.log(`Server is running on http://localhost:${PORT}`);
});
