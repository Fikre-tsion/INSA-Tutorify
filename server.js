const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const fsPromises = fs.promises;
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

let dbCache = null;
let writeQueue = Promise.resolve();

const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and effective communication.', image: './images/course5.jpg' },
    { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO, social media marketing, and email marketing.', image: './digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success, including mindset and goal setting.', image: './images/self.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
    { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles and color theory.', image: './images/course11.jpg' },
    { id: 12, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, including architecture and consensus mechanisms.', image: './images/blockchain.png' },
    { id: 13, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML and CSS.', image: './images/course14.jpg' },
    { id: 14, title: 'Landing Page Design', description: 'Learn how to create a responsive Landing Page design using HTML and CSS.', image: './images/course15.jpg' },
    { id: 15, title: 'World Class Portfolio Website development', description: 'Learn how to create a world Class Portfolio Website using HTML and CSS.', image: './images/course16.jpg' },
    { id: 16, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to create a responsive Business manager dashboard UI design using HTML and CSS.', image: './images/course17.jpg' },
    { id: 17, title: 'Responsive Smart home Application UI Design', description: 'Learn how to create a responsive Smart home Application UI design using HTML and CSS.', image: './images/course18.jpg' },
    { id: 18, title: 'Web Development Basics', description: 'Master foundational web development with HTML5, CSS3, and modern JavaScript.', image: './digitalmarketing.png' }
];

// Asynchronous DB reader with migration and default admin seeding
const readDB = async () => {
    if (dbCache) return dbCache;

    let db = { users: [], courses: [], messages: [], stats: { pageViews: 0 } };

    if (fs.existsSync(DB_FILE)) {
        try {
            const data = await fsPromises.readFile(DB_FILE, 'utf8');
            db = JSON.parse(data);
        } catch (err) {
            console.error('Error reading db.json:', err);
        }
    }

    if (!Array.isArray(db.users)) db.users = [];
    if (!Array.isArray(db.courses) || db.courses.length === 0) db.courses = initialCourses;
    if (!Array.isArray(db.messages)) db.messages = [];
    if (!db.stats || typeof db.stats !== 'object') db.stats = { pageViews: 0 };
    if (typeof db.stats.pageViews !== 'number') db.stats.pageViews = 0;

    // Seed default admin if missing
    const adminExists = db.users.some(u => u.email === 'admin@tutorify.com' || u.role === 'admin');
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.users.push({
            id: db.users.length + 1,
            name: 'Admin',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
    }

    dbCache = db;
    await writeDB(db);
    return dbCache;
};

// Queue-based async writer
const writeDB = async (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        try {
            await fsPromises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error('Error writing db.json:', err);
        }
    }).catch(() => {});
    return writeQueue;
};

// Middleware: Authenticate Admin
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err || !user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
        req.user = user;
        next();
    });
};

// Register endpoint - Enforces 'user' role to prevent privilege escalation
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const db = await readDB();

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Name, email and password are required' });
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
            role: 'user' // Hardcoded to prevent privilege escalation
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
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// GET /api/courses
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses || []);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching courses' });
    }
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        const senderName = req.body.name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || 'Anonymous');

        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }

        const db = await readDB();
        const newMessage = {
            id: db.messages.length + 1,
            name: senderName,
            email,
            message,
            createdAt: new Date().toISOString()
        };

        db.messages.push(newMessage);
        await writeDB(db);

        res.status(201).json({ message: 'Thank you for your message! We will get back to you soon.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error sending contact message' });
    }
});

// POST /api/stats/view - Page view tracking
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        db.stats.pageViews = (db.stats.pageViews || 0) + 1;
        await writeDB(db);
        res.json({ pageViews: db.stats.pageViews });
    } catch (err) {
        res.status(500).json({ message: 'Error recording page view' });
    }
});

// GET /api/stats - Admin Dashboard statistics
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await readDB();
        const tutorsList = [
            { name: 'Haile', course: 'Mathematics', payment: 'ETB 450/hr', status: 'Delivered' },
            { name: 'Fikre', course: 'Physics', payment: 'ETB 500/hr', status: 'Pending' },
            { name: 'Tsion', course: 'Chemistry', payment: 'ETB 400/hr', status: 'Return' },
            { name: 'Abebe', course: 'Biology', payment: 'ETB 350/hr', status: 'In Progress' },
            { name: 'Almaz', course: 'English', payment: 'ETB 300/hr', status: 'Delivered' }
        ];

        res.json({
            usersCount: db.users.length,
            coursesCount: db.courses.length,
            messagesCount: db.messages.length,
            pageViews: db.stats.pageViews || 0,
            recentMessages: db.messages.slice(-5).reverse(),
            tutors: tutorsList
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching stats' });
    }
});

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    await readDB();
});
