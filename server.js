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

// In-memory cache and serialized write queue to avoid event-loop blocking and race conditions
let dbCache = null;
let writeQueue = Promise.resolve();

// Initial database seeding structure
const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, mindset, goal setting, and effective communication.', image: './images/course5.jpg' },
    { id: 6, title: 'Responsive social Media UI design', description: 'Learn layout techniques, styling, and best practices for social media UIs.', image: './images/course6.jpg' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn SEO, social media marketing, email marketing, and content marketing.', image: './digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Enhance your personal and professional confidence through structured learning.', image: './images/self.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to build a responsive Netflix UI clone using modern web techniques.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Master responsive grid layouts and editorial article styling.', image: './images/course10.jpg' },
    { id: 11, title: 'Logo and Graphic Designing', description: 'Discover design principles, color theory, and typography basics.', image: './images/course11.jpg' },
    { id: 12, title: 'Responsive Admin Dashboard UI Design (Advanced)', description: 'Build scalable administrative user interfaces with interactive tables.', image: './images/course12.jpg' },
    { id: 13, title: 'Introduction to Blockchain Technology', description: 'Understand blockchain architecture, smart contracts, and decentralized systems.', image: './images/blockchain.png' },
    { id: 14, title: 'Fully functioning Contact Form Design', description: 'Build interactive, accessible, and responsive user contact forms.', image: './images/course14.jpg' },
    { id: 15, title: 'Landing Page Design', description: 'Create high-converting landing pages using HTML5 and CSS3.', image: './images/course15.jpg' },
    { id: 16, title: 'World Class Portfolio Website development', description: 'Design and deploy showcase personal portfolios to stand out.', image: './images/course16.jpg' },
    { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Master business analytics views and responsive chart containers.', image: './images/course17.jpg' },
    { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Design smart home controller widgets and IoT mobile-first layouts.', image: './images/course18.jpg' }
];

// Async read DB with memory caching
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }
    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: initialCourses, messages: [], stats: { views: 1504, tutorials: 80, comments: 284, earnings: 7842 } };
            await fs.promises.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
        } else {
            const raw = await fs.promises.readFile(DB_FILE, 'utf8');
            dbCache = JSON.parse(raw);
            if (!dbCache.courses || dbCache.courses.length === 0) {
                dbCache.courses = initialCourses;
            }
            if (!dbCache.messages) {
                dbCache.messages = [];
            }
            if (!dbCache.stats) {
                dbCache.stats = { views: 1504, tutorials: 80, comments: 284, earnings: 7842 };
            }
        }
    } catch (err) {
        console.error('Error reading DB, using default state:', err);
        dbCache = { users: [], courses: initialCourses, messages: [], stats: { views: 1504, tutorials: 80, comments: 284, earnings: 7842 } };
    }

    // Ensure default admin exists
    const adminExists = dbCache.users.some(u => u.role === 'admin' || u.email === 'admin@tutorify.com');
    if (!adminExists) {
        const adminPassword = await bcrypt.hash('admin123', 10);
        dbCache.users.push({
            id: dbCache.users.length + 1,
            name: 'System Admin',
            email: 'admin@tutorify.com',
            password: adminPassword,
            role: 'admin'
        });
        await writeDB(dbCache);
    }

    return dbCache;
};

// Async queued write DB
const writeDB = (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(err => {
        console.error('Error writing to DB file:', err);
    });
    return writeQueue;
};

// Authentication middleware for admin routes
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};

// Register endpoint (Hardcodes 'user' role to prevent privilege escalation)
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const db = await readDB();
    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: db.users.length + 1,
        name,
        email: email.toLowerCase(),
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
    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    const db = await readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
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
        { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// GET Courses endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// POST Contact message endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'First name, email, and message are required' });
    }

    const db = await readDB();
    const newMessage = {
        id: db.messages.length + 1,
        senderName: `${firstName} ${lastName || ''}`.trim(),
        email,
        message,
        createdAt: new Date().toISOString()
    };

    db.messages.unshift(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// POST Increment Page Views endpoint
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    if (!db.stats) {
        db.stats = { views: 1504, tutorials: 80, comments: 284, earnings: 7842 };
    }
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

// GET Dashboard Stats endpoint (Admin protected)
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        stats: db.stats || { views: 0, tutorials: 0, comments: 0, earnings: 0 },
        usersCount: db.users.length,
        recentMessages: (db.messages || []).slice(0, 10),
        recentUsers: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })).slice(-10)
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Initialize DB on server start
    readDB();
});
