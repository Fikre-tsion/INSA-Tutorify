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

// Performance Optimization: In-memory cache for db.json
let dbCache = null;

const readDB = async () => {
    if (dbCache) return dbCache;

    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);

        // Migration/Initialization
        if (!dbCache.users) dbCache.users = [];
        if (!dbCache.courses) dbCache.courses = [];
        if (!dbCache.messages) dbCache.messages = [];
        if (!dbCache.stats) dbCache.stats = { views: 0 };

        return dbCache;
    } catch (error) {
        dbCache = { users: [], courses: [], messages: [], stats: { views: 0 } };
        return dbCache;
    }
};

const writeDB = async (data) => {
    dbCache = data;
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Middleware for Admin Auth
const authenticateAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Failed to authenticate token' });
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'Requires admin role' });
        req.userId = decoded.id;
        next();
    });
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
        id: Date.now(),
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

// Get Courses
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Submit Contact Form
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();

    const newMessage = {
        id: Date.now(),
        name: `${firstName} ${lastName}`,
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Record Page View
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    if (!db.stats) db.stats = { views: 0 };
    db.stats.views++;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

// Get Admin Stats
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        views: db.stats.views,
        courseCount: db.courses.length,
        messageCount: db.messages.length,
        userCount: db.users.length,
        messages: db.messages.slice(-5).reverse(), // Last 5 messages
        users: db.users.slice(-5).reverse() // Last 5 users
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
