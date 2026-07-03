const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
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

// Performance Optimization: In-memory cache for the JSON database to reduce disk I/O
let dbCache = null;

// Helper function to read database with caching
const readDB = () => {
    if (dbCache) return dbCache;

    if (!fs.existsSync(DB_FILE)) {
        dbCache = { users: [], courses: [], messages: [], stats: { views: 0 } };
        writeDB(dbCache);
        return dbCache;
    }

    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);

        // Migration: Ensure all fields exist
        if (!dbCache.users) dbCache.users = [];
        if (!dbCache.courses) dbCache.courses = [];
        if (!dbCache.messages) dbCache.messages = [];
        if (!dbCache.stats) dbCache.stats = { views: 0 };

        return dbCache;
    } catch (err) {
        console.error("Error reading database:", err);
        return { users: [], courses: [], messages: [], stats: { views: 0 } };
    }
};

// Helper function to write to database and update cache
const writeDB = (data) => {
    dbCache = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Seed initial data if empty
const seedDB = () => {
    const db = readDB();
    if (db.courses.length === 0) {
        db.courses = [
            { id: 1, title: "Responsive Social Media Website UI Design", description: "Learn how to create a responsive social media website UI design using HTML and CSS.", image: "./images/course1.jpg" },
            { id: 2, title: "Responsive SmartHome Website Design", description: "Learn how to create a responsive SmartHome website design using HTML and CSS.", image: "./images/course2.jpg" },
            { id: 3, title: "Responsive Admin Dashboard UI Design", description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.", image: "./images/course3.jpg" },
            { id: 4, title: "Be focused and productive", description: "Learn the fundamentals of productivity and focus, including time management, goal setting, and effective work habits.", image: "./images/course4.jpg" },
            { id: 5, title: "How to use every opportunity to be successful", description: "Learn the fundamentals of success, including mindset, goal setting, and effective communication.", image: "./images/course5.jpg" },
            { id: 6, title: "Responsive social Media UI design", description: "Learn how to create a responsive social Media UI design using HTML and CSS.", image: "./images/course6.jpg" },
            { id: 7, title: "Fundamentals of Digital Marketing", description: "Learn the fundamentals of Digital Marketing, including SEO, social media marketing, and more.", image: "./images/digitalmarketing.png" },
            { id: 8, title: "How to be a confident and successful person", description: "Learn the fundamentals of self-confidence and success, including mindset and goal setting.", image: "./images/self.png" },
            { id: 9, title: "Cloning Netflix Website", description: "Learn how to create a responsive Netflix website clone using HTML and CSS.", image: "./images/course9.jpg" },
            { id: 10, title: "Digital Newspaper Website Design", description: "Learn how to create a responsive Digital Newspaper website design using HTML and CSS.", image: "./images/course10.jpg" },
            { id: 11, title: "Logo and Graphic Designing", description: "Learn the fundamentals of Logo and Graphic Designing, including design principles and color theory.", image: "./images/course11.jpg" },
            { id: 12, title: "Introduction to Blockchain Technology", description: "Learn the fundamentals of Blockchain Technology, including its architecture and applications.", image: "./images/blockchain.png" },
            { id: 13, title: "Fully functioning Contact Form Design", description: "Learn how to create a responsive Contact Form design using HTML and CSS.", image: "./images/course14.jpg" },
            { id: 14, title: "Landing Page Design", description: "Learn how to create a responsive Landing Page design using HTML and CSS.", image: "./images/course15.jpg" },
            { id: 15, title: "World Class Portfolio Website development", description: "Learn how to create a world Class Portfolio Website using HTML and CSS.", image: "./images/course16.jpg" },
            { id: 16, title: "Responsive Business manager dashboard UI Design", description: "Learn how to create a responsive Business manager dashboard UI design using HTML and CSS.", image: "./images/course17.jpg" },
            { id: 17, title: "Responsive Smart home Application UI Design", description: "Learn how to create a responsive Smart home Application UI design using HTML and CSS.", image: "./images/course18.jpg" }
        ];
        writeDB(db);
    }

    // Ensure admin user exists for testing
    const adminEmail = 'admin@tutorify.com';
    if (!db.users.find(u => u.email === adminEmail)) {
        const hashedPassword = bcrypt.hashSync('password123', 10);
        db.users.push({
            id: db.users.length + 1,
            name: "Admin User",
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
        });
        writeDB(db);
    }
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
        role: role || 'user' // Default to user
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
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Courses endpoint
app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses);
});

// Stats endpoint (Admin only ideally, but keeping it simple for now)
app.get('/api/stats', (req, res) => {
    const db = readDB();
    const stats = {
        views: db.stats.views,
        courseCount: db.courses.length,
        messageCount: db.messages.length,
        userCount: db.users.length,
        messages: db.messages.slice(-5), // Last 5 messages
        users: db.users.slice(-5).map(u => ({ name: u.name, role: u.role })) // Last 5 users
    };
    res.json(stats);
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

// Page view tracking endpoint
app.post('/api/stats/view', (req, res) => {
    const db = readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    writeDB(db);
    res.json({ views: db.stats.views });
});

app.listen(PORT, () => {
    seedDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
