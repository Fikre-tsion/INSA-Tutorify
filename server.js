const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'tutorify_jwt_secret_key_2025_safe';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;
let writeQueue = Promise.resolve();

const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and effective communication.', image: './images/course5.jpg' },
    { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn SEO, social media marketing, email marketing, and content marketing fundamentals.', image: './images/digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn self-confidence, goal setting, and effective communication skills.', image: './images/self.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
    { id: 11, title: 'Responsive Admin Dashboard UI Design Pro', description: 'Advanced layout techniques and UI component design for administrative panels.', image: './images/course12.jpg' },
    { id: 12, title: 'Logo and Graphic Designing', description: 'Learn design principles, color theory, and typography fundamentals.', image: './images/course11.jpg' },
    { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn blockchain architecture, smart contracts, and real-world applications.', image: './images/blockchain.png' },
    { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create interactive and accessible form interfaces.', image: './images/course14.jpg' },
    { id: 15, title: 'Landing Page Design', description: 'Learn high-converting landing page structure, styling, and design principles.', image: './images/course15.jpg' },
    { id: 16, title: 'World Class Portfolio Website development', description: 'Learn layout techniques and best practices for developer and designer portfolios.', image: './images/course16.jpg' },
    { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Build sleek analytical dashboards for management software.', image: './images/course17.jpg' },
    { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Design modern user interfaces for IoT and smart home controls.', image: './images/course18.jpg' }
];

async function readDB() {
    if (dbCache) return dbCache;
    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: initialCourses, messages: [], stats: { views: 0 } };
            await writeDB(dbCache);
            return dbCache;
        }
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
    } catch (e) {
        dbCache = { users: [], courses: initialCourses, messages: [], stats: { views: 0 } };
    }

    let modified = false;
    if (!dbCache.users) { dbCache.users = []; modified = true; }
    if (!dbCache.courses || dbCache.courses.length === 0) { dbCache.courses = initialCourses; modified = true; }
    if (!dbCache.messages) { dbCache.messages = []; modified = true; }
    if (!dbCache.stats) { dbCache.stats = { views: 0 }; modified = true; }

    // Seed default admin if missing
    if (!dbCache.users.some(u => u.email === 'admin@tutorify.com')) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        dbCache.users.push({
            id: dbCache.users.length + 1,
            name: 'System Admin',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
        modified = true;
    }

    if (modified) {
        await writeDB(dbCache);
    }

    return dbCache;
}

async function writeDB(data) {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(() => {});
    return writeQueue;
}

// Authentication middleware for admin routes
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err || user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. Admin privileges required.' });
        }
        req.user = user;
        next();
    });
}

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
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
            role: 'user' // Security policy: prevent privilege escalation
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
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const db = await readDB();
        const user = db.users.find(u => u.email === email && (role ? u.role === role : true));
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
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses || []);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch courses' });
    }
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        if (!firstName || !email || !message) {
            return res.status(400).json({ message: 'Please fill in all required fields.' });
        }

        const db = await readDB();
        const newMessage = {
            id: (db.messages.length || 0) + 1,
            name: `${firstName} ${lastName || ''}`.trim(),
            email,
            message,
            date: new Date().toISOString()
        };

        db.messages.push(newMessage);
        await writeDB(db);

        res.status(201).json({ message: 'Thank you for your message! We will get back to you soon.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to record message' });
    }
});

// Record page view
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        if (!db.stats) db.stats = { views: 0 };
        db.stats.views = (db.stats.views || 0) + 1;
        await writeDB(db);
        res.json({ success: true, views: db.stats.views });
    } catch (err) {
        res.status(500).json({ message: 'Failed to record page view' });
    }
});

// Admin stats endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await readDB();
        res.json({
            totalUsers: db.users.length,
            totalCourses: db.courses.length,
            totalMessages: db.messages.length,
            views: db.stats.views || 0,
            messages: db.messages
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
