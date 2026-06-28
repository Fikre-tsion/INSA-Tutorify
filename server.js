const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Performance Optimization: In-memory cache for the JSON database
// This reduces disk I/O significantly for read-heavy operations
let dbCache = null;

// Helper function to read database
const readDB = async () => {
    if (dbCache) return dbCache;

    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);

        // Migration: Ensure all required fields exist
        let migrated = false;
        if (!dbCache.users) { dbCache.users = []; migrated = true; }

        // Ensure admin user exists
        if (!dbCache.users.find(u => u.email === 'admin@tutorify.com')) {
            dbCache.users.push({
                id: dbCache.users.length + 1,
                name: "Admin",
                email: "admin@tutorify.com",
                password: "$2a$10$pFvT30vVR/NQc/ikpN.y.eN2elviXcjIkW34AdQavsOC6hK6Hr47a", // password123
                role: "admin"
            });
            migrated = true;
        }

        if (!dbCache.courses) {
            dbCache.courses = [
                { id: 1, title: "Responsive Social Media Website UI Design", description: "Learn how to create a responsive social media website UI design using HTML and CSS.", image: "./images/course1.jpg" },
                { id: 2, title: "Responsive SmartHome Website Design", description: "Learn how to create a responsive SmartHome website design using HTML and CSS.", image: "./images/course2.jpg" },
                { id: 3, title: "Responsive Admin Dashboard UI Design", description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.", image: "./images/course3.jpg" }
            ];
            migrated = true;
        }
        if (!dbCache.messages) { dbCache.messages = []; migrated = true; }
        if (!dbCache.stats) {
            dbCache.stats = {
                views: 1504,
                courseCount: dbCache.courses.length,
                messageCount: dbCache.messages.length,
                userCount: dbCache.users.length
            };
            migrated = true;
        }

        if (migrated) {
            await fs.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
        }

        return dbCache;
    } catch (error) {
        // Initialize default database structure if file doesn't exist
        const defaultDB = {
            users: [
                {
                    id: 1,
                    name: "Admin",
                    email: "admin@tutorify.com",
                    password: "$2a$10$pFvT30vVR/NQc/ikpN.y.eN2elviXcjIkW34AdQavsOC6hK6Hr47a", // password123
                    role: "admin"
                }
            ],
            courses: [
                { id: 1, title: "Responsive Social Media Website UI Design", description: "Learn how to create a responsive social media website UI design using HTML and CSS.", image: "./images/course1.jpg" },
                { id: 2, title: "Responsive SmartHome Website Design", description: "Learn how to create a responsive SmartHome website design using HTML and CSS.", image: "./images/course2.jpg" },
                { id: 3, title: "Responsive Admin Dashboard UI Design", description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.", image: "./images/course3.jpg" }
            ],
            messages: [],
            stats: {
                views: 1504,
                courseCount: 3,
                messageCount: 0,
                userCount: 1
            }
        };
        dbCache = defaultDB;
        await writeDB(defaultDB);
        return dbCache;
    }
};

// Helper function to write to database
const writeDB = async (data) => {
    dbCache = data; // Update cache
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Middleware to authenticate JWT and check admin role
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        req.user = decoded;
        next();
    });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
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
        role: 'user' // Default to user role for security
    };

    db.users.push(newUser);
    db.stats.userCount = db.users.length;
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
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
});

// Course endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    const db = await readDB();

    const newMessage = {
        id: db.messages.length + 1,
        name,
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    db.stats.messageCount = db.messages.length;
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Stats view endpoint
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views++;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

// Admin stats endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        stats: db.stats,
        messages: db.messages.slice(-5).reverse(), // Last 5 messages
        users: db.users.slice(-5).reverse() // Last 5 users
    });
});

app.listen(PORT, async () => {
    await readDB(); // Warm up cache on start
    console.log(`Server is running on http://localhost:${PORT}`);
});
