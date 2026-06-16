const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Use a robust secret from env or throw error in production
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    console.error('FATAL: JWT_SECRET environment variable is not set!');
    process.exit(1);
}

const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Security: Whitelist static files to prevent exposure of sensitive files like db.json or server.js
const publicFiles = ['index.html', 'about.html', 'courses.html', 'contact.html', 'login.html', 'dashboard.html', 'dashboard.js', 'main.js', 'privacy.html', 'terms.html', 'refund.html', 'dashboard.css'];
publicFiles.forEach(file => {
    app.get(`/${file}`, (req, res) => res.sendFile(path.join(__dirname, file)));
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images2', express.static(path.join(__dirname, 'images2')));

// In-memory cache for db.json to reduce disk I/O
let dbCache = null;

// Helper function to read database with caching
const readDB = async () => {
    if (dbCache) return dbCache;
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        return dbCache;
    } catch (error) {
        return { users: [], courses: [], messages: [] };
    }
};

// Queue for database writes to prevent corruption
let dbQueue = Promise.resolve();

// Helper function to write to database with cache invalidation
const writeDB = async (data) => {
    dbCache = data;
    dbQueue = dbQueue.then(() => fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8'));
    return dbQueue;
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Admin only middleware
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admins only.' });
    }
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
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
        role: 'user' // Security: Default to 'user', don't trust client-supplied role
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

// Courses endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    const db = await readDB();

    if (!db.messages) db.messages = [];

    const newMessage = {
        id: db.messages.length + 1,
        name,
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Stats endpoint (Admin only)
app.get('/api/stats', authenticateToken, isAdmin, async (req, res) => {
    const db = await readDB();
    const stats = {
        users: db.users.length,
        courses: db.courses.length,
        messages: db.messages ? db.messages.length : 0
    };
    res.json(stats);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
