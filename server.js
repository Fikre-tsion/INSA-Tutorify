const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
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

// Performance Optimization: In-memory cache for fast O(1) database reads without disk I/O on every request
let dbCache = null;
let writeQueue = Promise.resolve();

// Initial course catalogue data for database seeding
const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/digitalmarketing.png' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/digitalmarketing.png' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/digitalmarketing.png' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/digitalmarketing.png' },
    { id: 5, title: 'Fundamentals of Digital Marketing', description: 'Learn SEO, social media marketing, email marketing, and content marketing.', image: './images/digitalmarketing.png' },
    { id: 6, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, including architecture and consensus mechanisms.', image: './images/digitalmarketing.png' }
];

/**
 * Asynchronously read database into memory cache.
 * Avoids blocking the Node.js event loop with synchronous fs reads.
 */
const readDB = async () => {
    if (dbCache) return dbCache;

    try {
        if (!fsSync.existsSync(DB_FILE)) {
            dbCache = {
                users: [],
                courses: initialCourses,
                messages: [],
                stats: { views: 0 }
            };
            await writeDB(dbCache);
        } else {
            const data = await fs.readFile(DB_FILE, 'utf8');
            dbCache = JSON.parse(data);
        }
    } catch (err) {
        dbCache = { users: [], courses: initialCourses, messages: [], stats: { views: 0 } };
    }

    // Schema migrations & defaults
    if (!dbCache.users) dbCache.users = [];
    if (!dbCache.courses || dbCache.courses.length === 0) dbCache.courses = initialCourses;
    if (!dbCache.messages) dbCache.messages = [];
    if (!dbCache.stats) dbCache.stats = { views: 0 };

    // Seed default admin account if not present
    const hasAdmin = dbCache.users.some(u => u.email === 'admin@tutorify.com' || u.role === 'admin');
    if (!hasAdmin) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        dbCache.users.push({
            id: dbCache.users.length + 1,
            name: 'System Admin',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
        await writeDB(dbCache);
    }

    return dbCache;
};

/**
 * Asynchronously persist memory cache to disk using non-blocking I/O.
 * Uses a promise queue to serialize write calls and prevent file corruptions.
 */
const writeDB = (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        try {
            await fs.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
        } catch (err) {
            console.error('Failed to persist db.json:', err);
        }
    });
    return writeQueue;
};

// Middleware: JWT Verification for Admin Access
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Authentication token required' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err || !user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admin role required' });
        }
        req.user = user;
        next();
    });
};

// POST /api/register
app.post('/api/register', async (req, res) => {
    try {
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
            role: role === 'admin' ? 'admin' : 'user'
        };

        db.users.push(newUser);
        await writeDB(db);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error during registration' });
    }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const db = await readDB();

        const user = db.users.find(u => u.email === email && (!role || u.role === role));
        if (!user) {
            return res.status(400).json({ message: 'Invalid email, password or role' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email, password or role' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error during login' });
    }
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }

        const db = await readDB();
        const newMessage = {
            id: db.messages.length + 1,
            firstName: firstName || 'Anonymous',
            lastName: lastName || '',
            email,
            message,
            createdAt: new Date().toISOString(),
            status: 'Received'
        };

        db.messages.push(newMessage);
        await writeDB(db);

        res.status(201).json({ message: 'Contact message received successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to record contact message' });
    }
});

// POST /api/stats/view - Increments page view counter
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        db.stats.views = (db.stats.views || 0) + 1;
        await writeDB(db);
        res.json({ views: db.stats.views });
    } catch (err) {
        res.status(500).json({ message: 'Error recording page view' });
    }
});

// GET /api/stats - Protected Admin Dashboard Stats
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await readDB();
        res.json({
            views: db.stats.views || 0,
            courseCount: db.courses.length,
            messageCount: db.messages.length,
            userCount: db.users.length,
            messages: db.messages,
            users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server running on http://localhost:${PORT}`);
});
