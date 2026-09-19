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

// Performance Optimization: In-memory DB cache and asynchronous write queue
// to avoid blocking the event loop on synchronous file I/O operations.
let dbCache = null;
let writeQueue = Promise.resolve();

// Seed courses data
const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset and goal setting.', image: './images/course5.jpg' },
    { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn SEO, social media marketing, email marketing, and content marketing.', image: './images/digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success.', image: './images/digitalmarketing.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
    { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles.', image: './images/course11.jpg' },
    { id: 12, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course12.jpg' },
    { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology and smart contracts.', image: './images/digitalmarketing.png' },
    { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML and CSS.', image: './images/course14.jpg' },
    { id: 15, title: 'Landing Page Design', description: 'Learn how to create a responsive Landing Page design using HTML and CSS.', image: './images/course15.jpg' },
    { id: 16, title: 'World Class Portfolio Website development', description: 'Learn how to create a world Class Portfolio Website using HTML and CSS.', image: './images/course16.jpg' },
    { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to create a responsive Business manager dashboard UI design.', image: './images/course17.jpg' },
    { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Learn how to create a responsive Smart home Application UI design.', image: './images/course18.jpg' }
];

// Helper function to asynchronously read and initialize database with in-memory caching
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }

    let data = { users: [], courses: [], messages: [], stats: { totalUsers: 0, totalCourses: 0, totalMessages: 0, profileViews: 1504 } };

    try {
        if (fs.existsSync(DB_FILE)) {
            const rawData = await fs.promises.readFile(DB_FILE, 'utf8');
            data = JSON.parse(rawData);
        }
    } catch (error) {
        console.error('Error reading db.json:', error);
    }

    // Schema migration & default checks
    if (!data.users) data.users = [];
    if (!data.courses || data.courses.length === 0) data.courses = initialCourses;
    if (!data.messages) data.messages = [];
    if (!data.stats) data.stats = { totalUsers: data.users.length, totalCourses: data.courses.length, totalMessages: data.messages.length, profileViews: 1504 };

    // Seed default admin if missing
    let admin = data.users.find(u => u.role === 'admin' || u.email === 'admin@tutorify.com');
    if (!admin) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        admin = {
            id: data.users.length + 1,
            name: 'Admin',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        };
        data.users.push(admin);
    }

    dbCache = data;
    await writeDB(data);
    return dbCache;
};

// Helper function to asynchronously queue database writes
const writeDB = async (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(err => {
        console.error('Asynchronous DB write error:', err);
    });
    return writeQueue;
};

// Authentication middleware for Admin routes
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
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
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

// Register endpoint (Security Policy: Hardcode 'user' role for self-registration)
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = await readDB();

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password: hashedPassword,
        role: 'user' // Strictly hardcoded to prevent privilege escalation
    };

    db.users.push(newUser);
    db.stats.totalUsers = db.users.length;
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Courses API
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'Please complete all required fields.' });
    }

    const db = await readDB();
    const newMsg = {
        id: db.messages.length + 1,
        firstName,
        lastName: lastName || '',
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMsg);
    db.stats.totalMessages = db.messages.length;
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Analytics tracking endpoint
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.profileViews = (db.stats.profileViews || 0) + 1;
    await writeDB(db);
    res.json({ profileViews: db.stats.profileViews });
});

// Admin Dashboard Stats Endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        stats: {
            profileViews: db.stats.profileViews,
            tutorials: db.courses.length,
            comments: db.messages.length,
            earnings: 'ETB 7,842'
        },
        messages: db.messages,
        users: db.users
    });
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
