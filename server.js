const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Bolt: In-memory cache to eliminate redundant disk I/O
let dbCache = null;

// Helper function to read database
const readDB = () => {
    if (dbCache) return dbCache;

    if (!fs.existsSync(DB_FILE)) {
        dbCache = { users: [], courses: [], messages: [], stats: { views: 0, tutorials: 0, comments: 0, earnings: 0 } };
        return dbCache;
    }

    // Performance optimization: synchronous read only on first load
    const data = fs.readFileSync(DB_FILE, 'utf8');
    dbCache = JSON.parse(data);
    return dbCache;
};

// Helper function to write to database
const writeDB = (data) => {
    dbCache = data;
    // Bolt: Asynchronous write to avoid blocking the event loop
    fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) console.error('Error writing to DB:', err);
    });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
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
        role
    };

    db.users.push(newUser);
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
        // Fallback for initial placeholder users if needed, but we'll re-register them or just use hashed passwords
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// GET /api/courses
app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses || []);
});

// POST /api/contact
app.post('/api/contact', (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = readDB();

    const newMessage = {
        id: (db.messages?.length || 0) + 1,
        firstName,
        lastName,
        email,
        message,
        date: new Date().toISOString()
    };

    if (!db.messages) db.messages = [];
    db.messages.push(newMessage);
    writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// GET /api/stats (Admin Only)
app.get('/api/stats', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const db = readDB();
        const stats = {
            ...db.stats,
            userCount: db.users.length,
            courseCount: db.courses.length,
            messageCount: db.messages?.length || 0,
            recentUsers: db.users.slice(-5).reverse(),
            recentMessages: db.messages?.slice(-5).reverse() || []
        };
        res.json(stats);
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
