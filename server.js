const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
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

// In-memory cache for fast, non-blocking DB access
let dbCache = null;
let writeQueue = Promise.resolve();

// Seed courses list (18 courses)
const initialCourses = [
  { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/digitalmarketing.png' },
  { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/digitalmarketing.png' },
  { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/digitalmarketing.png' },
  { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/digitalmarketing.png' },
  { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and effective communication.', image: './images/digitalmarketing.png' },
  { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/digitalmarketing.png' },
  { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO, social media, and content marketing.', image: './digitalmarketing.png' },
  { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success, including mindset and goal setting.', image: './images/digitalmarketing.png' },
  { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/digitalmarketing.png' },
  { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/digitalmarketing.png' },
  { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles and typography.', image: './images/digitalmarketing.png' },
  { id: 12, title: 'Responsive Admin Dashboard UI Design Pro', description: 'Advanced techniques for building scalable admin dashboard interfaces.', image: './images/digitalmarketing.png' },
  { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, architecture, and smart contracts.', image: './images/digitalmarketing.png' },
  { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create interactive and accessible forms connected to backend APIs.', image: './images/digitalmarketing.png' },
  { id: 15, title: 'Landing Page Design', description: 'Learn how to create high-converting responsive landing page designs.', image: './images/digitalmarketing.png' },
  { id: 16, title: 'World Class Portfolio Website development', description: 'Learn how to create a world-class portfolio website using modern web technologies.', image: './images/digitalmarketing.png' },
  { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Master layout and UI patterns for modern business management web apps.', image: './images/digitalmarketing.png' },
  { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Design modern IoT and smart home control interfaces.', image: './images/digitalmarketing.png' }
];

// Asynchronous DB reader with in-memory caching and migration/seeding
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
    } catch (error) {
        dbCache = { users: [], courses: [], messages: [], stats: { views: 1504 } };
    }

    let modified = false;

    if (!dbCache.users) { dbCache.users = []; modified = true; }
    if (!dbCache.courses || dbCache.courses.length === 0) { dbCache.courses = initialCourses; modified = true; }
    if (!dbCache.messages) { dbCache.messages = []; modified = true; }
    if (!dbCache.stats) { dbCache.stats = { views: 1504 }; modified = true; }

    // Seed default admin account if not present
    const adminExists = dbCache.users.some(u => u.email === 'admin@tutorify.com');
    if (!adminExists) {
        const adminPasswordHash = await bcrypt.hash('password123', 10);
        dbCache.users.push({
            id: dbCache.users.length + 1,
            name: 'Administrator',
            email: 'admin@tutorify.com',
            password: adminPasswordHash,
            role: 'admin'
        });
        modified = true;
    }

    if (modified) {
        await writeDB(dbCache);
    }

    return dbCache;
};

// Asynchronous DB writer with queued non-blocking file I/O
const writeDB = async (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        try {
            await fs.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
        } catch (err) {
            console.error('Error writing to db.json:', err);
        }
    });
    return writeQueue;
};

// Auth Middleware for Admin Routes
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token required' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err || user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
        req.user = user;
        next();
    });
};

// Register endpoint (hardcodes 'user' role for security policy)
app.post('/api/register', async (req, res) => {
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
        role: 'user' // Security Policy: Hardcode 'user' role for new registrations
    };

    db.users.push(newUser);
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
    res.json(db.courses || []);
});

app.get('/api/courses/:id', async (req, res) => {
    const db = await readDB();
    const course = db.courses.find(c => c.id === parseInt(req.params.id));
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
});

// Contact Submission API
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'First name, email, and message are required' });
    }

    const db = await readDB();
    const newMessage = {
        id: db.messages.length + 1,
        firstName,
        lastName: lastName || '',
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message received successfully!', messageData: newMessage });
});

// Page view tracker API
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    if (!db.stats) db.stats = { views: 0 };
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ success: true, views: db.stats.views });
});

// Admin Dashboard Stats API
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        views: db.stats.views || 0,
        courseCount: db.courses.length,
        messageCount: db.messages.length,
        userCount: db.users.length,
        messages: db.messages,
        users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // Explicitly call readDB upon server launch to initialize DB and seed admin
    readDB().then(() => {
        console.log('Database initialized successfully.');
    }).catch(err => {
        console.error('Database initialization error:', err);
    });
});
