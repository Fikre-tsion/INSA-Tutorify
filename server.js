const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;

const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'Master Blockchain Fundamentals', description: 'Learn blockchain fundamentals, smart contracts, and decentralized apps.', image: './digitalmarketing.png' },
    { id: 5, title: 'Data Science with Python', description: 'Master data analysis, visualization, and machine learning with Python.', image: './digitalmarketing.png' },
    { id: 6, title: 'Full Stack Web Development', description: 'Build complete web applications from front to back.', image: './digitalmarketing.png' },
    { id: 7, title: 'Graphic Design Masterclass', description: 'Discover typography, color theory, and visual communication.', image: './digitalmarketing.png' },
    { id: 8, title: 'Cybersecurity Essentials', description: 'Understand ethical hacking and network security.', image: './digitalmarketing.png' },
    { id: 9, title: 'Digital Marketing Strategy', description: 'Learn the latest strategies for online marketing success.', image: './digitalmarketing.png' },
    { id: 10, title: 'Java Programming for Beginners', description: 'Master the fundamentals of Java programming.', image: './digitalmarketing.png' },
    { id: 11, title: 'Investing and Finance 101', description: 'Learn the basics of investing and personal finance.', image: './digitalmarketing.png' },
    { id: 12, title: 'Ethical Hacking Course', description: 'Learn how to protect systems from cyber attacks.', image: './digitalmarketing.png' },
    { id: 13, title: 'Business Management Fundamentals', description: 'Learn the core principles of business management.', image: './digitalmarketing.png' },
    { id: 14, title: 'Mobile App Development with Flutter', description: 'Build cross-platform mobile apps with Flutter.', image: './digitalmarketing.png' },
    { id: 15, title: 'UI/UX Design Principles', description: 'Learn the principles of great user interface and experience design.', image: './digitalmarketing.png' },
    { id: 16, title: 'Advanced Machine Learning', description: 'Deep dive into advanced ML algorithms and techniques.', image: './digitalmarketing.png' },
    { id: 17, title: 'Cloud Computing with AWS', description: 'Master cloud infrastructure with Amazon Web Services.', image: './digitalmarketing.png' },
    { id: 18, title: 'Game Development with Unity', description: 'Build 2D and 3D games with the Unity engine.', image: './digitalmarketing.png' }
];

// Helper function to read database with caching and async fs
const readDB = async () => {
    if (dbCache) return dbCache;

    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);

        let modified = false;
        if (!dbCache.users) { dbCache.users = []; modified = true; }
        if (!dbCache.courses || dbCache.courses.length === 0) { dbCache.courses = initialCourses; modified = true; }
        if (!dbCache.messages) { dbCache.messages = []; modified = true; }
        if (!dbCache.stats) { dbCache.stats = { views: 0 }; modified = true; }

        // Seed admin if missing
        if (!dbCache.users.find(u => u.role === 'admin')) {
            const hashedAdminPassword = await bcrypt.hash('password123', 10);
            dbCache.users.push({
                id: 1,
                name: 'Admin User',
                email: 'admin@tutorify.com',
                password: hashedAdminPassword,
                role: 'admin'
            });
            modified = true;
        }

        if (modified) await writeDB(dbCache);

        return dbCache;
    } catch (error) {
        dbCache = {
            users: [{
                id: 1,
                name: 'Admin User',
                email: 'admin@tutorify.com',
                password: await bcrypt.hash('password123', 10),
                role: 'admin'
            }],
            courses: initialCourses,
            messages: [],
            stats: { views: 0 }
        };
        await writeDB(dbCache);
        return dbCache;
    }
};

// Helper function to write to database with caching and async fs
const writeDB = async (data) => {
    dbCache = data;
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Endpoints
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const db = await readDB();
        if (db.users.find(u => u.email === email)) return res.status(400).json({ message: 'User already exists' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: Date.now(), name, email, password: hashedPassword, role: 'user' };
        db.users.push(newUser);
        await writeDB(db);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const db = await readDB();
        const user = db.users.find(u => u.email === email && u.role === role);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        const db = await readDB();
        db.messages.push({ id: Date.now(), firstName, lastName, email, message, date: new Date().toISOString() });
        await writeDB(db);
        res.status(201).json({ message: 'Message received successfully' });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        db.stats.views++;
        await writeDB(db);
        res.json({ views: db.stats.views });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/stats', async (req, res) => {
    try {
        const db = await readDB();
        res.json({
            views: db.stats.views,
            courseCount: db.courses.length,
            messageCount: db.messages.length,
            userCount: db.users.length,
            messages: db.messages.slice(-5).reverse(),
            users: db.users.slice(-5).reverse()
        });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    await readDB();
});
