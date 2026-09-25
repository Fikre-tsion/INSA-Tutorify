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
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key_default_persistent';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Protect sensitive files from direct static serving
app.use((req, res, next) => {
    if (req.path === '/db.json' || req.path === '/server.js') {
        return res.status(403).send('Access Denied');
    }
    next();
});

app.use(express.static(__dirname));

let dbCache = null;
let writeQueue = Promise.resolve();

const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'JavaScript Fundamentals for Beginners', description: 'Master modern ES6+ JavaScript core concepts, variables, functions, and async programming.', image: './digitalmarketing.png' },
    { id: 5, title: 'Fullstack Web Development BootCamp', description: 'Build fullstack Node.js, Express, and HTML/CSS web applications from scratch.', image: './digitalmarketing.png' },
    { id: 6, title: 'UI/UX Design Masterclass', description: 'Design intuitive and beautiful user interfaces with user-centered design principles.', image: './digitalmarketing.png' },
    { id: 7, title: 'Python Programming Essentials', description: 'Learn Python programming language fundamentals and object-oriented practices.', image: './digitalmarketing.png' },
    { id: 8, title: 'Data Structures and Algorithms', description: 'Understand key data structures and algorithmic thinking to ace technical interviews.', image: './digitalmarketing.png' },
    { id: 9, title: 'Mobile App Development with React Native', description: 'Build cross-platform mobile iOS and Android applications using React Native.', image: './digitalmarketing.png' },
    { id: 10, title: 'Cybersecurity Principles & Practices', description: 'Understand ethical hacking, network defense, threat analysis, and safe digital practices.', image: './digitalmarketing.png' },
    { id: 11, title: 'Digital Marketing & Social Media Strategy', description: 'Scale brand visibility, conversion, and organic marketing strategies effectively.', image: './digitalmarketing.png' },
    { id: 12, title: 'Database Design & SQL Optimization', description: 'Learn relational database modeling, SQL queries, indexing, and data management.', image: './digitalmarketing.png' },
    { id: 13, title: 'Cloud Computing Essentials (AWS)', description: 'Deploy, manage, and scale server infrastructure on Amazon Web Services cloud.', image: './digitalmarketing.png' },
    { id: 14, title: 'Artificial Intelligence & Machine Learning', description: 'Discover machine learning algorithms, models, neural networks, and Python libraries.', image: './digitalmarketing.png' },
    { id: 15, title: 'DevOps & Docker Containerization', description: 'Automate CI/CD deployment pipelines, Docker container management, and cloud workflows.', image: './digitalmarketing.png' },
    { id: 16, title: 'Financial Intelligence for Entrepreneurs', description: 'Master budgeting, cash flow management, valuation, and financial growth metrics.', image: './digitalmarketing.png' },
    { id: 17, title: 'Graphic Design Fundamentals & Photoshop', description: 'Master visual design composition, color theory, typography, and graphic tools.', image: './digitalmarketing.png' },
    { id: 18, title: 'Blockchain Fundamentals & Smart Contracts', description: 'Learn blockchain architecture, decentralized app development, and Web3 technology.', image: './digitalmarketing.png' }
];

// Helper function to read database asynchronously with caching and seeding
async function readDB() {
    if (dbCache) return dbCache;

    let db = { users: [], courses: [], messages: [], stats: { views: 0 } };

    if (fsSync.existsSync(DB_FILE)) {
        try {
            const data = await fs.readFile(DB_FILE, 'utf8');
            db = JSON.parse(data);
        } catch (err) {
            console.error('Error reading DB file, reinitializing:', err);
        }
    }

    if (!db.users) db.users = [];
    if (!db.courses || db.courses.length === 0) db.courses = initialCourses;
    if (!db.messages) db.messages = [];
    if (!db.stats) db.stats = { views: 0 };

    // Seed default admin account if missing
    let admin = db.users.find(u => u.role === 'admin');
    if (!admin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        admin = {
            id: db.users.length + 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        };
        db.users.push(admin);
    }

    dbCache = db;
    await writeDB(db);
    return db;
}

// Helper function to write to database queueing writes asynchronously
async function writeDB(data) {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(err => {
        console.error('Failed to write DB:', err);
    });
    return writeQueue;
}

// Auth Middleware for Admin
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Missing token' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
        req.user = user;
        next();
    });
};

// Register endpoint - hardcodes role 'user' for safety
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
            role: 'user'
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

        const user = db.users.find(u => u.email === email && u.role === role);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email, password or role' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email, password or role' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
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
        res.status(500).json({ message: 'Error retrieving courses' });
    }
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
    try {
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
            date: new Date().toISOString(),
            status: 'Pending'
        };

        db.messages.push(newMessage);
        await writeDB(db);

        res.status(201).json({ message: 'Message submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error submitting contact form' });
    }
});

// POST /api/stats/view
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        db.stats.views = (db.stats.views || 0) + 1;
        await writeDB(db);
        res.json({ views: db.stats.views });
    } catch (err) {
        res.status(500).json({ message: 'Error tracking view' });
    }
});

// GET /api/stats (Admin only)
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await readDB();
        res.json({
            views: db.stats.views || 0,
            coursesCount: db.courses.length,
            messagesCount: db.messages.length,
            usersCount: db.users.length,
            messages: db.messages
        });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving stats' });
    }
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
