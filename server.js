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

// BOLT OPTIMIZATION: In-memory cache for db.json
let dbCache = null;

const readDB = async () => {
    if (dbCache) return dbCache;
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        return dbCache;
    } catch (error) {
        console.error('Error reading DB:', error);
        return { users: [], courses: [], contacts: [] };
    }
};

// BOLT OPTIMIZATION: Simple promise-based queue for atomic writes
let dbQueue = Promise.resolve();
const writeDB = async (data) => {
    dbCache = data;
    dbQueue = dbQueue.then(async () => {
        try {
            await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('Error writing DB:', error);
        }
    });
    return dbQueue;
};

// BOLT SECURITY: Serve only allowed directories and files statically
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images2', express.static(path.join(__dirname, 'images2')));

// Explicitly serve necessary frontend JS files
app.get('/main.js', (req, res) => res.sendFile(path.join(__dirname, 'main.js')));
app.get('/dashboard.js', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.js')));
app.get('/dashboard.css', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.css')));

// Explicitly serve HTML files to avoid directory listing or accidental file exposure
const htmlFiles = ['about', 'contact', 'courses', 'dashboard', 'index', 'login', 'privacy', 'refund', 'terms'];
htmlFiles.forEach(file => {
    app.get(`/${file}.html`, (req, res) => res.sendFile(path.join(__dirname, `${file}.html`)));
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// API Endpoints
app.post('/api/register', async (req, res) => {
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
});

app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = await readDB();

    const user = db.users.find(u => u.email === email && (role ? u.role === role : true));
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or role' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();

    if (!db.contacts) db.contacts = [];

    const newContact = {
        id: Date.now(),
        firstName,
        lastName,
        email,
        message,
        date: new Date().toISOString()
    };

    db.contacts.push(newContact);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

app.get('/api/stats', async (req, res) => {
    const db = await readDB();
    res.json({
        users: (db.users || []).length,
        courses: (db.courses || []).length,
        contacts: (db.contacts || []).length
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
