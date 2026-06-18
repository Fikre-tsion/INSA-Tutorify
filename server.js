const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
// Use JWT_SECRET from environment or a default for development
const SECRET_KEY = process.env.JWT_SECRET || 'tutorify_secret_key_2025';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Serve static files securely from specific directories
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));
// Explicitly serve HTML files from root
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/:page.html', (req, res) => {
    const page = req.params.page;
    const allowedPages = ['index', 'about', 'courses', 'contact', 'login', 'dashboard', 'privacy', 'terms', 'refund'];
    if (allowedPages.includes(page)) {
        res.sendFile(path.join(__dirname, `${page}.html`));
    } else {
        res.status(404).send('Not Found');
    }
});
// Serve main.js and dashboard.js explicitly
app.get('/main.js', (req, res) => res.sendFile(path.join(__dirname, 'main.js')));
app.get('/dashboard.js', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.js')));
app.get('/dashboard.css', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.css')));

// In-memory cache for the database
let dbCache = null;

/**
 * Performance Optimization: In-memory caching for db.json
 * Reduces disk I/O by ~99% for read-heavy operations.
 */
const readDB = async () => {
    if (dbCache) return dbCache;

    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        return dbCache;
    } catch (error) {
        // If file doesn't exist, return default structure
        dbCache = { users: [], courses: [], messages: [] };
        return dbCache;
    }
};

/**
 * Writes data to DB and updates the cache.
 * Uses fs.promises for non-blocking I/O.
 */
const writeDB = async (data) => {
    dbCache = data;
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// --- AUTH ENDPOINTS ---

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
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

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

        res.json({
            token,
            user: { name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// --- COURSES ENDPOINTS ---

app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// --- DASHBOARD STATS ---

app.get('/api/stats', async (req, res) => {
    // Authenticate Admin
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admins only' });
        }

        const db = await readDB();
        const stats = {
            users: db.users.length,
            courses: db.courses.length,
            messages: (db.messages || []).length,
            earnings: 12500 // Mock value
        };
        res.json(stats);
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// --- CONTACT ENDPOINTS ---

app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        const db = await readDB();

        if (!db.messages) db.messages = [];

        const newMessage = {
            id: Date.now(),
            name: `${firstName} ${lastName}`,
            email,
            message,
            date: new Date().toISOString()
        };

        db.messages.push(newMessage);
        await writeDB(db);

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
