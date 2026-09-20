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

// Performance Optimization: In-memory cache & serialized write queue
let dbCache = null;
let writeQueue = Promise.resolve();

// Async helper to read database with in-memory caching and automatic schema migration/seeding
const readDB = async () => {
    if (dbCache) return dbCache;

    let dataObj = { users: [], courses: [], messages: [], stats: { profileViews: 1504, tutorials: 18, comments: 284, earnings: "ETB 7,842" } };

    if (fs.existsSync(DB_FILE)) {
        try {
            const raw = await fs.promises.readFile(DB_FILE, 'utf8');
            if (raw.trim()) {
                dataObj = JSON.parse(raw);
            }
        } catch (err) {
            console.error('Error reading DB file, using default structure:', err);
        }
    }

    // Migration / Schema checks
    if (!Array.isArray(dataObj.users)) dataObj.users = [];
    if (!Array.isArray(dataObj.courses)) dataObj.courses = [];
    if (!Array.isArray(dataObj.messages)) dataObj.messages = [];
    if (!dataObj.stats) {
        dataObj.stats = { profileViews: 1504, tutorials: 18, comments: 284, earnings: "ETB 7,842" };
    }

    // Seed default admin if missing
    let admin = dataObj.users.find(u => u.role === 'admin');
    if (!admin) {
        const adminPasswordHash = await bcrypt.hash('password123', 10);
        admin = {
            id: 1,
            name: 'System Admin',
            email: 'admin@tutorify.com',
            password: adminPasswordHash,
            role: 'admin'
        };
        dataObj.users.push(admin);
    }

    // Seed courses if empty
    if (dataObj.courses.length === 0) {
        dataObj.courses = [
            { id: 1, title: "Responsive Social Media Website UI Design", description: "Learn how to create a responsive social media website UI design using HTML and CSS.", image: "./digitalmarketing.png" },
            { id: 2, title: "Responsive SmartHome Website Design", description: "Learn how to create a responsive SmartHome website design using HTML and CSS.", image: "./digitalmarketing.png" },
            { id: 3, title: "Responsive Admin Dashboard UI Design", description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.", image: "./digitalmarketing.png" },
            { id: 4, title: "Be focused and productive", description: "Learn the fundamentals of productivity and focus, including time management and goal setting.", image: "./digitalmarketing.png" },
            { id: 5, title: "How to use every opportunity to be successful", description: "Learn the fundamentals of success, including mindset, goal setting, and effective communication.", image: "./digitalmarketing.png" },
            { id: 6, title: "Responsive social Media UI design", description: "Learn how to create a responsive social Media UI design using HTML and CSS.", image: "./digitalmarketing.png" },
            { id: 7, title: "Fundamentals of Digital Marketing", description: "Learn the fundamentals of Digital Marketing, including SEO, social media, and email marketing.", image: "./digitalmarketing.png" },
            { id: 8, title: "How to be a confident and successful person", description: "Learn the fundamentals of self-confidence and success.", image: "./digitalmarketing.png" },
            { id: 9, title: "Cloning Netflix Website", description: "Learn how to create a responsive Netflix website clone using HTML and CSS.", image: "./digitalmarketing.png" },
            { id: 10, title: "Digital Newspaper Website Design", description: "Learn how to create a responsive Digital Newspaper website design using HTML and CSS.", image: "./digitalmarketing.png" },
            { id: 11, title: "Logo and Graphic Designing", description: "Learn the fundamentals of Logo and Graphic Designing, including design principles and typography.", image: "./digitalmarketing.png" },
            { id: 12, title: "Responsive Admin Dashboard UI Design", description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.", image: "./digitalmarketing.png" },
            { id: 13, title: "Introduction to Blockchain Technology", description: "Learn the fundamentals of Blockchain Technology, including architecture and DApps.", image: "./digitalmarketing.png" },
            { id: 14, title: "Fully functioning Contact Form Design", description: "Learn how to create a responsive Contact Form design using HTML and CSS.", image: "./digitalmarketing.png" },
            { id: 15, title: "Landing Page Design", description: "Learn how to create a responsive Landing Page design using HTML and CSS.", image: "./digitalmarketing.png" },
            { id: 16, title: "World Class Portfolio Website development", description: "Learn how to create a world Class Portfolio Website using HTML and CSS.", image: "./digitalmarketing.png" },
            { id: 17, title: "Responsive Business Manager Dashboard UI Design", description: "Learn how to create a responsive Business manager dashboard UI design using HTML and CSS.", image: "./digitalmarketing.png" },
            { id: 18, title: "Responsive Smart Home Application UI Design", description: "Learn how to create a responsive Smart home Application UI design using HTML and CSS.", image: "./digitalmarketing.png" }
        ];
    }

    dbCache = dataObj;
    await writeDB(dbCache);
    return dbCache;
};

// Serialized async write function
const writeDB = (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(err => {
        console.error('Error writing DB file:', err);
    });
    return writeQueue;
};

// Authentication Middleware for Admin routes
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
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

// Security Policy: Force 'user' role on registration to prevent privilege escalation
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
        email,
        password: hashedPassword,
        role: 'user' // Hardcoded role for security policy
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
    const targetRole = role || 'user';

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === targetRole);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// GET /api/courses
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({ message: 'Email and message are required' });
    }

    const db = await readDB();
    const newMessage = {
        id: db.messages.length + 1,
        sender: `${firstName || ''} ${lastName || ''}`.trim() || 'Anonymous',
        email,
        message,
        date: new Date().toISOString().split('T')[0],
        status: 'Unread'
    };

    db.messages.push(newMessage);
    db.stats.comments = (db.stats.comments || 0) + 1;
    await writeDB(db);

    res.status(201).json({ message: 'Contact message received successfully' });
});

// POST /api/stats/view
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.profileViews = (parseInt(db.stats.profileViews) || 0) + 1;
    await writeDB(db);
    res.json({ profileViews: db.stats.profileViews });
});

// GET /api/stats (Admin secured endpoint)
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        stats: {
            profileViews: db.stats.profileViews,
            tutorials: db.courses.length,
            comments: db.stats.comments || db.messages.length,
            earnings: db.stats.earnings || "ETB 7,842"
        },
        messages: db.messages,
        usersCount: db.users.length
    });
});

app.listen(PORT, async () => {
    await readDB(); // Pre-warm cache and run migrations/seeding
    console.log(`Server is running on http://localhost:${PORT}`);
});
