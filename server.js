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
if (!SECRET_KEY && process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Whitelist static files to prevent exposing server.js or db.json
const whiteList = ['/index.html', '/about.html', '/courses.html', '/contact.html', '/login.html', '/dashboard.html', '/dashboard.css', '/main.js', '/dashboard.js', '/digitalmarketing.png'];
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images2', express.static(path.join(__dirname, 'images2')));
whiteList.forEach(file => {
    app.get(file, (req, res) => res.sendFile(path.join(__dirname, file)));
});

let dbCache = null;

// Helper function to read database with in-memory caching
const readDB = async () => {
    if (dbCache) return dbCache;
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        return dbCache;
    } catch (error) {
        const initialDB = {
            users: [],
            courses: [
                { id: 1, title: 'Responsive Social Media UI', category: 'Programming', image: './images/course1.jpg' },
                { id: 2, title: 'SmartHome Website Design', category: 'Design', image: './images/course2.jpg' },
                { id: 3, title: 'Admin Dashboard UI Design', category: 'Programming', image: './images/course3.jpg' }
            ],
            messages: [],
            stats: { views: 1504, tutorials: 80, comments: 284, earnings: 7842 }
        };
        await fs.writeFile(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf8');
        dbCache = initialDB;
        return dbCache;
    }
};

// Helper function to write to database
const writeDB = async (data) => {
    dbCache = data;
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY || 'dev_secret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
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
});

// Login endpoint
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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY || 'dev_secret', { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Courses endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

// Stats endpoint (Protected)
app.get('/api/stats', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const db = await readDB();
    res.json(db.stats);
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();
    const newMessage = { id: Date.now(), firstName, lastName, email, message, date: new Date() };
    db.messages.push(newMessage);
    await writeDB(db);
    res.status(201).json({ message: 'Message sent successfully' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
