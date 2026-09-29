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

// Performance: In-memory DB Cache and serialized Async Write Queue
let dbCache = null;
let writeQueue = Promise.resolve();

/**
 * Asynchronously read database with in-memory caching to avoid blocking the event loop and redundant disk I/O.
 */
async function readDB() {
    if (dbCache) {
        return dbCache;
    }
    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: [], messages: [], stats: { profileViews: 1504, tutorials: 18, comments: 284, earnings: 7842 } };
            await writeDB(dbCache);
            return dbCache;
        }
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        return dbCache;
    } catch (error) {
        console.error('Error reading DB:', error);
        return { users: [], courses: [], messages: [], stats: { profileViews: 1504, tutorials: 18, comments: 284, earnings: 7842 } };
    }
}

/**
 * Asynchronously write to database with queue serialization to prevent concurrent file corruption.
 */
async function writeDB(data) {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(err => console.error('Error writing DB queue:', err));
    return writeQueue;
}

// Initial default courses seed
const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', category: 'Web Development', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 2, title: 'Responsive SmartHome Website Design', category: 'Web Development', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', category: 'Web Development', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 4, title: 'Blockchain Fundamentals', category: 'Blockchain', description: 'Master smart contracts, dApps, and decentralized technologies.', image: './digitalmarketing.png' },
    { id: 5, title: 'Python Programming Masterclass', category: 'Programming', description: 'Learn Python from scratch with hands-on projects and data structures.', image: './digitalmarketing.png' },
    { id: 6, title: 'Digital Marketing & SEO Strategy', category: 'Marketing', description: 'Boost brand presence and optimize search rankings effectively.', image: './digitalmarketing.png' }
];

// Database migration & seeding
async function initDB() {
    const db = await readDB();
    let updated = false;

    if (!db.users) { db.users = []; updated = true; }
    if (!db.courses || db.courses.length === 0) { db.courses = initialCourses; updated = true; }
    if (!db.messages) { db.messages = []; updated = true; }
    if (!db.stats) { db.stats = { profileViews: 1504, tutorials: 18, comments: 284, earnings: 7842 }; updated = true; }

    // Seed default admin if missing
    const hasAdmin = db.users.some(u => u.role === 'admin');
    if (!hasAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.users.push({
            id: db.users.length + 1,
            name: 'System Admin',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
        updated = true;
    }

    if (updated) {
        await writeDB(db);
    }
}

// Middleware: Authenticate JWT and check admin role
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token missing' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
        req.user = user;
        next();
    });
}

// Public API Endpoints

// Register endpoint (Security Policy: Hardcode role to 'user')
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

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
        role: 'user' // Hardcoded for security against privilege escalation
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = await readDB();

    const user = db.users.find(u => u.email === email && (role ? u.role === role : true));
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

// Get courses endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json({ courses: db.courses || [] });
});

// Post contact message endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const db = await readDB();
    const newMessage = {
        id: (db.messages ? db.messages.length : 0) + 1,
        sender: `${firstName} ${lastName || ''}`.trim(),
        email,
        message,
        date: new Date().toISOString().split('T')[0],
        status: 'Unread'
    };

    if (!db.messages) db.messages = [];
    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message submitted successfully' });
});

// Increment profile views / page views count
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    if (!db.stats) db.stats = { profileViews: 0, tutorials: 18, comments: 284, earnings: 7842 };
    db.stats.profileViews = (db.stats.profileViews || 0) + 1;
    await writeDB(db);
    res.json({ profileViews: db.stats.profileViews });
});

// Admin-only stats endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        stats: db.stats || { profileViews: 0, tutorials: 0, comments: 0, earnings: 0 },
        users: (db.users || []).map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
        messages: db.messages || []
    });
});

app.listen(PORT, async () => {
    await initDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
