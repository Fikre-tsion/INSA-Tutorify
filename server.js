const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret_key_for_local_only';
const DB_FILE = path.join(__dirname, 'db.json');

// Bolt Optimization: In-memory cache to reduce disk I/O latency
let dbCache = null;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Helper function to read database (Async to avoid blocking the event loop)
const readDB = async () => {
    if (dbCache) return dbCache;

    if (!fs.existsSync(DB_FILE)) {
        dbCache = { users: [], courses: [], messages: [], stats: { views: 0 } };
        return dbCache;
    }

    try {
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        return dbCache;
    } catch (err) {
        console.error("Error reading DB:", err);
        return { users: [], courses: [], messages: [], stats: { views: 0 } };
    }
};

// Helper function to write to database (Async to avoid blocking the event loop)
const writeDB = async (data) => {
    dbCache = data;
    try {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing DB:", err);
    }
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
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
        role
    };

    db.users.push(newUser);
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
        // Fallback for initial placeholder users if needed, but we'll re-register them or just use hashed passwords
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
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
    const db = await readDB();

    const newMessage = {
        id: Date.now(),
        name: `${firstName} ${lastName}`,
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages = db.messages || [];
    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Get stats for dashboard
app.get('/api/stats', async (req, res) => {
    const db = await readDB();
    const stats = {
        views: db.stats ? db.stats.views : 0,
        courseCount: (db.courses || []).length,
        messageCount: (db.messages || []).length,
        userCount: (db.users || []).length,
        messages: (db.messages || []).slice(-5).reverse(), // Last 5 messages
        users: (db.users || []).slice(-5).reverse() // Last 5 users
    };
    res.json(stats);
});

// Record page view
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats = db.stats || { views: 0 };
    db.stats.views++;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    // Seed database if empty
    const db = await readDB();
    let updated = false;

    // Seed admin
    if (!db.users || db.users.length === 0) {
        const hashedPassword = bcrypt.hashSync('password123', 10);
        db.users = [{
            id: 1,
            name: 'Admin',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        }];
        updated = true;
    }

    // Seed stats
    if (!db.stats) {
        db.stats = { views: 1504 };
        updated = true;
    }

    // Seed courses if missing
    if (!db.courses || db.courses.length === 0) {
        db.courses = [
            { id: 1, title: "Responsive Social Media Website UI Design", description: "Learn how to create a responsive social media website UI design using HTML and CSS.", image: "./images/course1.jpg" },
            { id: 2, title: "Responsive SmartHome Website Design", description: "Learn how to create a responsive SmartHome website design using HTML and CSS.", image: "./images/course2.jpg" },
            { id: 3, title: "Responsive Admin Dashboard UI Design", description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.", image: "./images/course3.jpg" },
            { id: 4, title: "Be focused and productive", description: "Learn the fundamentals of productivity and focus, including time management and goal setting.", image: "./images/course4.jpg" },
            { id: 5, title: "How to use every opportunity to be successful", description: "Learn the fundamentals of success, including mindset and effective communication.", image: "./images/course5.jpg" },
            { id: 6, title: "Responsive social Media UI design", description: "Learn how to create a responsive social Media UI design using HTML and CSS.", image: "./images/course6.jpg" },
            { id: 7, title: "Fundamentals of Digital Marketing", description: "Learn SEO, social media marketing, email marketing, and content marketing.", image: "./images/digitalmarketing.png" },
            { id: 8, title: "How to be a confident and successful person", description: "Learn self-confidence fundamentals, including mindset and goal setting.", image: "./images/self.png" },
            { id: 9, title: "Cloning Netflix Website", description: "Learn how to create a responsive Netflix website clone using HTML and CSS.", image: "./images/course9.jpg" },
            { id: 10, title: "Digital Newspaper Website Design", description: "Learn how to create a responsive Digital Newspaper website design using HTML and CSS.", image: "./images/course10.jpg" }
        ];
        updated = true;
    }

    if (updated) {
        await writeDB(db);
    }
});
