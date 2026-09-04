const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token missing' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Middleware for Admin role verification
const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin access required' });
        }
    });
};

// Seed default initial database state if empty or missing collections
const seedDatabase = (db) => {
    let modified = false;

    if (!db.users) {
        db.users = [];
        modified = true;
    }

    if (!db.users.find(u => u.email === 'admin@tutorify.com')) {
        const adminPasswordHash = bcrypt.hashSync('password123', 10);
        db.users.push({
            id: db.users.length + 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: adminPasswordHash,
            role: 'admin'
        });
        modified = true;
    }

    if (!db.courses || db.courses.length === 0) {
        db.courses = [
            {
                id: 1,
                title: "Responsive Social Media Website UI Design",
                description: "Learn how to create a responsive social media website UI design using HTML and CSS.",
                image: "./images/course1.jpg",
                category: "Web Development"
            },
            {
                id: 2,
                title: "Responsive SmartHome Website Design",
                description: "Learn how to create a responsive SmartHome website design using HTML and CSS.",
                image: "./images/course2.jpg",
                category: "Web Development"
            },
            {
                id: 3,
                title: "Responsive Admin Dashboard UI Design",
                description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.",
                image: "./images/course3.jpg",
                category: "Web Development"
            }
        ];
        modified = true;
    }

    if (!db.messages) {
        db.messages = [
            {
                id: 1,
                firstName: "Haile",
                lastName: "Abebe",
                email: "haile@example.com",
                message: "Interested in taking the Web Development course.",
                createdAt: new Date().toISOString()
            }
        ];
        modified = true;
    }

    if (!db.stats) {
        db.stats = {
            profileViews: 1504,
            tutorialsCount: 80,
            commentsCount: 284,
            earnings: 7842,
            recentTutors: [
                { name: "Haile", course: "Mathematics", payment: "ETB 450/hr", status: "Delivered", statusClass: "delivered" },
                { name: "Fikre", course: "Physics", payment: "ETB 500/hr", status: "Pending", statusClass: "pending" },
                { name: "Tsion", course: "Chemistry", payment: "ETB 400/hr", status: "Return", statusClass: "return" },
                { name: "Abebe", course: "Biology", payment: "ETB 350/hr", status: "In Progress", statusClass: "inprogress" },
                { name: "Almaz", course: "English", payment: "ETB 300/hr", status: "Delivered", statusClass: "delivered" },
                { name: "Samson", course: "History", payment: "ETB 250/hr", status: "Pending", statusClass: "pending" },
                { name: "Mengistu", course: "Geography", payment: "ETB 200/hr", status: "In Progress", statusClass: "inprogress" }
            ],
            recentCustomers: [
                { name: "Gebre", grade: "Grade 12", avatar: "./images2/2.jpg" },
                { name: "Selam", grade: "Grade 11", avatar: "./images2/1.jpg" },
                { name: "Yonas", grade: "Grade 10", avatar: "./images2/4.jpg" },
                { name: "Meron", grade: "Grade 9", avatar: "./images2/student.png" },
                { name: "Daniel", grade: "Grade 12", avatar: "./images2/5.jpg" }
            ]
        };
        modified = true;
    }

    return modified;
};

// Helper function to read database
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        const initialDB = { users: [], courses: [], messages: [], stats: {} };
        seedDatabase(initialDB);
        writeDB(initialDB);
        return initialDB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    let db;
    try {
        db = JSON.parse(data);
    } catch (e) {
        db = { users: [], courses: [], messages: [], stats: {} };
    }
    if (seedDatabase(db)) {
        writeDB(db);
    }
    return db;
};

// Helper function to write to database
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Register endpoint
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

// Login endpoint
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

// Get all courses
app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses || []);
});

// Submit contact form message
app.post('/api/contact', (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const db = readDB();
    if (!db.messages) db.messages = [];

    const newMessage = {
        id: db.messages.length + 1,
        firstName,
        lastName: lastName || '',
        email,
        message,
        createdAt: new Date().toISOString()
    };

    db.messages.push(newMessage);
    if (db.stats) {
        db.stats.commentsCount = (db.stats.commentsCount || 0) + 1;
    }
    writeDB(db);

    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
});

// Admin dashboard statistics
app.get('/api/stats', authenticateAdmin, (req, res) => {
    const db = readDB();
    res.json({
        stats: db.stats || {},
        messages: db.messages || [],
        usersCount: db.users ? db.users.length : 0
    });
});

// Record profile view
app.post('/api/stats/view', (req, res) => {
    const db = readDB();
    if (db.stats) {
        db.stats.profileViews = (db.stats.profileViews || 0) + 1;
        writeDB(db);
    }
    res.json({ profileViews: db.stats ? db.stats.profileViews : 0 });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
