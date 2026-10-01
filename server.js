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
const SECRET_KEY = process.env.JWT_SECRET || 'tutorify_default_secret_key';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Restrict direct HTTP access to sensitive server files
app.use((req, res, next) => {
    const forbiddenFiles = ['/db.json', '/server.js', '/package.json', '/package-lock.json'];
    if (forbiddenFiles.includes(req.path)) {
        return res.status(403).send('Access Denied');
    }
    next();
});

app.use(express.static(__dirname));

// In-memory database cache & async write queue
let dbCache = null;
let writeQueue = Promise.resolve();

// Initial 18 courses dataset
const initialCourses = [
    { id: 1, title: "Responsive Social Media Website UI Design", description: "Learn layout techniques and styling for social media interfaces.", image: "./images/course1.jpg" },
    { id: 2, title: "Responsive SmartHome Website Design", description: "Build modern smart home web applications with HTML & CSS.", image: "./images/course2.jpg" },
    { id: 3, title: "Responsive Admin Dashboard UI Design", description: "Design responsive dashboards with interactive charts and tables.", image: "./images/course3.jpg" },
    { id: 4, title: "Be Focused and Productive", description: "Fundamentals of focus, goal setting, and time management.", image: "./images/course4.jpg" },
    { id: 5, title: "How to Use Every Opportunity to Be Successful", description: "Mindset shifts and strategic habits for career growth.", image: "./images/course5.jpg" },
    { id: 6, title: "Responsive Social Media UI Design Advanced", description: "Deep dive into dynamic web components and micro-interactions.", image: "./images/course6.jpg" },
    { id: 7, title: "Fundamentals of Digital Marketing", description: "SEO, social media strategies, email campaigns, and content growth.", image: "./digitalmarketing.png" },
    { id: 8, title: "How to Be a Confident and Successful Person", description: "Public speaking, self-confidence, and effective communication.", image: "./images/self.png" },
    { id: 9, title: "Cloning Netflix Website", description: "Replicate Netflix interface using advanced CSS grid and flexbox.", image: "./images/course9.jpg" },
    { id: 10, title: "Digital Newspaper Website Design", description: "Multi-column editorial layouts and responsive article styling.", image: "./images/course10.jpg" },
    { id: 11, title: "Logo and Graphic Designing", description: "Master design principles, vector graphics, and color theory.", image: "./images/course11.jpg" },
    { id: 12, title: "Business Manager Dashboard UI Design", description: "Build scalable management interfaces for enterprise clients.", image: "./images/course12.jpg" },
    { id: 13, title: "Introduction to Blockchain Technology", description: "Architecture, smart contracts, and decentralized application basics.", image: "./images/blockchain.png" },
    { id: 14, title: "Fully Functioning Contact Form Design", description: "Form validation, accessibility features, and server integration.", image: "./images/course14.jpg" },
    { id: 15, title: "Landing Page Design for Startups", description: "High-converting landing page layouts and typography secrets.", image: "./images/course15.jpg" },
    { id: 16, title: "World Class Portfolio Website Development", description: "Showcase your work with slick animations and responsive design.", image: "./images/course16.jpg" },
    { id: 17, title: "E-Commerce Storefront UI Design", description: "Product grids, shopping cart interfaces, and checkout flow UX.", image: "./images/course17.jpg" },
    { id: 18, title: "Responsive Smart Home Application UI", description: "IoT device controls and dark mode dashboard layouts.", image: "./images/course18.jpg" }
];

// Helper function to read database asynchronously with in-memory caching
async function readDB() {
    if (dbCache) return dbCache;

    try {
        if (!fsSync.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: initialCourses, messages: [], stats: { viewsCount: 0, messagesCount: 0 } };
            await writeDB(dbCache);
        } else {
            const data = await fs.readFile(DB_FILE, 'utf8');
            dbCache = JSON.parse(data);
        }
    } catch (err) {
        dbCache = { users: [], courses: initialCourses, messages: [], stats: { viewsCount: 0, messagesCount: 0 } };
    }

    // Migration and schema enforcement
    let modified = false;
    if (!dbCache.users) { dbCache.users = []; modified = true; }
    if (!dbCache.courses || dbCache.courses.length === 0) { dbCache.courses = initialCourses; modified = true; }
    if (!dbCache.messages) { dbCache.messages = []; modified = true; }
    if (!dbCache.stats) { dbCache.stats = { viewsCount: 0, messagesCount: 0 }; modified = true; }

    // Seed default admin user if not present
    const adminEmail = 'admin@tutorify.com';
    const adminExists = dbCache.users.some(u => u.email === adminEmail);
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        dbCache.users.push({
            id: dbCache.users.length + 1,
            name: 'Admin User',
            email: adminEmail,
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

// Helper function to write to database safely using Promise queueing
async function writeDB(data) {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(err => {
        console.error('Error writing DB file:', err);
    });
    return writeQueue;
}

// Admin Authentication Middleware
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'Authorization token missing' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Malformed authorization header' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err || !user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
        req.user = user;
        next();
    });
}

// Register endpoint - Hardcodes role to 'user' to prevent privilege escalation
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
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
            role: 'user' // Security Policy: prevent privilege escalation
        };

        db.users.push(newUser);
        await writeDB(db);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
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

        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get Courses Endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

// Contact Endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, name, email, message } = req.body;
        const senderName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'Anonymous';

        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }

        const db = await readDB();
        const newMessage = {
            id: db.messages.length + 1,
            sender: senderName,
            email,
            message,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        };

        db.messages.unshift(newMessage);
        db.stats.messagesCount = (db.stats.messagesCount || 0) + 1;
        await writeDB(db);

        res.status(201).json({ message: 'Thank you for your message! We will get back to you soon.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send message' });
    }
});

// Page View Recording Endpoint
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        db.stats.viewsCount = (db.stats.viewsCount || 0) + 1;
        await writeDB(db);
        res.json({ success: true, viewsCount: db.stats.viewsCount });
    } catch (err) {
        res.status(500).json({ message: 'Error recording page view' });
    }
});

// Admin Stats Endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        usersCount: db.users.length,
        coursesCount: db.courses.length,
        messagesCount: db.messages.length,
        viewsCount: db.stats.viewsCount || 0,
        messages: db.messages
    });
});

app.listen(PORT, async () => {
    await readDB(); // Explicit startup initialization & admin seeding
    console.log(`Server is running on http://localhost:${PORT}`);
});
