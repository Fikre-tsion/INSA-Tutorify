const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'tutorify_secure_secret_key_2025_982347123';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Helper function to read database
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        return { users: [], courses: [], enrollments: [], contacts: [] };
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
};

// Helper function to write to database
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTH ENDPOINTS ---

app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const db = readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Security: Only allow self-registration as 'user'
    const finalRole = role === 'admin' ? 'user' : role;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: Date.now(),
        name,
        email,
        password: hashedPassword,
        role: finalRole,
        createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);
    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.email === email && u.role === role);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// --- COURSE ENDPOINTS ---

app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses);
});

app.post('/api/enroll', authenticateToken, (req, res) => {
    const { courseId } = req.body;
    const db = readDB();

    const enrollment = {
        userId: req.user.id,
        courseId,
        enrolledAt: new Date().toISOString()
    };

    if (db.enrollments.find(e => e.userId === req.user.id && e.courseId === courseId)) {
        return res.status(400).json({ message: 'Already enrolled' });
    }

    db.enrollments.push(enrollment);
    writeDB(db);
    res.json({ message: 'Enrolled successfully' });
});

app.get('/api/my-courses', authenticateToken, (req, res) => {
    const db = readDB();
    const userEnrollments = db.enrollments.filter(e => e.userId === req.user.id);
    const enrolledCourses = db.courses.filter(c => userEnrollments.find(e => e.courseId === c.id));
    res.json(enrolledCourses);
});

// --- CONTACT ENDPOINT ---

app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    const db = readDB();

    const newContact = {
        id: Date.now(),
        name,
        email,
        message,
        receivedAt: new Date().toISOString()
    };

    db.contacts.push(newContact);
    writeDB(db);
    res.json({ message: 'Message sent successfully' });
});

// --- ADMIN STATS ---

app.get('/api/stats', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const db = readDB();
    res.json({
        totalUsers: db.users.length,
        totalCourses: db.courses.length,
        totalEnrollments: db.enrollments.length,
        totalContacts: db.contacts.length,
        recentUsers: db.users.slice(-5).reverse(),
        recentContacts: db.contacts.slice(-5).reverse()
    });
});

// --- SECURE STATIC SERVING ---
// Serve allowed assets
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images2', express.static(path.join(__dirname, 'images2')));

// Explicitly serve frontend files
const serveFile = (fileName) => (req, res) => res.sendFile(path.join(__dirname, fileName));

app.get('/', serveFile('index.html'));
app.get('/index.html', serveFile('index.html'));
app.get('/about.html', serveFile('about.html'));
app.get('/contact.html', serveFile('contact.html'));
app.get('/courses.html', serveFile('courses.html'));
app.get('/course.html', serveFile('course.html'));
app.get('/dashboard.html', serveFile('dashboard.html'));
app.get('/login.html', serveFile('login.html'));
app.get('/privacy.html', serveFile('privacy.html'));
app.get('/refund.html', serveFile('refund.html'));
app.get('/terms.html', serveFile('terms.html'));
app.get('/main.js', serveFile('main.js'));
app.get('/dashboard.js', serveFile('dashboard.js'));
app.get('/dashboard.css', serveFile('dashboard.css'));

// Fallback for SPA or unknown routes
app.get('*', (req, res) => {
    if (req.path.includes('.')) return res.sendStatus(404);
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
