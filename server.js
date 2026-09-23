const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'tutorify_default_secure_jwt_secret_key_2025_prod_fallback';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;
let writeQueue = Promise.resolve();

// Helper function to read database asynchronously with caching
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }

    let db = { users: [], courses: [], messages: [], stats: { views: 0 } };
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = await fs.promises.readFile(DB_FILE, 'utf8');
            db = { ...db, ...JSON.parse(data) };
        }
    } catch (e) {
        console.error("Error reading DB_FILE, using defaults", e);
    }

    let modified = false;

    if (!db.users || !Array.isArray(db.users)) {
        db.users = [];
        modified = true;
    }

    if (!db.users.find(u => u.role === 'admin')) {
        const adminPassword = await bcrypt.hash('password123', 10);
        db.users.push({
            id: db.users.length + 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: adminPassword,
            role: 'admin'
        });
        modified = true;
    }

    if (!db.courses || !Array.isArray(db.courses) || db.courses.length === 0) {
        db.courses = [
            { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
            { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
            { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
            { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
            { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and communication.', image: './images/course5.jpg' },
            { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
            { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO, social media, and email marketing.', image: './digitalmarketing.png' },
            { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success, including mindset and effective communication.', image: './images/self.png' },
            { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
            { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
            { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles and typography.', image: './images/course11.jpg' },
            { id: 12, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course12.jpg' },
            { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, including architecture and consensus mechanisms.', image: './images/blockchain.png' },
            { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML and CSS.', image: './images/course14.jpg' },
            { id: 15, title: 'Landing Page Design', description: 'Learn how to create a responsive Landing Page design using HTML and CSS.', image: './images/course15.jpg' },
            { id: 16, title: 'World Class Portfolio Website development', description: 'Learn how to create a world Class Portfolio Website using HTML and CSS.', image: './images/course16.jpg' },
            { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to create a responsive Business manager dashboard UI design using HTML and CSS.', image: './images/course17.jpg' },
            { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Learn how to create a responsive Smart home Application UI design using HTML and CSS.', image: './images/course18.jpg' }
        ];
        modified = true;
    }

    if (!db.messages || !Array.isArray(db.messages)) {
        db.messages = [];
        modified = true;
    }

    if (!db.stats || typeof db.stats !== 'object') {
        db.stats = { views: 0 };
        modified = true;
    }

    dbCache = db;
    if (modified) {
        await writeDB(db);
    }
    return dbCache;
};

// Helper function to write to database asynchronously with queueing
const writeDB = async (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch((err) => {
        console.error("Error writing to DB_FILE:", err);
    });
    return writeQueue;
};

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access token required' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Middleware for admin role validation
const authenticateAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Require Admin Role' });
    }
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = await readDB();

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password: hashedPassword,
        role: 'user' // Security policy: hardcode role to 'user' for registration
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = await readDB();

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
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

// Course Endpoints
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

// Contact Endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

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

// Stats Endpoints
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

app.get('/api/stats', authenticateToken, authenticateAdmin, async (req, res) => {
    const db = await readDB();
    const stats = {
        views: db.stats.views || 0,
        courseCount: db.courses.length,
        messageCount: db.messages.length,
        userCount: db.users.length,
        messages: db.messages.slice(-5).reverse(),
        users: db.users.slice(-5).reverse()
    };
    res.json(stats);
});

app.listen(PORT, async () => {
    await readDB(); // Ensure DB initialization and seeding on startup
    console.log(`Server is running on http://localhost:${PORT}`);
});
