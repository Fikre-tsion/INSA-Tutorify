const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Performance Optimization: In-memory DB cache and asynchronous write queue
let dbCache = null;
let writeQueue = Promise.resolve();

// Seed courses list
const INITIAL_COURSES = [
  { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './digitalmarketing.png', price: 'Free' },
  { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './digitalmarketing.png', price: 'Free' },
  { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './digitalmarketing.png', price: 'Free' },
  { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './digitalmarketing.png', price: 'Free' },
  { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset and goal setting.', image: './digitalmarketing.png', price: 'Free' },
  { id: 6, title: 'Responsive social Media UI design', description: 'Master layout techniques and styling for responsive user interfaces.', image: './digitalmarketing.png', price: 'Free' },
  { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn SEO, social media marketing, email marketing, and content strategy.', image: './digitalmarketing.png', price: 'Free' },
  { id: 8, title: 'How to be a confident and successful person', description: 'Learn self-confidence, communication skills, and personal growth strategies.', image: './digitalmarketing.png', price: 'Free' },
  { id: 9, title: 'Cloning Netflix Website', description: 'Build a responsive Netflix clone using HTML, CSS, and modern web techniques.', image: './digitalmarketing.png', price: 'Free' },
  { id: 10, title: 'Digital Newspaper Website Design', description: 'Design responsive news and article layouts with elegant typography.', image: './digitalmarketing.png', price: 'Free' },
  { id: 11, title: 'Logo and Graphic Designing', description: 'Learn design principles, color theory, and typography fundamentals.', image: './digitalmarketing.png', price: 'Free' },
  { id: 12, title: 'Advanced Dashboard UI Design', description: 'Create complex data dashboards and data visualization layouts.', image: './digitalmarketing.png', price: 'Free' },
  { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn blockchain fundamentals, smart contracts, and decentralized architectures.', image: './digitalmarketing.png', price: 'Free' },
  { id: 14, title: 'Fully functioning Contact Form Design', description: 'Build functional forms with CSS layout, validation, and backend submission.', image: './digitalmarketing.png', price: 'Free' },
  { id: 15, title: 'Landing Page Design', description: 'Create high-converting landing pages with modern styling techniques.', image: './digitalmarketing.png', price: 'Free' },
  { id: 16, title: 'World Class Portfolio Website development', description: 'Build a personalized showcase portfolio website to highlight your work.', image: './digitalmarketing.png', price: 'Free' },
  { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Design business management web interfaces for desktop and mobile.', image: './digitalmarketing.png', price: 'Free' },
  { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Design IoT smart home control dashboards and interactive components.', image: './digitalmarketing.png', price: 'Free' }
];

// Asynchronous non-blocking database reader with cache and migration
async function readDB() {
    if (dbCache) return dbCache;

    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: INITIAL_COURSES, messages: [], stats: { pageViews: 1504 } };
            await writeDB(dbCache);
        } else {
            const rawData = await fs.promises.readFile(DB_FILE, 'utf8');
            dbCache = JSON.parse(rawData);
        }
    } catch (err) {
        dbCache = { users: [], courses: INITIAL_COURSES, messages: [], stats: { pageViews: 1504 } };
    }

    // Ensure database migration/schema structure
    if (!Array.isArray(dbCache.users)) dbCache.users = [];
    if (!Array.isArray(dbCache.courses) || dbCache.courses.length === 0) dbCache.courses = INITIAL_COURSES;
    if (!Array.isArray(dbCache.messages)) dbCache.messages = [];
    if (!dbCache.stats) dbCache.stats = { pageViews: 1504 };

    // Seed default admin account if not present
    const adminExists = dbCache.users.some(u => u.email === 'admin@tutorify.com' || u.role === 'admin');
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        dbCache.users.push({
            id: dbCache.users.length + 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
        await writeDB(dbCache);
    }

    return dbCache;
}

// Serialized non-blocking database writer
async function writeDB(data) {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(err => {
        console.error('Error writing to db.json:', err);
    });
    return writeQueue;
}

// Authentication middleware for admin access
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err || !decoded || decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
        req.user = decoded;
        next();
    });
}

// Register endpoint - Enforces 'user' role to prevent privilege escalation
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
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
            role: 'user' // Security policy: force 'user' role on registration
        };

        db.users.push(newUser);
        await writeDB(db);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const db = await readDB();

        const user = db.users.find(u => u.email === email && (!role || u.role === role));
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
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/courses
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/contact - Handle contact form submissions
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }

        const db = await readDB();
        const newMessage = {
            id: db.messages.length + 1,
            sender: `${firstName || ''} ${lastName || ''}`.trim() || email,
            email,
            message,
            date: new Date().toLocaleDateString(),
            status: 'Delivered'
        };

        db.messages.unshift(newMessage);
        await writeDB(db);

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/stats/view - Record page view engagement
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        db.stats.pageViews = (db.stats.pageViews || 0) + 1;
        await writeDB(db);
        res.json({ success: true, pageViews: db.stats.pageViews });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/stats - Admin dashboard statistics
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await readDB();
        const userCount = db.users.filter(u => u.role === 'user').length;
        const courseCount = db.courses.length;
        const messageCount = db.messages.length;
        const pageViews = db.stats ? db.stats.pageViews : 1504;

        res.json({
            pageViews,
            courseCount,
            messageCount,
            userCount,
            messages: db.messages,
            recentUsers: db.users.slice(-5)
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
