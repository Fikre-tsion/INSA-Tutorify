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

// Performance: In-memory cache for ultra-fast database reads
let dbCache = null;

// Performance: Serialized asynchronous write queue to ensure safe concurrent database writes
let writeQueue = Promise.resolve();

// Initial database seed data
const initialSeedData = () => ({
    users: [
        {
            id: 1,
            name: "Playwright User",
            email: "pw@example.com",
            password: bcrypt.hashSync("password123", 10),
            role: "user"
        },
        {
            id: 2,
            name: "Admin User",
            email: "admin@tutorify.com",
            password: bcrypt.hashSync("password123", 10),
            role: "admin"
        }
    ],
    courses: [
        {
            id: 1,
            title: "Responsive Social Media Website UI Design",
            description: "Learn how to create a responsive social media website UI design using HTML and CSS. Covers layout techniques and best practices.",
            image: "./digitalmarketing.png"
        },
        {
            id: 2,
            title: "Responsive SmartHome Website Design",
            description: "Learn how to create a responsive SmartHome website design using HTML and CSS layout techniques.",
            image: "./digitalmarketing.png"
        },
        {
            id: 3,
            title: "Responsive Admin Dashboard UI Design",
            description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.",
            image: "./digitalmarketing.png"
        },
        {
            id: 4,
            title: "Be focused and productive",
            description: "Learn the fundamentals of productivity and focus, including time management and goal setting.",
            image: "./digitalmarketing.png"
        },
        {
            id: 5,
            title: "How to use every opportunity to be successful",
            description: "Learn the fundamentals of success, mindset, goal setting, and effective communication.",
            image: "./digitalmarketing.png"
        },
        {
            id: 6,
            title: "Fundamentals of Digital Marketing",
            description: "Learn SEO, social media marketing, email marketing, and content marketing strategies.",
            image: "./digitalmarketing.png"
        },
        {
            id: 7,
            title: "How to be a confident and successful person",
            description: "Learn mindset, goal setting, and effective communication skills.",
            image: "./digitalmarketing.png"
        },
        {
            id: 8,
            title: "Introduction to Blockchain Technology",
            description: "Learn blockchain fundamentals, smart contracts, and decentralized app concepts.",
            image: "./digitalmarketing.png"
        }
    ],
    contacts: [],
    stats: {
        profileViews: 1504,
        tutorials: 80,
        comments: 284,
        earnings: 7842
    },
    tutors: [
        { name: "Haile", course: "Mathematics", payment: "ETB 450/hr", status: "delivered" },
        { name: "Fikre", course: "Physics", payment: "ETB 500/hr", status: "pending" },
        { name: "Tsion", course: "Chemistry", payment: "ETB 400/hr", status: "return" },
        { name: "Abebe", course: "Biology", payment: "ETB 350/hr", status: "inprogress" },
        { name: "Almaz", course: "English", payment: "ETB 300/hr", status: "delivered" }
    ],
    customers: [
        { name: "Gebre", grade: "Grade 12", image: "./digitalmarketing.png" },
        { name: "Selam", grade: "Grade 11", image: "./digitalmarketing.png" },
        { name: "Yonas", grade: "Grade 10", image: "./digitalmarketing.png" },
        { name: "Meron", grade: "Grade 9", image: "./digitalmarketing.png" },
        { name: "Daniel", grade: "Grade 12", image: "./digitalmarketing.png" }
    ]
});

// Helper function to read database with in-memory caching and automatic migration/seeding
const readDB = async () => {
    if (dbCache) return dbCache;

    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = initialSeedData();
            await writeDB(dbCache);
            return dbCache;
        }

        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);

        // Ensure all required fields exist
        let modified = false;
        if (!dbCache.users) { dbCache.users = []; modified = true; }
        if (!dbCache.courses) { dbCache.courses = initialSeedData().courses; modified = true; }
        if (!dbCache.contacts) { dbCache.contacts = []; modified = true; }
        if (!dbCache.stats) { dbCache.stats = initialSeedData().stats; modified = true; }
        if (!dbCache.tutors) { dbCache.tutors = initialSeedData().tutors; modified = true; }
        if (!dbCache.customers) { dbCache.customers = initialSeedData().customers; modified = true; }

        // Ensure default admin exists
        if (!dbCache.users.some(u => u.email === "admin@tutorify.com")) {
            dbCache.users.push({
                id: dbCache.users.length + 1,
                name: "Admin User",
                email: "admin@tutorify.com",
                password: bcrypt.hashSync("password123", 10),
                role: "admin"
            });
            modified = true;
        }

        if (modified) {
            await writeDB(dbCache);
        }

        return dbCache;
    } catch (error) {
        console.error('Error reading DB:', error);
        dbCache = initialSeedData();
        return dbCache;
    }
};

// Helper function to write to database safely using async queue
const writeDB = async (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        try {
            await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('Error writing DB:', error);
        }
    }).catch(err => {
        console.error('Write queue error:', err);
    });
    return writeQueue;
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// Register endpoint (Security Policy: Hardcodes 'user' role for self-registration)
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
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
        role: 'user' // Hardcoded for security
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
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

    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Get all courses
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const db = await readDB();

    const newContact = {
        id: Date.now(),
        firstName,
        lastName,
        email,
        message,
        date: new Date().toISOString()
    };

    db.contacts = db.contacts || [];
    db.contacts.push(newContact);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Track page view endpoint
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    if (db.stats) {
        db.stats.profileViews = (db.stats.profileViews || 0) + 1;
        await writeDB(db);
    }
    res.json({ status: 'ok', views: db.stats ? db.stats.profileViews : 0 });
});

// Admin stats (protected)
app.get('/api/admin/stats', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }
    const db = await readDB();
    res.json({
        stats: db.stats || {},
        tutors: db.tutors || [],
        customers: db.customers || [],
        contacts: db.contacts || []
    });
});

app.listen(PORT, async () => {
    await readDB(); // Seed database on startup
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
