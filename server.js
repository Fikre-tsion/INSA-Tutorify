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

// Security check: ensure JWT_SECRET is set in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable is not set!');
    process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Performance: In-memory cache for db.json to eliminate redundant disk reads
let cachedDB = null;

// Helper function to read database with caching
const readDB = async () => {
    if (cachedDB) return cachedDB;
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        cachedDB = JSON.parse(data);
        return cachedDB;
    } catch (err) {
        cachedDB = { users: [], courses: [], messages: [] };
        return cachedDB;
    }
};

// Helper function to write to database and update cache
const writeDB = async (data) => {
    cachedDB = data;
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Middleware for JWT Verification
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

// Middleware for Admin role check
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
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

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        SECRET_KEY,
        { expiresIn: '1h' }
    );
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Get all courses
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();

    const newMessage = {
        id: Date.now(),
        firstName,
        lastName,
        email,
        message,
        date: new Date().toISOString()
    };

    if (!db.messages) db.messages = [];
    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Admin stats
app.get('/api/stats', verifyToken, isAdmin, async (req, res) => {
    const db = await readDB();
    const stats = {
        users: db.users.length,
        courses: db.courses?.length || 0,
        messages: db.messages?.length || 0
    };
    res.json(stats);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
