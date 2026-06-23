const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Helper function to read database
const readDB = async () => {
    if (!fsSync.existsSync(DB_FILE)) {
        return { users: [], courses: [], messages: [], stats: { views: 0, courseCount: 0, messageCount: 0, userCount: 0 } };
    }
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
};

// Helper function to write to database
const writeDB = async (data) => {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
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
        role
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Get courses endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

// Post contact message endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();

    const newMessage = {
        id: db.messages.length + 1,
        firstName,
        lastName,
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    db.stats.messageCount = db.messages.length;
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Get stats endpoint (Admin only)
app.get('/api/stats', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const db = readDB();
        // Update user count before sending
        db.stats.userCount = db.users.length;
        res.json({
            ...db.stats,
            recentMessages: db.messages.slice(-5).reverse(),
            recentUsers: db.users.slice(-5).reverse()
        });
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
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
        // Fallback for initial placeholder users if needed, but we'll re-register them or just use hashed passwords
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
