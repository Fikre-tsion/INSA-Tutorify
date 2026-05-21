const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key_bolt_⚡';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

/**
 * BOLT OPTIMIZATION:
 * Using fs.promises for non-blocking I/O to prevent event loop blocking
 * and improve server responsiveness under load.
 */

// Helper function to read database
const readDB = async () => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return empty structure
        return { users: [], courses: [], contacts: [], stats: { views: 0, tutorials: 0, comments: 0, earnings: 0 }, tutors: [], customers: [] };
    }
};

// Helper function to write to database
const writeDB = async (data) => {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Authentication Middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// --- AUTH ENDPOINTS ---

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
        role
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

// --- DATA ENDPOINTS ---

// Get all courses
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();

    const newContact = {
        id: Date.now(),
        firstName,
        lastName,
        email,
        message,
        date: new Date().toISOString()
    };

    if (!db.contacts) db.contacts = [];
    db.contacts.push(newContact);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Admin stats
app.get('/api/admin/stats', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
    }
    const db = await readDB();
    res.json({
        stats: db.stats || { views: 0, tutorials: 0, comments: 0, earnings: 0 },
        tutors: db.tutors || [],
        customers: db.customers || []
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
