const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Whitelist for static files
const publicDirs = ['CSS', 'images', 'images2'];
publicDirs.forEach(dir => {
    app.use(`/${dir}`, express.static(path.join(__dirname, dir)));
});

// Explicitly serve HTML and JS files
const rootFiles = [
    'index.html', 'about.html', 'courses.html', 'contact.html',
    'login.html', 'dashboard.html', 'privacy.html', 'refund.html',
    'terms.html', 'main.js', 'dashboard.js', 'dashboard.css',
    'digitalmarketing.png'
];

rootFiles.forEach(file => {
    app.get(`/${file}`, (req, res) => {
        res.sendFile(path.join(__dirname, file));
    });
});

// Root redirect
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// DB Write Queue
let dbPromise = Promise.resolve();
const dbQueue = (task) => {
    dbPromise = dbPromise.then(() => task().catch(err => console.error("DB Queue Error:", err)));
    return dbPromise;
};

const readDB = async () => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: [], courses: [], contacts: [] };
    }
};

const writeDB = async (data) => {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token missing' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

// Auth API
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    await dbQueue(async () => {
        const db = await readDB();
        if (db.users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: Date.now(), name, email, password: hashedPassword, role: role || 'user' };
        db.users.push(newUser);
        await writeDB(db);
        res.status(201).json({ message: 'User registered successfully' });
    });
});

app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = await readDB();
    const user = db.users.find(u => u.email === email && u.role === role);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Courses API
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Contact API
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    await dbQueue(async () => {
        const db = await readDB();
        const newContact = {
            id: Date.now(),
            firstName,
            lastName,
            email,
            message,
            date: new Date().toISOString()
        };
        db.contacts = db.contacts || [];
        db.contacts.push(newContact);
        await writeDB(db);
        res.status(201).json({ message: 'Message sent successfully' });
    });
});

// Admin API
app.get('/api/stats', authenticateToken, isAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        users: db.users.length,
        courses: (db.courses || []).length,
        contacts: (db.contacts || []).length
    });
});

app.get('/api/admin/contacts', authenticateToken, isAdmin, async (req, res) => {
    const db = await readDB();
    res.json(db.contacts || []);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
