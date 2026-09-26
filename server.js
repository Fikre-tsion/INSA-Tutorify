const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key_default_fallback_12345';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Performance optimization: In-memory cache for fast JSON reads without disk I/O latency
let dbCache = null;
let writeQueue = Promise.resolve();

// Helper function to read database asynchronously with caching
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }
    try {
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        if (!dbCache.users) dbCache.users = [];
        if (!dbCache.courses) dbCache.courses = [];
        if (!dbCache.messages) dbCache.messages = [];
        if (!dbCache.stats) dbCache.stats = { views: 1504, tutorials: 80, comments: 284, earnings: 7842 };
        return dbCache;
    } catch (error) {
        if (error.code === 'ENOENT') {
            dbCache = {
                users: [],
                courses: [],
                messages: [],
                stats: { views: 1504, tutorials: 80, comments: 284, earnings: 7842 }
            };
            return dbCache;
        }
        throw error;
    }
};

// Helper function to write to database asynchronously with queue serialization
const writeDB = async (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch((err) => {
        console.error('Error writing DB file:', err);
    });
    return writeQueue;
};

// Authentication Middleware for Protected Routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token missing' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin privilege required' });
        }
    });
};

// Auth API Endpoints
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = await readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Security enforcement: hardcode 'user' role for registration to prevent privilege escalation
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

// Courses API Endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Contact API Endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const db = await readDB();
    const newContact = {
        id: db.messages.length + 1,
        sender: `${firstName} ${lastName || ''}`.trim(),
        email,
        message,
        date: new Date().toISOString().split('T')[0],
        status: 'Unread'
    };

    db.messages.unshift(newContact);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Admin Stats API Endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        stats: db.stats,
        recentMessages: db.messages.slice(0, 5),
        userCount: db.users.length
    });
});

// Page view tracker
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

if (require.main === module) {
    app.listen(PORT, async () => {
        await readDB();
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = { app, readDB, writeDB, SECRET_KEY, DB_FILE };
