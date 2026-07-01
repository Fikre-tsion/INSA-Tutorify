const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
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
const readDB = () => {
    let db = { users: [], courses: [], messages: [], stats: { views: 0 } };
    if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        try {
            db = { ...db, ...JSON.parse(data) };
        } catch (e) {
            console.error("Error parsing DB_FILE, using defaults");
        }
    }

    // Migration/Seeding
    let modified = false;
    if (!db.users || db.users.length === 0) {
        // Seed default admin
        const adminPassword = bcrypt.hashSync('password123', 10);
        db.users = [{
            id: 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: adminPassword,
            role: 'admin'
        }];
        modified = true;
    }
    if (!db.courses || db.courses.length === 0) {
        db.courses = [
            { id: 1, title: 'Responsive Social Media UI', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
            { id: 2, title: 'Responsive SmartHome Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
            { id: 3, title: 'Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
            { id: 4, title: 'Digital Marketing Fundamentals', description: 'Learn the fundamentals of Digital Marketing, including SEO and social media.', image: './digitalmarketing.png' }
        ];
        modified = true;
    }
    if (!db.messages) { db.messages = []; modified = true; }
    if (!db.stats) { db.stats = { views: 0 }; modified = true; }

    if (modified) writeDB(db);
    return db;
};

// Helper function to write to database
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Middleware for admin check
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Require Admin Role' });
    }
};

// Auth Endpoints
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const db = readDB();

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
    writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = readDB();

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

// Course Endpoints
app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses);
});

// Contact Endpoint
app.post('/api/contact', (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = readDB();

    const newMessage = {
        id: Date.now(),
        name: `${firstName} ${lastName}`,
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    writeDB(db);

    res.status(201).json({ message: 'Message received successfully' });
});

// Stats Endpoints
app.post('/api/stats/view', (req, res) => {
    const db = readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    writeDB(db);
    res.json({ views: db.stats.views });
});

app.get('/api/stats', authenticateToken, isAdmin, (req, res) => {
    const db = readDB();
    const stats = {
        views: db.stats.views,
        courseCount: db.courses.length,
        messageCount: db.messages.length,
        userCount: db.users.length,
        messages: db.messages.slice(-5).reverse(), // Last 5 messages
        users: db.users.slice(-5).reverse() // Last 5 users
    };
    res.json(stats);
});

app.listen(PORT, () => {
    readDB(); // Initialize/Migrate DB
    console.log(`Server is running on http://localhost:${PORT}`);
});
