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
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';
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
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and communication.', image: './images/course5.jpg' },
    { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO, social media, and email marketing.', image: './digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success for personal and professional life.', image: './images/self.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
    { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles and typography.', image: './images/course11.jpg' },
    { id: 12, title: 'Responsive Admin Dashboard UI Design', description: 'Learn layout techniques, styling, and best practices for building dashboard UIs.', image: './images/course12.jpg' },
    { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, architecture, and smart contracts.', image: './images/blockchain.png' },
    { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML and CSS.', image: './images/course14.jpg' },
    { id: 15, title: 'Landing Page Design', description: 'Learn how to create a responsive Landing Page design using HTML and CSS.', image: './images/course15.jpg' },
    { id: 16, title: 'World Class Portfolio Website development', description: 'Learn how to create a world class portfolio website using HTML and CSS.', image: './images/course16.jpg' },
    { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to create a responsive business manager dashboard UI design.', image: './images/course17.jpg' },
    { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Learn how to create a responsive smart home application UI design.', image: './images/course18.jpg' }
];

// Helper function to read database with caching and migration
const readDB = async () => {
    try {
        if (!fsSync.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: [], messages: [], stats: { views: 1504, tutorials: 18, comments: 284, earnings: "7,842" } };
        } else {
            const data = await fs.readFile(DB_FILE, 'utf8');
            dbCache = JSON.parse(data);
        }

        // Migrations / schema safety
        if (!dbCache.users) dbCache.users = [];
        if (!dbCache.courses || dbCache.courses.length === 0) dbCache.courses = initialCourses;
        if (!dbCache.messages) dbCache.messages = [];
        if (!dbCache.stats) dbCache.stats = { views: 1504, tutorials: 18, comments: 284, earnings: "7,842" };

        // Ensure default admin user exists
        const adminEmail = 'admin@tutorify.com';
        const hasAdmin = dbCache.users.some(u => u.email === adminEmail && u.role === 'admin');
        if (!hasAdmin) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            dbCache.users.push({
                id: dbCache.users.length + 1,
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin'
            });
            await writeDB(dbCache);
        }

        return dbCache;
    } catch (err) {
        console.error('Error reading DB:', err);
        return dbCache || { users: [], courses: [], messages: [], stats: { views: 1504, tutorials: 18, comments: 284, earnings: "7,842" } };
    }
};

// Helper function to write to database safely using writeQueue
const writeDB = (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
    }).catch(err => {
        console.error('Error writing to DB file:', err);
    });
    return writeQueue;
};

// Middleware for Admin authentication
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access token required' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err || user.role !== 'admin') {
            return res.status(403).json({ message: 'Invalid token or insufficient admin permissions' });
        }
        req.user = user;
        next();
    });
};

// Register endpoint - hardcodes role 'user' for security
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = await readDB();

    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password: hashedPassword,
        role: 'user' // Security: hardcoded role 'user'
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = await readDB();

    const targetRole = role || 'user';
    const user = db.users.find(u => u.email === email && u.role === targetRole);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    let isPasswordValid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
        isPasswordValid = (password === user.password);
    }

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

// Get courses endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Submit contact form endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, name, email, message } = req.body;
    const db = await readDB();

    const senderName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'Anonymous';
    if (!email || !message) {
        return res.status(400).json({ message: 'Email and message are required' });
    }

    const newMessage = {
        id: db.messages.length + 1,
        name: senderName,
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Track page views
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

// Get dashboard stats (admin protected)
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        stats: db.stats,
        usersCount: db.users.length,
        coursesCount: db.courses.length,
        messagesCount: db.messages.length,
        messages: db.messages
    });
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
