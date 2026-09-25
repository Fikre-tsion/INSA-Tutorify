const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key_tutorify_2025';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Performance Optimization: In-memory cache & serialized write queue to prevent blocking Node event loop
let dbCache = null;
let writeQueue = Promise.resolve();

const initialCourses = [
    {
        id: 1,
        title: "Responsive Social Media Website UI Design",
        category: "Graphic Design",
        description: "Learn how to create a responsive social media website UI design using HTML and CSS. Covers layout techniques and styling.",
        image: "./images/course1.jpg"
    },
    {
        id: 2,
        title: "Responsive SmartHome Website Design",
        category: "Web Development",
        description: "Learn how to create a responsive SmartHome website design using HTML and CSS. Covers layout techniques and responsive design.",
        image: "./images/course2.jpg"
    },
    {
        id: 3,
        title: "Responsive Admin Dashboard UI Design",
        category: "Web Development",
        description: "Learn how to create a responsive Admin Dashboard UI design using HTML, CSS, and JavaScript.",
        image: "./images/course3.jpg"
    },
    {
        id: 4,
        title: "Blockchain & Smart Contract Basics",
        category: "Blockchain",
        description: "Master blockchain fundamentals, Solidity smart contracts, and decentralized app development.",
        image: "./images/course4.jpg"
    },
    {
        id: 5,
        title: "Python Programming Masterclass",
        category: "Programming",
        description: "Comprehensive guide to Python from basic syntax to object-oriented programming and data handling.",
        image: "./images/course5.jpg"
    },
    {
        id: 6,
        title: "Financial Literacy & Digital Marketing",
        category: "Finance and Marketing",
        description: "Learn essential budgeting, marketing analytics, and investment strategies for personal and business growth.",
        image: "./digitalmarketing.png"
    }
];

// Helper function to read database asynchronously with caching
async function readDB() {
    if (dbCache) return dbCache;

    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
    } catch (err) {
        dbCache = { users: [], courses: [], messages: [], stats: { views: 1504 } };
    }

    // Ensure schema migration / defaults
    if (!dbCache.users) dbCache.users = [];
    if (!dbCache.courses || dbCache.courses.length === 0) dbCache.courses = initialCourses;
    if (!dbCache.messages) dbCache.messages = [];
    if (!dbCache.stats) dbCache.stats = { views: 1504 };

    // Seed default admin account if not present
    const hasAdmin = dbCache.users.some(u => u.role === 'admin');
    if (!hasAdmin) {
        const hashedAdminPassword = await bcrypt.hash('admin123', 10);
        dbCache.users.push({
            id: dbCache.users.length + 1,
            name: "Admin User",
            email: "admin@tutorify.com",
            password: hashedAdminPassword,
            role: "admin"
        });
        await writeDB(dbCache);
    }

    return dbCache;
}

// Helper function to write database asynchronously using a queue to avoid race conditions
async function writeDB(data) {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        try {
            await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error('Error writing to DB file:', err);
        }
    }).catch(() => {});
    return writeQueue;
}

// Middleware: Authenticate Admin JWT Token
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Authentication token required' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin authorization required' });
        }
        req.user = user;
        next();
    });
}

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const db = await readDB();

        if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Security: hardcode role to 'user' for public registration to prevent privilege escalation
        const newUser = {
            id: db.users.length + 1,
            name,
            email,
            password: hashedPassword,
            role: 'user'
        };

        db.users.push(newUser);
        await writeDB(db);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const db = await readDB();
        const targetRole = role || 'user';
        const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === targetRole);

        if (!user) {
            return res.status(400).json({ message: 'Invalid email, password or role' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email, password or role' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            SECRET_KEY,
            { expiresIn: '2h' }
        );

        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/courses
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses || []);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch courses' });
    }
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        if (!firstName || !email || !message) {
            return res.status(400).json({ message: 'First name, email, and message are required' });
        }

        const db = await readDB();
        const newMessage = {
            id: (db.messages.length || 0) + 1,
            sender: `${firstName} ${lastName || ''}`.trim(),
            email,
            message,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        };

        db.messages.unshift(newMessage);
        await writeDB(db);

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to record message' });
    }
});

// GET /api/stats (Protected Admin Endpoint)
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await readDB();
        res.json({
            views: db.stats ? db.stats.views : 1504,
            coursesCount: db.courses ? db.courses.length : 0,
            messagesCount: db.messages ? db.messages.length : 0,
            usersCount: db.users ? db.users.length : 0,
            messages: db.messages || []
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

// POST /api/stats/view
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        if (!db.stats) db.stats = { views: 0 };
        db.stats.views = (db.stats.views || 0) + 1;
        await writeDB(db);
        res.json({ views: db.stats.views });
    } catch (err) {
        res.status(500).json({ message: 'Failed to record view' });
    }
});

app.listen(PORT, async () => {
    await readDB(); // Pre-warm cache and seed admin on startup
    console.log(`Server is running on http://localhost:${PORT}`);
});
