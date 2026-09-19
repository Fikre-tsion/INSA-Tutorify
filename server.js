const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'tutorify_jwt_secure_secret_key_2025';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;
let writeQueue = Promise.resolve();

// Initial course seed data
const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './digitalmarketing.png' },
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and communication.', image: './digitalmarketing.png' },
    { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn SEO, social media marketing, email marketing, and content marketing.', image: './digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and personal success.', image: './digitalmarketing.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 11, title: 'Logo and Graphic Designing', description: 'Learn design principles, color theory, and typography for logo and graphics.', image: './digitalmarketing.png' },
    { id: 12, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, architecture, and applications.', image: './digitalmarketing.png' },
    { id: 13, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 14, title: 'Landing Page Design', description: 'Learn how to create a responsive Landing Page design using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 15, title: 'World Class Portfolio Website development', description: 'Learn how to create a world class Portfolio Website using HTML and CSS.', image: './digitalmarketing.png' },
    { id: 16, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to create a responsive Business manager dashboard UI design.', image: './digitalmarketing.png' },
    { id: 17, title: 'Responsive Smart home Application UI Design', description: 'Learn how to create a responsive Smart home Application UI design.', image: './digitalmarketing.png' },
    { id: 18, title: 'Advanced Web Development Mastery', description: 'Master full-stack web development with HTML, CSS, JavaScript, Node.js and Express.', image: './digitalmarketing.png' }
];

// Helper function to read database asynchronously with cache and schema migration
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
    } catch (err) {
        dbCache = { users: [], courses: [], messages: [], stats: { views: 0 } };
    }

    if (!dbCache.users) dbCache.users = [];
    if (!dbCache.courses) dbCache.courses = [];
    if (!dbCache.messages) dbCache.messages = [];
    if (!dbCache.stats) dbCache.stats = { views: 0 };

    let needsWrite = false;

    // Seed admin if missing
    if (!dbCache.users.some(u => u.role === 'admin')) {
        const hashedAdminPassword = await bcrypt.hash('password123', 10);
        dbCache.users.push({
            id: dbCache.users.length + 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: hashedAdminPassword,
            role: 'admin'
        });
        needsWrite = true;
    }

    // Seed courses if empty
    if (dbCache.courses.length === 0) {
        dbCache.courses = initialCourses;
        needsWrite = true;
    }

    if (needsWrite) {
        await writeDB(dbCache);
    }

    return dbCache;
};

// Helper function to write to database safely using writeQueue
const writeDB = (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
    }).catch((err) => {
        console.error('Error writing to DB:', err);
    });
    return writeQueue;
};

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin access required' });
        }
    });
};

// Register endpoint
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
        role: 'user' // Hardcoded role to 'user' for security
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

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
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Courses endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json({ courses: db.courses });
});

app.post('/api/courses', authenticateAdmin, async (req, res) => {
    const { title, description, image } = req.body;
    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
    }

    const db = await readDB();
    const newCourse = {
        id: db.courses.length + 1,
        title,
        description,
        image: image || './digitalmarketing.png'
    };

    db.courses.push(newCourse);
    await writeDB(db);

    res.status(201).json({ message: 'Course created successfully', course: newCourse });
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({ message: 'Email and message are required' });
    }

    const db = await readDB();
    const newMessage = {
        id: db.messages.length + 1,
        firstName: firstName || '',
        lastName: lastName || '',
        email,
        message,
        createdAt: new Date().toISOString()
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Stats view count increment endpoint
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ success: true, views: db.stats.views });
});

// Admin stats endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        views: db.stats.views || 0,
        coursesCount: db.courses.length,
        messagesCount: db.messages.length,
        usersCount: db.users.length,
        messages: db.messages,
        users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
});

// Admin users list endpoint
app.get('/api/users', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
});

// Admin messages list endpoint
app.get('/api/messages', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({ messages: db.messages });
});

const server = app.listen(PORT, async () => {
    await readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = { app, server, readDB, writeDB };
