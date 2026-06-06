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

/**
 * BOLT OPTIMIZATION: In-memory Database Cache
 * Why: Reduces disk I/O latency for every API request.
 * Impact: GET requests are served instantly from memory (~0ms I/O).
 */
let dbCache = null;
let isWriting = false;
const writeQueue = [];

const readDB = async () => {
    if (dbCache) return dbCache;
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
    } catch (error) {
        dbCache = { users: [], courses: [], contacts: [] };
    }
    return dbCache;
};

const writeDB = async (data) => {
    dbCache = data; // Update cache immediately
    writeQueue.push(async () => {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    });
    processWriteQueue();
};

const processWriteQueue = async () => {
    if (isWriting || writeQueue.length === 0) return;
    isWriting = true;
    const nextWrite = writeQueue.shift();
    try {
        await nextWrite();
    } catch (err) {
        console.error("Database write error:", err);
    } finally {
        isWriting = false;
        processWriteQueue();
    }
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Courses endpoint
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses || []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        const db = await readDB();

        if (!db.contacts) db.contacts = [];

        const newContact = {
            id: Date.now(),
            firstName,
            lastName,
            email,
            message,
            date: new Date().toISOString()
        };

        db.contacts.push(newContact);
        await writeDB(db);

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending message' });
    }
});

// Dashboard stats endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const db = await readDB();
        const stats = {
            usersCount: db.users.length,
            coursesCount: (db.courses || []).length,
            contactsCount: (db.contacts || []).length,
            recentUsers: db.users.slice(-5).reverse()
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
