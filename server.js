const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (console.error('JWT_SECRET is required in production'), process.exit(1)) : 'dev_secret');
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;

const readDB = async () => {
    try {
        if (dbCache) return dbCache;
        let db = { users: [], courses: [], messages: [], stats: { views: 0 } };
        try {
            const data = await fs.readFile(DB_FILE, 'utf8');
            db = JSON.parse(data);
        } catch (err) {
            // File doesn't exist or is invalid, will use default and write it
        }

        // Migration/Seeding
        let changed = false;
        if (!db.users) { db.users = []; changed = true; }
        if (!db.courses) { db.courses = []; changed = true; }
        if (!db.messages) { db.messages = []; changed = true; }
        if (!db.stats) { db.stats = { views: 0 }; changed = true; }

        // Seed Admin
        if (!db.users.find(u => u.email === 'admin@tutorify.com')) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            db.users.push({
                id: Date.now(),
                name: 'Admin User',
                email: 'admin@tutorify.com',
                password: hashedPassword,
                role: 'admin'
            });
            changed = true;
        }

        // Seed Courses if empty
        if (db.courses.length === 0) {
            const courses = [
                { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
                { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
                { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
                { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
                { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset and effective communication.', image: './images/course5.jpg' },
                { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
                { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO and social media marketing.', image: './images/digitalmarketing.png' },
                { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success.', image: './images/self.png' },
                { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
                { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design.', image: './images/course10.jpg' },
                { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing.', image: './images/course11.jpg' },
                { id: 12, title: 'Responsive Admin Dashboard UI Design V2', description: 'Advanced responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course12.jpg' },
                { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology and real-world applications.', image: './images/blockchain.png' },
                { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive and functional Contact Form design.', image: './images/course14.jpg' },
                { id: 15, title: 'Landing Page Design', description: 'Learn how to create a responsive Landing Page design using HTML and CSS.', image: './images/course15.jpg' },
                { id: 16, title: 'World Class Portfolio Website development', description: 'Learn how to create a world class Portfolio Website using HTML and CSS.', image: './images/course16.jpg' },
                { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to create a responsive Business manager dashboard UI design.', image: './images/course17.jpg' },
                { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Learn how to create a responsive Smart home Application UI design.', image: './images/course18.jpg' }
            ];
            db.courses = courses;
            changed = true;
        }

        if (changed) {
            await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
        }
        dbCache = db;
        return db;
    } catch (err) {
        console.error('Error reading DB:', err);
        return { users: [], courses: [], messages: [], stats: { views: 0 } };
    }
};

const writeDB = async (data) => {
    dbCache = data;
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Register
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
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
        role: 'user' // Hardcoded to user for security
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login
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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Stats view tracking
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

// Contact form
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();
    const newMessage = {
        id: Date.now(),
        name: `${firstName} ${lastName}`,
        email,
        message,
        date: new Date().toISOString()
    };
    db.messages.push(newMessage);
    await writeDB(db);
    res.json({ message: 'Message sent successfully' });
});

// Get Stats (Admin only)
app.get('/api/stats', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
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

// Courses API
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    await readDB(); // Initialize DB on startup
});
