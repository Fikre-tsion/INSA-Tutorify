const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key_tutorify_2025';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;
let writeQueue = Promise.resolve();

const initialCourses = [
    { id: 1, title: "Responsive Social Media Website UI Design", description: "Learn how to create a responsive social media website UI design using HTML and CSS.", image: "./images/course1.jpg" },
    { id: 2, title: "Responsive SmartHome Website Design", description: "Learn how to create a responsive SmartHome website design using HTML and CSS.", image: "./images/course2.jpg" },
    { id: 3, title: "Responsive Admin Dashboard UI Design", description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.", image: "./images/course3.jpg" },
    { id: 4, title: "Be focused and productive", description: "Learn the fundamentals of productivity and focus, including time management and goal setting.", image: "./images/course4.jpg" },
    { id: 5, title: "How to use every opportunity to be successful", description: "Learn the fundamentals of success, including mindset, goal setting, and communication.", image: "./images/course5.jpg" },
    { id: 6, title: "Responsive social Media UI design", description: "Learn how to create a responsive social Media UI design using HTML and CSS.", image: "./images/course6.jpg" },
    { id: 7, title: "Fundamentals of Digital Marketing", description: "Learn the fundamentals of Digital Marketing, including SEO, social media marketing, and content marketing.", image: "./digitalmarketing.png" },
    { id: 8, title: "How to be a confident and successful person", description: "Learn the fundamentals of self-confidence and success, including mindset and effective communication.", image: "./images/self.png" },
    { id: 9, title: "Cloning Netflix Website", description: "Learn how to create a responsive Netflix website clone using HTML and CSS.", image: "./images/course9.jpg" },
    { id: 10, title: "Digital Newspaper Website Design", description: "Learn how to create a responsive Digital Newspaper website design using HTML and CSS.", image: "./images/course10.jpg" },
    { id: 11, title: "Logo and Graphic Designing", description: "Learn the fundamentals of Logo and Graphic Designing, including design principles and color theory.", image: "./images/course11.jpg" },
    { id: 12, title: "Advanced Admin Dashboard UI Design", description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.", image: "./images/course12.jpg" },
    { id: 13, title: "Introduction to Blockchain Technology", description: "Learn the fundamentals of Blockchain Technology, including architecture and applications.", image: "./images/blockchain.png" },
    { id: 14, title: "Fully functioning Contact Form Design", description: "Learn how to create a responsive Contact Form design using HTML and CSS.", image: "./images/course14.jpg" },
    { id: 15, title: "Landing Page Design", description: "Learn how to create a responsive Landing Page design using HTML and CSS.", image: "./images/course15.jpg" },
    { id: 16, title: "World Class Portfolio Website development", description: "Learn how to create a world Class Portfolio Website using HTML and CSS.", image: "./images/course16.jpg" },
    { id: 17, title: "Responsive Business manager dashboard UI Design", description: "Learn how to create a responsive Business manager dashboard UI design using HTML and CSS.", image: "./images/course17.jpg" },
    { id: 18, title: "Responsive Smart home Application UI Design", description: "Learn how to create a responsive Smart home Application UI design using HTML and CSS.", image: "./images/course18.jpg" }
];

const readDB = () => {
    if (dbCache) return dbCache;
    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: [], messages: [], stats: { pageViews: 1504, tutorials: 18, comments: 284, earnings: 7842 } };
        } else {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            dbCache = JSON.parse(data);
        }
    } catch (e) {
        dbCache = { users: [], courses: [], messages: [], stats: { pageViews: 1504, tutorials: 18, comments: 284, earnings: 7842 } };
    }

    // Ensure all required properties exist
    if (!dbCache.users) dbCache.users = [];
    if (!dbCache.courses || dbCache.courses.length === 0) dbCache.courses = initialCourses;
    if (!dbCache.messages) dbCache.messages = [];
    if (!dbCache.stats) dbCache.stats = { pageViews: 1504, tutorials: 18, comments: 284, earnings: 7842 };

    // Seed default admin if missing
    const adminExists = dbCache.users.some(u => u.email === 'admin@tutorify.com');
    if (!adminExists) {
        const adminPasswordHash = bcrypt.hashSync('password123', 10);
        dbCache.users.unshift({
            id: dbCache.users.length + 1,
            name: 'System Admin',
            email: 'admin@tutorify.com',
            password: adminPasswordHash,
            role: 'admin'
        });
    }

    return dbCache;
};

const writeDB = (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(() => {
        return fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(() => {});
};

// Middleware for authenticating JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token required' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Middleware for validating Admin role
const authenticateAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = readDB();

    if (!email || !password || !name) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Security policy: Hardcode role 'user' to prevent privilege escalation
    const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password: hashedPassword,
        role: 'user'
    };

    db.users.push(newUser);
    writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.email === email && (role ? u.role === role : true));
    if (!user) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '2h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Get Courses endpoint
app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses);
});

// Contact Form submission endpoint
app.post('/api/contact', (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({ message: 'Email and message are required' });
    }

    const db = readDB();
    const newMessage = {
        id: db.messages.length + 1,
        firstName: firstName || '',
        lastName: lastName || '',
        email,
        message,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending'
    };

    db.messages.push(newMessage);
    writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Admin Stats endpoint
app.get('/api/stats', authenticateToken, authenticateAdmin, (req, res) => {
    const db = readDB();
    res.json({
        stats: db.stats,
        messages: db.messages,
        users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
});

// Track Page Views endpoint
app.post('/api/stats/view', (req, res) => {
    const db = readDB();
    db.stats.pageViews = (db.stats.pageViews || 0) + 1;
    writeDB(db);
    res.json({ pageViews: db.stats.pageViews });
});

app.listen(PORT, () => {
    readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
