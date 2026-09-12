const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'tutorify_jwt_secret_key_2025_fixed_signature';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;
let writeQueue = Promise.resolve();

const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and effective communication.', image: './images/course5.jpg' },
    { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO, social media marketing, and content marketing.', image: './images/digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success for personal and professional growth.', image: './images/self.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
    { id: 11, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course12.jpg' },
    { id: 12, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles and color theory.', image: './images/course11.jpg' },
    { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, including architecture and consensus mechanisms.', image: './images/blockchain.png' },
    { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML and CSS.', image: './images/course14.jpg' },
    { id: 15, title: 'Landing Page Design', description: 'Learn how to create a responsive Landing Page design using HTML and CSS.', image: './images/course15.jpg' },
    { id: 16, title: 'World Class Portfolio Website development', description: 'Learn how to create a world class Portfolio Website using HTML and CSS.', image: './images/course16.jpg' },
    { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to create a responsive Business manager dashboard UI design.', image: './images/course17.jpg' },
    { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Learn how to create a responsive Smart home Application UI design.', image: './images/course18.jpg' }
];

async function readDB() {
    if (dbCache) return dbCache;

    try {
        if (!fsSync.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: [], messages: [], stats: { views: 1504, tutorials: 18, comments: 284, earnings: "ETB 7,842" } };
        } else {
            const data = await fs.readFile(DB_FILE, 'utf8');
            dbCache = JSON.parse(data);
        }
    } catch (err) {
        dbCache = { users: [], courses: [], messages: [], stats: { views: 1504, tutorials: 18, comments: 284, earnings: "ETB 7,842" } };
    }

    if (!Array.isArray(dbCache.users)) dbCache.users = [];
    if (!Array.isArray(dbCache.courses) || dbCache.courses.length === 0) dbCache.courses = initialCourses;
    if (!Array.isArray(dbCache.messages)) dbCache.messages = [];
    if (!dbCache.stats) dbCache.stats = { views: 1504, tutorials: 18, comments: 284, earnings: "ETB 7,842" };

    let admin = dbCache.users.find(u => u.email === 'admin@tutorify.com');
    if (!admin) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        admin = {
            id: dbCache.users.length + 1,
            name: 'Admin',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        };
        dbCache.users.push(admin);
    }

    await writeDB(dbCache);
    return dbCache;
}

async function writeDB(data) {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
    }).catch(() => {});
    return writeQueue;
}

// Auth Middleware for Admin
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

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
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
            role: 'user' // Security policy: hardcode user role
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
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Courses endpoint
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses || []);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving courses' });
    }
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        if (!firstName || !email || !message) {
            return res.status(400).json({ message: 'Please complete required fields' });
        }

        const db = await readDB();
        const newMessage = {
            id: db.messages.length + 1,
            sender: `${firstName} ${lastName || ''}`.trim(),
            email,
            message,
            date: new Date().toISOString().split('T')[0],
            status: 'Received'
        };

        db.messages.push(newMessage);
        await writeDB(db);

        res.status(201).json({ success: true, message: 'Message sent successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to save message' });
    }
});

// Page view tracking endpoint
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        if (!db.stats) db.stats = { views: 0, tutorials: 18, comments: 284, earnings: "ETB 7,842" };
        db.stats.views = (db.stats.views || 0) + 1;
        await writeDB(db);
        res.json({ success: true, views: db.stats.views });
    } catch (err) {
        res.status(500).json({ message: 'Error updating views' });
    }
});

// Admin stats endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await readDB();
        res.json({
            stats: db.stats,
            messages: db.messages,
            users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
            courses: db.courses
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
