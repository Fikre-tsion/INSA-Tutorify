const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
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

// In-memory cache for database (Bolt ⚡ optimization)
let dbCache = null;

// Helper function to read database
const readDB = async () => {
    if (dbCache) return dbCache; // Return cached data if available

    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        return dbCache;
    } catch (error) {
        // If file doesn't exist, return default structure
        return { users: [], courses: [], messages: [], stats: { views: 0 } };
    }
};

// Helper function to write to database
const writeDB = async (data) => {
    dbCache = data; // Update cache
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
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
        id: db.users.length + 1,
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
        // Fallback for initial placeholder users if needed, but we'll re-register them or just use hashed passwords
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Get all courses
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();

    const newMessage = {
        id: (db.messages?.length || 0) + 1,
        name: `${firstName} ${lastName}`,
        email,
        message,
        date: new Date().toISOString()
    };

    if (!db.messages) db.messages = [];
    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Track page view
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    if (!db.stats) db.stats = { views: 0 };
    db.stats.views++;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

// Get admin stats
app.get('/api/stats', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const db = await readDB();
        const stats = {
            views: db.stats?.views || 0,
            courseCount: db.courses?.length || 0,
            messageCount: db.messages?.length || 0,
            userCount: db.users?.length || 0,
            messages: db.messages || [],
            users: db.users?.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })) || []
        };
        res.json(stats);
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
