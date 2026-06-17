const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
    console.error('FATAL: JWT_SECRET environment variable is not set!');
    process.exit(1);
}

const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Helper function to read database
const readDB = async () => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: [], courses: [], messages: [] };
    }
};

// Helper function to write to database
let dbQueue = Promise.resolve();
const writeDB = async (data) => {
    dbQueue = dbQueue.then(() => fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8'));
    return dbQueue;
};

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
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

// Stats endpoint (Admin only)
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    const stats = {
        users: db.users.length,
        courses: (db.courses || []).length,
        messages: (db.messages || []).length
    };
    res.json(stats);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
