const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'tutorify_jwt_secret_key_2025_prod_safe';
if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET environment variable is not set. Using default secret key.');
}
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, mindset, goal setting, and effective communication.', image: './images/course5.jpg' },
    { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn SEO, social media marketing, email marketing, and content marketing.', image: './images/digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and personal growth.', image: './images/self.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design.', image: './images/course10.jpg' },
    { id: 11, title: 'Logo and Graphic Designing', description: 'Learn design principles, color theory, and typography for graphic design.', image: './images/course11.jpg' },
    { id: 12, title: 'Responsive Admin Dashboard UI Design', description: 'Master layout techniques and styling for admin panels.', image: './images/course12.jpg' },
    { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn blockchain architecture, consensus mechanisms, and DApps.', image: './images/blockchain.png' },
    { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to build and style interactive contact forms.', image: './images/course14.jpg' },
    { id: 15, title: 'Landing Page Design', description: 'Learn how to create responsive and modern landing pages.', image: './images/course15.jpg' },
    { id: 16, title: 'World Class Portfolio Website development', description: 'Build stunning personal portfolio websites to showcase your work.', image: './images/course16.jpg' },
    { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Design business management dashboards with HTML and CSS.', image: './images/course17.jpg' },
    { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Design mobile and web UI for smart home control systems.', image: './images/course18.jpg' }
];

// Helper function to read database and perform default migrations / seeding
const readDB = () => {
    let db = { users: [], courses: [], messages: [], stats: { pageViews: 0 } };
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            db = JSON.parse(data);
        } catch (e) {
            console.error('Error parsing DB_FILE, starting with default structure:', e);
        }
    }

    let modified = false;

    if (!db.users) { db.users = []; modified = true; }
    if (!db.courses) { db.courses = []; modified = true; }
    if (!db.messages) { db.messages = []; modified = true; }
    if (!db.stats) { db.stats = { pageViews: 0 }; modified = true; }

    // Seed admin if not present
    const adminExists = db.users.find(u => u.email === 'admin@tutorify.com');
    if (!adminExists) {
        const adminPasswordHash = bcrypt.hashSync('password123', 10);
        db.users.push({
            id: db.users.length + 1,
            name: 'Admin',
            email: 'admin@tutorify.com',
            password: adminPasswordHash,
            role: 'admin'
        });
        modified = true;
    }

    // Seed initial courses if empty
    if (db.courses.length === 0) {
        db.courses = initialCourses;
        modified = true;
    }

    if (modified) {
        writeDB(db);
    }

    return db;
};

// Helper function to write to database
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
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

// Middleware for authenticating Admin role
const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin access required' });
        }
    });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const db = readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Security policy: Hardcode 'user' role for public registration
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
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = readDB();

    const user = db.users.find(u => u.email === email && (!role || u.role === role));
    if (!user) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// GET /api/courses
app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses);
});

// POST /api/contact
app.post('/api/contact', (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'First name, email, and message are required' });
    }

    const db = readDB();
    const newMessage = {
        id: db.messages.length + 1,
        firstName,
        lastName: lastName || '',
        email,
        message,
        createdAt: new Date().toISOString()
    };

    db.messages.push(newMessage);
    writeDB(db);

    res.status(201).json({ message: 'Message sent successfully!' });
});

// POST /api/stats/view
app.post('/api/stats/view', (req, res) => {
    const db = readDB();
    db.stats.pageViews = (db.stats.pageViews || 0) + 1;
    writeDB(db);
    res.json({ pageViews: db.stats.pageViews });
});

// GET /api/stats (Admin required)
app.get('/api/stats', authenticateAdmin, (req, res) => {
    const db = readDB();
    res.json({
        pageViews: db.stats.pageViews || 0,
        userCount: db.users.length,
        courseCount: db.courses.length,
        messageCount: db.messages.length,
        messages: db.messages,
        users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
});

app.listen(PORT, () => {
    readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
