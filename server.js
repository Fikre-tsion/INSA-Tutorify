const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Use a strong secret in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// SECURITY: Whitelist static assets to prevent exposing db.json or server.js
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images2', express.static(path.join(__dirname, 'images2')));

// Serve specific HTML files
const htmlFiles = [
    'index.html', 'about.html', 'courses.html', 'contact.html',
    'login.html', 'dashboard.html', 'privacy.html', 'refund.html', 'terms.html'
];
htmlFiles.forEach(file => {
    app.get(`/${file}`, (req, res) => res.sendFile(path.join(__dirname, file)));
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/main.js', (req, res) => res.sendFile(path.join(__dirname, 'main.js')));
app.get('/dashboard.js', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.js')));
app.get('/dashboard.css', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.css')));

// BOLT OPTIMIZATION: In-memory cache for db.json to reduce disk I/O
let dbCache = null;

const readDB = async () => {
    if (dbCache) return dbCache;
    try {
        let data;
        try {
            data = await fs.readFile(DB_FILE, 'utf8');
        } catch (err) {
            // Initialize DB if file doesn't exist
            const initialDB = {
                users: [],
                courses: [],
                messages: [],
                stats: { views: 0 }
            };
            await fs.writeFile(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf8');
            dbCache = initialDB;
            return dbCache;
        }
        dbCache = JSON.parse(data);
        return dbCache;
    } catch (err) {
        console.error("Error reading DB:", err);
        return { users: [], courses: [], messages: [], stats: { views: 0 } };
    }
};

const writeDB = async (data) => {
    dbCache = data;
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing DB:", err);
    }
};

// Middleware to verify JWT and Role
const authorize = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            req.user = decoded;
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };
};

// Endpoints
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats = db.stats || { views: 0 };
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.status(204).send();
});

app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!email || !message) return res.status(400).json({ message: 'Missing fields' });

    const db = await readDB();
    db.messages = db.messages || [];
    db.messages.push({
        id: Date.now(),
        name: `${firstName} ${lastName}`.trim(),
        email,
        message,
        date: new Date().toISOString()
    });
    await writeDB(db);
    res.status(201).json({ message: 'Message sent successfully' });
});

app.get('/api/stats', authorize(['admin']), async (req, res) => {
    const db = await readDB();
    res.json({
        views: db.stats?.views || 0,
        courseCount: (db.courses || []).length,
        messageCount: (db.messages || []).length,
        userCount: (db.users || []).length,
        messages: db.messages || [],
        users: db.users || []
    });
});

app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

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
});

app.post('/api/login', async (req, res) => {
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
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
