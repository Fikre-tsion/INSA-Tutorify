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

let writeQueue = Promise.resolve();

const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and communication.', image: './images/course5.jpg' },
    { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn SEO, social media marketing, email marketing, and content marketing.', image: './digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success, including mindset and goal setting.', image: './images/self.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
    { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including color theory and typography.', image: './images/course11.jpg' },
    { id: 12, title: 'Advanced Admin Dashboard UI Design', description: 'Master layout techniques and styling for complex admin dashboards using modern CSS.', image: './images/course12.jpg' },
    { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, architecture, and smart contracts.', image: './images/blockchain.png' },
    { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive, validated Contact Form design with backend integration.', image: './images/course14.jpg' },
    { id: 15, title: 'Landing Page Design', description: 'Learn how to create a high-converting responsive Landing Page design.', image: './images/course15.jpg' },
    { id: 16, title: 'World Class Portfolio Website development', description: 'Learn how to build a world-class portfolio website using modern web technologies.', image: './images/course16.jpg' },
    { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to build a business manager dashboard UI with clean analytics displays.', image: './images/course17.jpg' },
    { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Learn how to create a sleek smart home mobile app UI prototype.', image: './images/course18.jpg' }
];

// Read DB function with auto-migration and seeding
const readDB = () => {
    let db = { users: [], courses: [], messages: [], stats: { pageViews: 0 } };
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            db = JSON.parse(data);
        } catch (err) {
            console.error('Error reading db.json:', err);
        }
    }

    if (!db.users) db.users = [];
    if (!db.courses) db.courses = [];
    if (!db.messages) db.messages = [];
    if (!db.stats) db.stats = { pageViews: 0 };

    let changed = false;

    // Seed admin if missing
    if (!db.users.find(u => u.role === 'admin')) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.users.push({
            id: db.users.length + 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
        changed = true;
    }

    // Seed courses if missing
    if (db.courses.length === 0) {
        db.courses = initialCourses;
        changed = true;
    }

    if (changed) {
        try {
            fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
        } catch (e) {
            console.error('Error writing seeded db:', e);
        }
    }

    return db;
};

// Write DB function using serialized queue
const writeDB = (data) => {
    writeQueue = writeQueue.then(async () => {
        try {
            await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error('Error writing to DB_FILE:', err);
        }
    }).catch(err => console.error('Write queue error:', err));
    return writeQueue;
};

// Middleware: Authenticate Token
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

// Middleware: Authenticate Admin
const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin access required' });
        }
    });
};

// Register endpoint - Hardcodes 'user' role for security
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

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
        role: 'user' // Strictly hardcoded to prevent privilege escalation
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.email === email && (!role || u.role === role));
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

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// GET /api/courses
app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses);
});

// POST /api/courses (Admin only)
app.post('/api/courses', authenticateAdmin, async (req, res) => {
    const { title, description, image } = req.body;
    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
    }

    const db = readDB();
    const newCourse = {
        id: db.courses.length + 1,
        title,
        description,
        image: image || './digitalmarketing.png'
    };

    db.courses.push(newCourse);
    await writeDB(db);

    res.status(201).json({ message: 'Course created successfully', course: newCourse });
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'First name, email, and message are required' });
    }

    const db = readDB();
    const newMessage = {
        id: db.messages.length + 1,
        firstName,
        lastName: lastName || '',
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// GET /api/stats (Admin only)
app.get('/api/stats', authenticateAdmin, (req, res) => {
    const db = readDB();
    res.json({
        pageViews: db.stats.pageViews || 0,
        totalCourses: db.courses.length,
        totalUsers: db.users.length,
        totalMessages: db.messages.length,
        recentMessages: db.messages.slice(-5).reverse(),
        recentUsers: db.users.slice(-5).reverse().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
});

// POST /api/stats/view
app.post('/api/stats/view', async (req, res) => {
    const db = readDB();
    if (!db.stats) db.stats = { pageViews: 0 };
    db.stats.pageViews = (db.stats.pageViews || 0) + 1;
    await writeDB(db);
    res.json({ pageViews: db.stats.pageViews });
});

app.listen(PORT, () => {
    readDB();
    console.log(`Server running on http://localhost:${PORT}`);
});
