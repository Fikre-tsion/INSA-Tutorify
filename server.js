const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
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

// In-memory cache for fast asynchronous database access
let dbCache = null;

// Helper function to read database with in-memory caching and non-blocking I/O
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
    } catch (error) {
        dbCache = { users: [], courses: [], contacts: [], stats: { profileViews: 1504 } };
    }
    if (!dbCache.users) dbCache.users = [];
    if (!dbCache.courses) dbCache.courses = [];
    if (!dbCache.contacts) dbCache.contacts = [];
    if (!dbCache.stats) dbCache.stats = { profileViews: 1504 };
    return dbCache;
};

// Serialized asynchronous write queue to safely write db.json without blocking or file corruption
let writeQueue = Promise.resolve();
const writeDB = async (data) => {
    dbCache = data;
    writeQueue = writeQueue.catch(() => {}).then(async () => {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    });
    return writeQueue;
};

// Seed initial data if missing
const seedInitialData = async () => {
    const db = await readDB();
    let updated = false;

    // Seed default admin user if missing
    if (!db.users.find(u => u.email === 'admin@tutorify.com')) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        db.users.push({
            id: db.users.length + 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
        updated = true;
    }

    if (updated) {
        await writeDB(db);
    }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token required' });

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
            res.status(403).json({ message: 'Admin access required' });
        }
    });
};

// Register endpoint (hardcodes 'user' role for self-registration to prevent privilege escalation)
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

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
        role: 'user'
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = await readDB();
    const targetRole = role || 'user';
    const user = db.users.find(u => u.email === email && u.role === targetRole);
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

// Courses endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Admin stats endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    const stats = {
        profileViews: (db.stats && db.stats.profileViews ? db.stats.profileViews : 1504).toLocaleString(),
        tutorials: (db.courses || []).length,
        comments: "284",
        earnings: "7,842",
        usersCount: (db.users || []).length,
        contactsCount: (db.contacts || []).length,
        recentContacts: (db.contacts || []).slice(-10).reverse()
    };
    res.json(stats);
});

// Record page view endpoint
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    if (!db.stats) db.stats = { profileViews: 1504 };
    db.stats.profileViews = (db.stats.profileViews || 1504) + 1;
    await writeDB(db);
    res.json({ success: true, profileViews: db.stats.profileViews });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !lastName || !email || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const db = await readDB();
    const newContact = {
        id: (db.contacts || []).length + 1,
        firstName,
        lastName,
        email,
        message,
        date: new Date().toISOString()
    };

    db.contacts.push(newContact);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

app.listen(PORT, async () => {
    await seedInitialData();
    console.log(`Server is running on http://localhost:${PORT}`);
});
