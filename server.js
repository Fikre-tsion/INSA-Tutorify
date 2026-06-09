const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Security Hardening: Fatal error if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Serving static files explicitly for security
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images2', express.static(path.join(__dirname, 'images2')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/about.html', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/courses.html', (req, res) => res.sendFile(path.join(__dirname, 'courses.html')));
app.get('/contact.html', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/privacy.html', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));
app.get('/terms.html', (req, res) => res.sendFile(path.join(__dirname, 'terms.html')));
app.get('/refund.html', (req, res) => res.sendFile(path.join(__dirname, 'refund.html')));
app.get('/main.js', (req, res) => res.sendFile(path.join(__dirname, 'main.js')));
app.get('/dashboard.js', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.js')));
app.get('/dashboard.css', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.css')));

// Simple promise-based queue for atomic writes
let dbQueue = Promise.resolve();

// Performance Optimization: Asynchronous DB reading
const readDB = async () => {
    try {
        if (!fs.existsSync(DB_FILE)) {
            return { users: [], courses: [], contacts: [] };
        }
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading DB:', error);
        // Robustness: Don't return empty data on read error to prevent accidental loss on subsequent write
        throw error;
    }
};

// Helper function to write to database
const writeDB = (data) => {
    dbQueue = dbQueue.then(() => {
        return fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8')
            .catch(err => console.error('Error writing DB:', err));
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
            id: Date.now(),
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

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses || []);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        const db = await readDB();

        const newContact = {
            id: Date.now(),
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

// Get stats for dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const db = await readDB();
        res.json({
            users: db.users.length,
            courses: db.courses ? db.courses.length : 0,
            contacts: db.contacts ? db.contacts.length : 0,
            profileViews: 1504
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
