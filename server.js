const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const existsSync = require('fs').existsSync;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret_key';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Helper function to read database
const readDB = async () => {
    if (!existsSync(DB_FILE)) {
        const initialDB = {
            users: [],
            courses: [
                { id: 1, title: "Responsive Social Media Website UI Design", description: "Learn how to create a responsive social media website UI design using HTML and CSS.", image: "./images/course1.jpg" },
                { id: 2, title: "Responsive SmartHome Website Design", description: "Learn how to create a responsive SmartHome website design using HTML and CSS.", image: "./images/course2.jpg" },
                { id: 3, title: "Responsive Admin Dashboard UI Design", description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.", image: "./images/course3.jpg" },
                { id: 4, title: "Fundamentals of Digital Marketing", description: "Learn the fundamentals of Digital Marketing, including SEO, social media marketing, and more.", image: "./images/digitalmarketing.png" },
                { id: 5, title: "Introduction to Blockchain Technology", description: "Learn the fundamentals of Blockchain Technology, including its architecture and applications.", image: "./images/blockchain.png" }
            ],
            messages: [],
            stats: { views: 0 }
        };
        await fs.writeFile(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf8');
        return initialDB;
    }
    const data = await fs.readFile(DB_FILE, 'utf8');
    const db = JSON.parse(data);

    // Migration/Ensure fields
    let updated = false;
    if (!db.courses) { db.courses = []; updated = true; }
    if (!db.messages) { db.messages = []; updated = true; }
    if (!db.stats) { db.stats = { views: 0 }; updated = true; }

    if (updated) {
        await writeDB(db);
    }

    return db;
};

// Helper function to write to database
const writeDB = async (data) => {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });

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
    if (!email || !password) return res.status(400).json({ message: 'Missing required fields' });

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
});

// Get all courses
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

// Get stats (admin only)
app.get('/api/stats', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

        const db = await readDB();
        res.json({
            views: db.stats.views,
            courseCount: db.courses.length,
            messageCount: db.messages.length,
            userCount: db.users.length,
            messages: db.messages,
            users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
        });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) return res.status(400).json({ message: 'Missing required fields' });

    const db = await readDB();
    const newMessage = {
        id: Date.now(),
        name: `${firstName} ${lastName || ''}`.trim(),
        email,
        message,
        date: new Date().toISOString()
    };
    db.messages.push(newMessage);
    await writeDB(db);
    res.status(201).json({ message: 'Message received successfully' });
});

// Record page view
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
