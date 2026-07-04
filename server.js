const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY && process.env.NODE_ENV === 'production') {
    console.error("FATAL: JWT_SECRET environment variable is required in production.");
    process.exit(1);
}
const JWT_SECRET = SECRET_KEY || 'dev_secret';

const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;

// Helper function to read database with caching
const readDB = () => {
    if (dbCache) return dbCache;

    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            users: [],
            courses: [],
            messages: [],
            stats: { views: 0 }
        };
        writeDB(initialData);
        return initialData;
    }

    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);

        // Migration/Seeding
        let updated = false;
        if (!dbCache.courses) { dbCache.courses = []; updated = true; }
        if (!dbCache.messages) { dbCache.messages = []; updated = true; }
        if (!dbCache.stats) { dbCache.stats = { views: 0 }; updated = true; }

        // Seed admin if missing
        if (!dbCache.users.find(u => u.role === 'admin')) {
            const hashedPassword = bcrypt.hashSync('password123', 10);
            dbCache.users.push({
                id: Date.now(),
                name: 'Admin User',
                email: 'admin@tutorify.com',
                password: hashedPassword,
                role: 'admin'
            });
            updated = true;
        }

        // Seed courses if empty
        if (dbCache.courses.length === 0) {
            dbCache.courses = [
                { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
                { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
                { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
                { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
                { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset and goal setting.', image: './images/course5.jpg' },
                { id: 6, title: 'Responsive social Media UI design', description: 'Master layout techniques and styling for building user-friendly interfaces.', image: './images/course6.jpg' },
                { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn SEO, social media marketing, email marketing, and content marketing.', image: './images/digitalmarketing.png' },
                { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success mindset.', image: './images/self.png' },
                { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
                { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
                { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including color theory.', image: './images/course11.jpg' },
                { id: 12, title: 'Advanced Responsive Admin Dashboard', description: 'Deep dive into complex layout techniques for admin panels.', image: './images/course12.jpg' },
                { id: 13, title: 'Introduction to Blockchain Technology', description: 'Understand architecture, consensus mechanisms, and real-world applications.', image: './images/blockchain.png' },
                { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create responsive and accessible forms.', image: './images/course14.jpg' },
                { id: 15, title: 'Landing Page Design', description: 'Create high-converting landing pages with modern CSS techniques.', image: './images/course15.jpg' },
                { id: 16, title: 'World Class Portfolio Website development', description: 'Showcase your work with a professional and responsive portfolio.', image: './images/course16.jpg' },
                { id: 17, title: 'Business manager dashboard UI Design', description: 'Design complex data visualization dashboards for businesses.', image: './images/course17.jpg' },
                { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Mobile-first design approach for smart home applications.', image: './images/course18.jpg' }
            ];
            updated = true;
        }

        if (updated) writeDB(dbCache);
        return dbCache;
    } catch (err) {
        console.error("Error reading DB:", err);
        return { users: [], courses: [], messages: [], stats: { views: 0 } };
    }
};

// Helper function to write to database
const writeDB = (data) => {
    dbCache = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    let { role } = req.body;
    const db = readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Security: Hardcode role to 'user' for public registration
    role = 'user';

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: Date.now(),
        name,
        email,
        password: hashedPassword,
        role
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
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Course endpoints
app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses);
});

// Contact endpoint
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

// Stats endpoints
app.post('/api/stats/view', (req, res) => {
    const db = readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    writeDB(db);
    res.sendStatus(204);
});

app.get('/api/stats', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    const db = readDB();
    res.json({
        views: db.stats.views,
        courseCount: db.courses.length,
        messageCount: db.messages.length,
        userCount: db.users.length,
        messages: db.messages.slice(-5).reverse(),
        users: db.users.slice(-5).reverse()
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    readDB(); // Initialize DB on startup
});
