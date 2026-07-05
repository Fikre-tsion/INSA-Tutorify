const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && !SECRET_KEY) {
    console.error('FATAL: JWT_SECRET environment variable is required in production');
    process.exit(1);
}

const DEV_SECRET = 'dev_secret';
const getSecret = () => SECRET_KEY || DEV_SECRET;

const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Helper function to read database with migration/seeding
const readDB = () => {
    let db = { users: [], courses: [], messages: [], stats: { views: 0, courseCount: 0, messageCount: 0, userCount: 0 } };
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            db = JSON.parse(data);
        } catch (e) {
            console.error("Error reading DB, using defaults", e);
        }
    }

    // Migration: ensure keys exist
    if (!db.users) db.users = [];
    if (!db.courses) db.courses = [];
    if (!db.messages) db.messages = [];
    if (!db.stats) db.stats = { views: 0, courseCount: 0, messageCount: 0, userCount: 0 };

    return db;
};

// Helper function to write to database
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Auth middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, getSecret(), (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Failed to authenticate token' });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password: hashedPassword,
        role: 'user' // Security: hardcode user role for registration
    };

    db.users.push(newUser);
    db.stats.userCount = db.users.length;
    writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.email === email && u.role === role);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, getSecret(), { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Courses endpoint
app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses);
});

// Stats endpoint (Admin only)
app.get('/api/stats', authenticate, (req, res) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    const db = readDB();
    res.json({
        ...db.stats,
        messages: db.messages,
        users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
});

// Record page view
app.post('/api/stats/view', (req, res) => {
    const db = readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    writeDB(db);
    res.json({ views: db.stats.views });
});

// Contact endpoint
app.post('/api/contact', (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({ message: 'Email and message are required' });
    }
    const db = readDB();
    const newMessage = {
        id: Date.now(),
        name: `${firstName} ${lastName}`,
        email,
        message,
        date: new Date().toISOString()
    };
    db.messages.push(newMessage);
    db.stats.messageCount = db.messages.length;
    writeDB(db);
    res.status(201).json({ message: 'Message sent successfully' });
});

// Serve frontend files explicitly to avoid exposing db.json/server.js
const publicFiles = [
    'index.html', 'about.html', 'courses.html', 'contact.html', 'login.html',
    'dashboard.html', 'dashboard.css', 'main.js', 'dashboard.js', 'digitalmarketing.png',
    'privacy.html', 'refund.html', 'terms.html'
];

publicFiles.forEach(file => {
    app.get(`/${file}`, (req, res) => res.sendFile(path.join(__dirname, file)));
});

// Also serve CSS and images directories if they exist
if (fs.existsSync(path.join(__dirname, 'CSS'))) {
    app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
}
if (fs.existsSync(path.join(__dirname, 'images'))) {
    app.use('/images', express.static(path.join(__dirname, 'images')));
}
if (fs.existsSync(path.join(__dirname, 'images2'))) {
    app.use('/images2', express.static(path.join(__dirname, 'images2')));
}

// Default route
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
