const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable is not set');
    process.exit(1);
}

const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Security: Whitelist serving of root files and assets to prevent exposure of db.json and server.js
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images2', express.static(path.join(__dirname, 'images2')));

const publicFiles = [
    'index.html', 'about.html', 'courses.html', 'contact.html',
    'login.html', 'dashboard.html', 'privacy.html', 'refund.html',
    'terms.html', 'main.js', 'dashboard.js', 'digitalmarketing.png'
];

publicFiles.forEach(file => {
    app.get(`/${file}`, (req, res) => {
        res.sendFile(path.join(__dirname, file));
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Performance: Using asynchronous I/O with fs.promises to prevent blocking the event loop
let dbQueue = Promise.resolve();

const readDB = async () => {
    try {
        if (!existsSync(DB_FILE)) {
            return { users: [], courses: [], contacts: [] };
        }
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading DB:', error);
        return { users: [], courses: [], contacts: [] };
    }
};

const writeDB = async (data) => {
    dbQueue = dbQueue.then(async () => {
        try {
            await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('Error writing DB:', error);
        }
    });
    return dbQueue;
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
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
            role: 'user' // Security: Force 'user' role for all public registrations
        };

        db.users.push(newUser);
        await writeDB(db);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration' });
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
        res.status(500).json({ message: 'Server error during login' });
    }
});

// GET Courses
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses || []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

// POST Contact
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        const db = await readDB();
        if (!db.contacts) db.contacts = [];

        const newContact = {
            id: db.contacts.length + 1,
            firstName,
            lastName,
            email,
            message,
            date: new Date().toISOString()
        };

        db.contacts.push(newContact);
        await writeDB(db);

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending message' });
    }
});

// GET Stats for Dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const db = await readDB();
        const stats = {
            users: db.users.length,
            courses: db.courses ? db.courses.length : 0,
            contacts: db.contacts ? db.contacts.length : 0,
            recentTutors: [
                { name: 'Haile', course: 'Mathematics', payment: 'ETB 450/hr', status: 'delivered' },
                { name: 'Fikre', course: 'Physics', payment: 'ETB 500/hr', status: 'pending' },
                { name: 'Tsion', course: 'Chemistry', payment: 'ETB 400/hr', status: 'return' }
            ]
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
