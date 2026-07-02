const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret_key';
const DB_FILE = path.join(__dirname, 'db.json');

// In-memory cache for database
let dbCache = null;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Helper function to read database
const readDB = () => {
    // Return cached data if available for faster reads
    if (dbCache) return dbCache;

    if (!fs.existsSync(DB_FILE)) {
        const initialDB = {
            users: [
                {
                    id: 1,
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
                    description: "Learn how to create a responsive social media website UI design using HTML and CSS.",
                    image: "./digitalmarketing.png"
                },
                {
                    id: 2,
                    title: "Responsive SmartHome Website Design",
                    description: "Learn how to create a responsive SmartHome website design using HTML and CSS.",
                    image: "./digitalmarketing.png"
                },
                {
                    id: 3,
                    title: "Responsive Admin Dashboard UI Design",
                    description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.",
                    image: "./digitalmarketing.png"
                }
            ],
            messages: [],
            stats: { views: 0 }
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf8');
        dbCache = initialDB;
        return initialDB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    dbCache = db;

    // Migration: ensure all keys exist
    let modified = false;
    if (!db.users) {
        db.users = [];
        modified = true;
    }

    // Ensure admin exists
    if (!db.users.find(u => u.role === 'admin')) {
        db.users.push({
            id: db.users.length + 1,
            name: "Admin User",
            email: "admin@tutorify.com",
            password: bcrypt.hashSync("password123", 10),
            role: "admin"
        });
        modified = true;
    }

    if (!db.courses) {
        db.courses = [
            {
                id: 1,
                title: "Responsive Social Media Website UI Design",
                description: "Learn how to create a responsive social media website UI design using HTML and CSS.",
                image: "./digitalmarketing.png"
            },
            {
                id: 2,
                title: "Responsive SmartHome Website Design",
                description: "Learn how to create a responsive SmartHome website design using HTML and CSS.",
                image: "./digitalmarketing.png"
            },
            {
                id: 3,
                title: "Responsive Admin Dashboard UI Design",
                description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.",
                image: "./digitalmarketing.png"
            }
        ];
        modified = true;
    }
    if (!db.messages) { db.messages = []; modified = true; }
    if (!db.stats) { db.stats = { views: 0 }; modified = true; }

    if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    }

    dbCache = db;
    return db;
};

// Helper function to write to database
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    dbCache = data; // Update cache on write
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const db = readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password: hashedPassword,
        role
    };

    db.users.push(newUser);
    writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.email === email && u.role === role);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        // Fallback for initial placeholder users if needed, but we'll re-register them or just use hashed passwords
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Get courses
app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses);
});

// Contact endpoint
app.post('/api/contact', (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = readDB();

    const newMessage = {
        id: db.messages.length + 1,
        name: `${firstName} ${lastName}`,
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Stats endpoint (Admin only)
app.get('/api/stats', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const db = readDB();
        res.json({
            views: db.stats.views,
            courseCount: db.courses.length,
            messageCount: db.messages.length,
            userCount: db.users.length,
            messages: db.messages,
            users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
        });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Record view endpoint
app.post('/api/stats/view', (req, res) => {
    const db = readDB();
    db.stats.views++;
    writeDB(db);
    res.json({ views: db.stats.views });
});

app.listen(PORT, () => {
    readDB(); // Initialize DB on startup
    console.log(`Server is running on http://localhost:${PORT}`);
});
