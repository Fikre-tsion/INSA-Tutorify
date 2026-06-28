const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Default data structure
const DEFAULT_DB = {
    users: [],
    courses: [
        { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/digitalmarketing.png' },
        { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/digitalmarketing.png' },
        { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/digitalmarketing.png' }
    ],
    messages: [],
    stats: { views: 0 }
};

// Helper function to read database
const readDB = async () => {
    try {
        try {
            await fs.access(DB_FILE);
        } catch {
            await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
            return DEFAULT_DB;
        }
        const data = await fs.readFile(DB_FILE, 'utf8');
        const parsed = JSON.parse(data);
        return { ...DEFAULT_DB, ...parsed };
    } catch (error) {
        console.error('Error reading DB:', error);
        return DEFAULT_DB;
    }
};

// Helper function to write to database
const writeDB = async (data) => {
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing DB:', error);
    }
};

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
};

// API Endpoints

// Get Courses
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

// Register
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

// Login
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

// Contact Submission
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();

    const newMessage = {
        id: Date.now(),
        name: `${firstName} ${lastName}`,
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.json({ message: 'Message sent successfully' });
});

// Stats view tracking
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

// Admin Stats
app.get('/api/stats', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const db = await readDB();
    res.json({
        views: db.stats.views,
        courseCount: db.courses.length,
        messageCount: db.messages.length,
        userCount: db.users.length,
        messages: db.messages.slice(-5).reverse(), // Last 5 messages
        users: db.users.slice(-5).reverse() // Last 5 users
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
