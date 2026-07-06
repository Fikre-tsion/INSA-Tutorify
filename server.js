const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;

const readDB = async () => {
    if (dbCache) return dbCache;
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
    } catch (err) {
        dbCache = { users: [], courses: [], messages: [], stats: { views: 0, courseCount: 0, messageCount: 0, userCount: 0 } };
    }

    // Migration and seeding
    let modified = false;
    if (!dbCache.users) { dbCache.users = []; modified = true; }
    if (!dbCache.courses) { dbCache.courses = []; modified = true; }
    if (!dbCache.messages) { dbCache.messages = []; modified = true; }
    if (!dbCache.stats) { dbCache.stats = { views: 0, courseCount: 0, messageCount: 0, userCount: 0 }; modified = true; }

    if (dbCache.users.length === 0 || !dbCache.users.find(u => u.email === 'admin@tutorify.com')) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        dbCache.users.push({
            id: Date.now(),
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
        modified = true;
    }

    if (dbCache.courses.length === 0) {
        const courseTitles = [
            "Responsive Social Media Website UI Design", "Responsive SmartHome Website Design",
            "Responsive Admin Dashboard UI Design", "Be focused and productive",
            "How to use every opportunity to be successful", "Responsive social Media UI design",
            "Fundamentals of Digital Marketing", "How to be a confident and successful person",
            "Cloning Netflix Website", "Digital Newspaper Website Design",
            "Advanced Admin Dashboard UI", "Logo and Graphic Designing",
            "Introduction to Blockchain Technology", "Fully functioning Contact Form Design",
            "Landing Page Design", "World Class Portfolio Website development",
            "Responsive Business manager dashboard UI Design", "Responsive Smart home Application UI Design"
        ];
        dbCache.courses = courseTitles.map((title, i) => ({
            id: i + 1,
            title,
            description: `Comprehensive course on ${title.toLowerCase()}. Master the skills needed to excel in this field.`,
            image: `./images/course${(i % 6) + 1}.jpg`
        }));
        // Use digitalmarketing.png for one to ensure we have at least one valid image
        dbCache.courses[6].image = './digitalmarketing.png';
        modified = true;
    }

    dbCache.stats.courseCount = dbCache.courses.length;
    dbCache.stats.userCount = dbCache.users.length;
    dbCache.stats.messageCount = dbCache.messages.length;

    if (modified) await writeDB(dbCache);
    return dbCache;
};

const writeDB = async (data) => {
    dbCache = data;
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Middlewares
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') next();
    else res.status(403).json({ message: 'Admin access required' });
};

// Endpoints
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

app.get('/api/stats', authenticate, isAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        ...db.stats,
        messages: db.messages,
        users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
});

app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views++;
    await writeDB(db);
    res.json({ success: true });
});

app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();
    const newMessage = { id: Date.now(), name: `${firstName} ${lastName}`, email, message, date: new Date().toISOString() };
    db.messages.push(newMessage);
    db.stats.messageCount = db.messages.length;
    await writeDB(db);
    res.json({ message: 'Message sent successfully' });
});

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = await readDB();
    if (db.users.find(u => u.email === email)) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, password: hashedPassword, role: 'user' };
    db.users.push(newUser);
    db.stats.userCount = db.users.length;
    await writeDB(db);
    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = await readDB();
    const user = db.users.find(u => u.email === email && u.role === role);
    if (!user) return res.status(400).json({ message: 'Invalid email, password or role' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email, password or role' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
