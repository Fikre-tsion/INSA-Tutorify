const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
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

// Performance Optimization: In-memory DB cache and serialized async write queue
let dbCache = null;
let writeQueue = Promise.resolve();

// Async helper function to read database with in-memory caching
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }
    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: [], messages: [], stats: { views: 0 } };
            await fs.promises.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
            return dbCache;
        }
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        if (!dbCache.users) dbCache.users = [];
        if (!dbCache.courses) dbCache.courses = [];
        if (!dbCache.messages) dbCache.messages = [];
        if (!dbCache.stats) dbCache.stats = { views: 0 };
        return dbCache;
    } catch (err) {
        console.error('Error reading DB:', err);
        return dbCache || { users: [], courses: [], messages: [], stats: { views: 0 } };
    }
};

// Async helper function to write to database without blocking event loop
const writeDB = async (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(err => {
        console.error('Error writing DB asynchronously:', err);
    });
    return writeQueue;
};

// Middleware to authenticate JWT token and ensure admin role
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token missing' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err || user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
        req.user = user;
        next();
    });
};

// Seed default admin and sample data if not present
const initializeDB = async () => {
    const db = await readDB();
    let modified = false;

    // Seed default admin user
    if (!db.users.find(u => u.role === 'admin')) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.users.push({
            id: db.users.length + 1,
            name: 'Admin',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
        modified = true;
    }

    // Seed initial courses if empty
    if (!db.courses || db.courses.length === 0) {
        db.courses = [
            { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './digitalmarketing.png' },
            { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './digitalmarketing.png' },
            { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './digitalmarketing.png' }
        ];
        modified = true;
    }

    if (modified) {
        await writeDB(db);
    }
};

// Initialize DB on startup
initializeDB();

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = await readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Security Fix: Always assign 'user' role on public registration to prevent privilege escalation
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

// Courses API
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Contact API
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({ message: 'Email and message are required' });
    }

    const db = await readDB();
    const newMessage = {
        id: (db.messages ? db.messages.length : 0) + 1,
        name: name || 'Anonymous',
        email,
        message,
        date: new Date().toISOString()
    };

    if (!db.messages) db.messages = [];
    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message submitted successfully' });
});

// Admin Stats API
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    const totalUsers = db.users ? db.users.length : 0;
    const totalCourses = db.courses ? db.courses.length : 0;
    const totalMessages = db.messages ? db.messages.length : 0;
    const views = (db.stats && db.stats.views) ? db.stats.views : 1504;

    res.json({
        usersCount: totalUsers,
        coursesCount: totalCourses,
        messagesCount: totalMessages,
        profileViews: views,
        recentMessages: db.messages ? db.messages.slice(-5).reverse() : []
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
