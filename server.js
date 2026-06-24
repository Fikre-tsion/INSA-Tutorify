const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Serve static assets safely
app.use('/CSS', express.static(path.join(__dirname, 'CSS')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images2', express.static(path.join(__dirname, 'images2')));

// Serve HTML files
const htmlFiles = ['index.html', 'about.html', 'courses.html', 'contact.html', 'login.html', 'dashboard.html', 'privacy.html', 'refund.html', 'terms.html'];
htmlFiles.forEach(file => {
    app.get(`/${file}`, (req, res) => res.sendFile(path.join(__dirname, file)));
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// In-memory cache for database
let dbCache = null;

// Helper function to read database with caching
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        return dbCache;
    } catch (err) {
        // Default structure if file doesn't exist
        dbCache = { users: [], courses: [], messages: [], stats: { views: 0, courseCount: 0, messageCount: 0, userCount: 0 } };
        return dbCache;
    }
};

// Helper function to write to database and update cache
const writeDB = async (data) => {
    dbCache = data;
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
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
        db.stats.userCount = db.users.length;
        await writeDB(db);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
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
            { expiresIn: '2h' }
        );
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Middleware to verify JWT and Role
const authorize = (role) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'No token provided' });

        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) return res.status(401).json({ message: 'Unauthorized' });
            if (role && decoded.role !== role) return res.status(403).json({ message: 'Forbidden' });
            req.user = decoded;
            next();
        });
    };
};

// Courses endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Public stats endpoint for view increment
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views += 1;
    await writeDB(db);
    res.sendStatus(204);
});

// Stats endpoint (Admin only)
app.get('/api/stats', authorize('admin'), async (req, res) => {
    const db = await readDB();
    res.json({
        ...db.stats,
        messages: db.messages || [],
        users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        const db = await readDB();

        const newMessage = {
            id: (db.messages || []).length + 1,
            name: `${firstName} ${lastName}`,
            email,
            message,
            date: new Date().toISOString(),
            status: 'Pending'
        };

        if (!db.messages) db.messages = [];
        db.messages.push(newMessage);
        db.stats.messageCount = db.messages.length;

        await writeDB(db);
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send message' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
