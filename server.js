const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is missing');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;

const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and effective communication.', image: './images/course5.jpg' },
    { id: 6, title: 'Responsive Social Media UI Design', description: 'Learn how to create a responsive social media UI design using HTML and CSS.', image: './images/course6.jpg' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO, social media marketing, and content marketing.', image: './images/digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success, including mindset and goal setting.', image: './images/self.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
    { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles and color theory.', image: './images/course11.jpg' },
    { id: 12, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course12.jpg' },
    { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, including architecture and smart contracts.', image: './images/blockchain.png' },
    { id: 14, title: 'Fully Functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML and CSS.', image: './images/course14.jpg' },
    { id: 15, title: 'Landing Page Design', description: 'Learn how to create a responsive Landing Page design using HTML and CSS.', image: './images/course15.jpg' },
    { id: 16, title: 'World Class Portfolio Website Development', description: 'Learn how to create a world class portfolio website using HTML and CSS.', image: './images/course16.jpg' },
    { id: 17, title: 'Responsive Business Manager Dashboard UI Design', description: 'Learn how to create a responsive Business Manager dashboard UI design using HTML and CSS.', image: './images/course17.jpg' },
    { id: 18, title: 'Responsive Smart Home Application UI Design', description: 'Learn how to create a responsive Smart Home application UI design using HTML and CSS.', image: './images/course18.jpg' }
];

// Helper function to read database asynchronously with caching and seeding
const readDB = async () => {
    if (!dbCache) {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: [], messages: [], stats: { views: 0 } };
        } else {
            try {
                const data = await fs.promises.readFile(DB_FILE, 'utf8');
                dbCache = JSON.parse(data);
            } catch (err) {
                dbCache = { users: [], courses: [], messages: [], stats: { views: 0 } };
            }
        }
    }

    let modified = false;

    if (!dbCache.users) { dbCache.users = []; modified = true; }
    if (!dbCache.courses) { dbCache.courses = []; modified = true; }
    if (!dbCache.messages) { dbCache.messages = []; modified = true; }
    if (!dbCache.stats) { dbCache.stats = { views: 0 }; modified = true; }

    // Seed default admin if missing
    if (!dbCache.users.find(u => u.email === 'admin@tutorify.com')) {
        const adminPassword = await bcrypt.hash('password123', 10);
        dbCache.users.push({
            id: 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: adminPassword,
            role: 'admin'
        });
        modified = true;
    }

    // Seed initial courses if empty
    if (dbCache.courses.length === 0) {
        dbCache.courses = initialCourses;
        modified = true;
    }

    if (modified) {
        await writeDB(dbCache);
    }

    return dbCache;
};

// Helper function to write to database asynchronously
const writeDB = async (data) => {
    dbCache = data;
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
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
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};

// Register endpoint (hardcode role to 'user' for security)
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
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
            role: 'user'
        };

        db.users.push(newUser);
        await writeDB(db);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }
        const db = await readDB();
        const senderName = (firstName || lastName) ? `${firstName || ''} ${lastName || ''}`.trim() : 'Anonymous';
        const newMessage = {
            id: db.messages.length + 1,
            name: senderName,
            email,
            message,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        };

        db.messages.push(newMessage);
        await writeDB(db);

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get courses endpoint
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Record page view endpoint
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        db.stats.views = (db.stats.views || 0) + 1;
        await writeDB(db);
        res.json({ views: db.stats.views });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get admin statistics endpoint (Protected)
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await readDB();
        const safeUsers = db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
        res.json({
            views: db.stats.views || 0,
            courseCount: db.courses.length,
            messageCount: db.messages.length,
            userCount: db.users.length,
            messages: db.messages,
            users: safeUsers
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
