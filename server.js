const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Serve static assets from specific directories only
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images2', express.static(path.join(__dirname, 'images2')));

// Serve specific HTML files
const serveHTML = (file) => (req, res) => res.sendFile(path.join(__dirname, file));

app.get('/', serveHTML('index.html'));
app.get('/index.html', serveHTML('index.html'));
app.get('/about.html', serveHTML('about.html'));
app.get('/courses.html', serveHTML('courses.html'));
app.get('/contact.html', serveHTML('contact.html'));
app.get('/login.html', serveHTML('login.html'));
app.get('/dashboard.html', serveHTML('dashboard.html'));
app.get('/privacy.html', serveHTML('privacy.html'));
app.get('/terms.html', serveHTML('terms.html'));
app.get('/refund.html', serveHTML('refund.html'));
app.get('/main.js', serveHTML('main.js'));
app.get('/dashboard.css', serveHTML('dashboard.css'));

// Simple queue for atomic database writes
let dbQueue = Promise.resolve();

// Helper function to read database
const readDB = async () => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        const db = JSON.parse(data);
        if (!db.users) db.users = [];
        if (!db.courses) db.courses = [];
        if (!db.contacts) db.contacts = [];
        return db;
    } catch (error) {
        return { users: [], courses: [], contacts: [] };
    }
};

// Helper function to write to database safely
const writeDB = async (data) => {
    // SECURITY: Limit queue depth or use a more robust queue if needed.
    // For this app, sequential chaining is fine but we catch errors.
    dbQueue = dbQueue.then(async () => {
        try {
            await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error('DB Write Error:', err);
        }
    });
    return dbQueue;
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
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
            role: role || 'user'
        };

        db.users.push(newUser);
        await writeDB(db);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
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

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            SECRET_KEY,
            { expiresIn: '1h' }
        );
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET Courses
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses || []);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST Contact Form
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        const db = await readDB();

        const newContact = {
            id: (db.contacts || []).length + 1,
            firstName,
            lastName,
            email,
            message,
            date: new Date().toISOString()
        };

        if (!db.contacts) db.contacts = [];
        db.contacts.push(newContact);
        await writeDB(db);

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET Stats
app.get('/api/stats', async (req, res) => {
    try {
        const db = await readDB();
        res.json({
            users: (db.users || []).length,
            courses: (db.courses || []).length,
            contacts: (db.contacts || []).length
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
