const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;
let writeQueue = Promise.resolve();

const initialCourses = [
    { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
    { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
    { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
    { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
    { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and effective communication.', image: './images/course5.jpg' },
    { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO, social media marketing, and content marketing.', image: './images/digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success, including mindset and effective communication.', image: './images/self.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
    { id: 11, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course12.jpg' },
    { id: 12, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles and typography.', image: './images/course11.jpg' },
    { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, including architecture and consensus mechanisms.', image: './images/blockchain.png' },
    { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML and CSS.', image: './images/course14.jpg' },
    { id: 15, title: 'Landing Page Design', description: 'Learn how to create a responsive Landing Page design using HTML and CSS.', image: './images/course15.jpg' },
    { id: 16, title: 'World Class Portfolio Website development', description: 'Learn how to create a world Class Portfolio Website using HTML and CSS.', image: './images/course16.jpg' },
    { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to create a responsive Business manager dashboard UI design using HTML and CSS.', image: './images/course17.jpg' },
    { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Learn how to create a responsive Smart home Application UI design using HTML and CSS.', image: './images/course18.jpg' }
];

// Asynchronous helper function to read database with caching and migration
async function readDB() {
    if (dbCache) {
        return dbCache;
    }
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
    } catch (err) {
        dbCache = { users: [], courses: [], messages: [], stats: { pageViews: 0, earnings: 7842 } };
    }

    // Migration logic
    if (!Array.isArray(dbCache.users)) dbCache.users = [];
    if (!Array.isArray(dbCache.courses)) dbCache.courses = [];
    if (!Array.isArray(dbCache.messages)) dbCache.messages = [];
    if (!dbCache.stats || typeof dbCache.stats !== 'object') {
        dbCache.stats = { pageViews: 0, earnings: 7842 };
    }

    return dbCache;
}

// Asynchronous helper function to write database using serialized queue
async function writeDB(data) {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(() => {});
    return writeQueue;
}

// Helper to seed initial admin and courses
async function seedDatabase() {
    const db = await readDB();
    let modified = false;

    // Seed default admin account if missing
    let admin = db.users.find(u => u.email === 'admin@tutorify.com');
    if (!admin) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        admin = {
            id: db.users.length + 1,
            name: 'Admin User',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        };
        db.users.push(admin);
        modified = true;
    }

    // Seed courses if missing or empty
    if (db.courses.length === 0) {
        db.courses = initialCourses;
        modified = true;
    }

    if (modified) {
        await writeDB(db);
    }
}

// Middleware for token authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Middleware for admin role verification
function authenticateAdmin(req, res, next) {
    authenticateToken(req, res, () => {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        next();
    });
}

// Register endpoint (hardcodes role to 'user' to prevent privilege escalation)
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

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
        role: 'user'
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = await readDB();
    const user = db.users.find(u => u.email === email && (role ? u.role === role : true));
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

    res.json({
        token,
        user: { name: user.name, email: user.email, role: user.role }
    });
});

// Courses API
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

app.post('/api/courses', authenticateAdmin, async (req, res) => {
    const { title, description, image } = req.body;
    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
    }
    const db = await readDB();
    const newCourse = {
        id: db.courses.length + 1,
        title,
        description,
        image: image || './images/digitalmarketing.png'
    };
    db.courses.push(newCourse);
    await writeDB(db);
    res.status(201).json(newCourse);
});

// Contact API
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'First name, email, and message are required' });
    }

    const db = await readDB();
    const newMessage = {
        id: db.messages.length + 1,
        firstName,
        lastName: lastName || '',
        email,
        message,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending'
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully', contact: newMessage });
});

app.get('/api/messages', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json(db.messages);
});

// Stats API: Record Page View
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.pageViews = (db.stats.pageViews || 0) + 1;
    await writeDB(db);
    res.json({ success: true, pageViews: db.stats.pageViews });
});

// Stats API: Get platform analytics for admin dashboard
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDB();
    res.json({
        pageViews: db.stats.pageViews || 0,
        tutorialsCount: db.courses.length || 0,
        messagesCount: db.messages.length || 0,
        earnings: db.stats.earnings || 7842,
        messages: db.messages || [],
        users: db.users || []
    });
});

if (require.main === module) {
    app.listen(PORT, async () => {
        await seedDatabase();
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = { app, readDB, writeDB, seedDatabase };
