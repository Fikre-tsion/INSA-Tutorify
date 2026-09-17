const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';
const DB_FILE = path.join(__dirname, 'db.json');

let dbCache = null;
let writeQueue = Promise.resolve();

const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset and goal setting.', image: './images/course5.jpg' },
    { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO and social media marketing.', image: './digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success.', image: './images/self.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
    { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing.', image: './images/course11.jpg' },
    { id: 12, title: 'Responsive Admin Dashboard UI Design Pro', description: 'Advanced responsive dashboard layout and component design.', image: './images/course12.jpg' },
    { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, smart contracts, and dApps.', image: './images/blockchain.png' },
    { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML and CSS.', image: './images/course14.jpg' },
    { id: 15, title: 'Landing Page Design', description: 'Learn how to create high-converting responsive landing page designs.', image: './images/course15.jpg' },
    { id: 16, title: 'World Class Portfolio Website development', description: 'Build a high quality developer portfolio from scratch.', image: './images/course16.jpg' },
    { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Create responsive business manager dashboard UIs.', image: './images/course17.jpg' },
    { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Design modern UI components for IoT and smart home control apps.', image: './images/course18.jpg' }
];

// Helper function to read database asynchronously with cache and seeding
async function readDB() {
    if (dbCache) return dbCache;

    let db = { users: [], courses: [], messages: [], stats: { views: 0 } };
    if (fsSync.existsSync(DB_FILE)) {
        try {
            const data = await fs.readFile(DB_FILE, 'utf8');
            if (data.trim()) {
                db = JSON.parse(data);
            }
        } catch (err) {
            console.error('Error reading db.json, reinitializing...', err);
        }
    }

    if (!Array.isArray(db.users)) db.users = [];
    if (!Array.isArray(db.courses)) db.courses = [];
    if (!Array.isArray(db.messages)) db.messages = [];
    if (!db.stats || typeof db.stats !== 'object') db.stats = { views: 0 };

    // Seed Admin Account if missing
    let admin = db.users.find(u => u.email === 'admin@tutorify.com' || u.role === 'admin');
    if (!admin) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        admin = {
            id: 1,
            name: 'System Admin',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        };
        db.users.push(admin);
    }

    // Seed Courses if empty
    if (db.courses.length === 0) {
        db.courses = initialCourses;
    }

    dbCache = db;
    await writeDB(dbCache);
    return dbCache;
}

// Helper function to write to database safely using writeQueue
async function writeDB(data) {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        try {
            await fs.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
        } catch (err) {
            console.error('Failed writing to db.json:', err);
        }
    }).catch(() => {});
    return writeQueue;
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Block direct access to db.json and server.js
app.use((req, res, next) => {
    if (req.path === '/db.json' || req.path === '/server.js') {
        return res.status(403).json({ message: 'Access forbidden' });
    }
    next();
});

app.use(express.static(__dirname));

// Auth Middleware for Admin
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token missing' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

// Register endpoint - Enforces 'user' role to prevent privilege escalation
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const db = await readDB();

        if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now(),
            name,
            email,
            password: hashedPassword,
            role: 'user' // Hardcoded for security
        };

        db.users.push(newUser);
        await writeDB(db);

        res.status(201).json({
            message: 'User registered successfully',
            user: { name: newUser.name, email: newUser.email, role: newUser.role }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const db = await readDB();
        const user = db.users.find(u =>
            u.email.toLowerCase() === email.toLowerCase() &&
            (!role || u.role === role)
        );

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
            { expiresIn: '2h' }
        );

        res.json({
            token,
            user: { name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get Courses endpoint
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses || []);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch courses' });
    }
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, name, email, message } = req.body;
        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }

        const senderName = (name || `${firstName || ''} ${lastName || ''}`).trim() || 'Anonymous Student';
        const db = await readDB();

        const newMessage = {
            id: Date.now(),
            name: senderName,
            email,
            message,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        };

        db.messages.push(newMessage);
        await writeDB(db);

        res.status(201).json({ message: 'Message sent successfully', contact: newMessage });
    } catch (err) {
        res.status(500).json({ message: 'Failed to submit contact message' });
    }
});

// Record Page View endpoint
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        db.stats.views = (db.stats.views || 0) + 1;
        await writeDB(db);
        res.json({ message: 'Page view recorded', views: db.stats.views });
    } catch (err) {
        res.status(500).json({ message: 'Failed to record page view' });
    }
});

// Admin Stats endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await readDB();
        res.json({
            views: db.stats.views || 0,
            tutorialsCount: db.courses.length,
            messagesCount: db.messages.length,
            usersCount: db.users.length,
            messages: db.messages || [],
            users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch statistics' });
    }
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
