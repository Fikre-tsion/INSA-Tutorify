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
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';
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
    { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO, social media marketing, and email marketing.', image: './images/digitalmarketing.png' },
    { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success, including mindset and effective communication.', image: './images/self.png' },
    { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
    { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
    { id: 11, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course12.jpg' },
    { id: 12, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles and typography.', image: './images/course11.jpg' },
    { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, including architecture and smart contracts.', image: './images/blockchain.png' },
    { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML and CSS.', image: './images/course14.jpg' },
    { id: 15, title: 'Landing Page Design', description: 'Learn how to create a responsive Landing Page design using HTML and CSS.', image: './images/course15.jpg' },
    { id: 16, title: 'World Class Portfolio Website development', description: 'Learn how to create a world class portfolio website using HTML and CSS.', image: './images/course16.jpg' },
    { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to create a responsive Business manager dashboard UI design using HTML and CSS.', image: './images/course17.jpg' },
    { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Learn how to create a responsive Smart home Application UI design using HTML and CSS.', image: './images/course18.jpg' }
];

// Helper function to read database with caching and migration
const readDB = async () => {
    if (dbCache) return dbCache;

    let db = { users: [], courses: [], messages: [], stats: { views: 0 } };
    try {
        if (fsSync.existsSync(DB_FILE)) {
            const data = await fs.readFile(DB_FILE, 'utf8');
            db = JSON.parse(data);
        }
    } catch (err) {
        console.error('Error reading db.json:', err);
    }

    if (!Array.isArray(db.users)) db.users = [];
    if (!Array.isArray(db.courses)) db.courses = [];
    if (!Array.isArray(db.messages)) db.messages = [];
    if (!db.stats || typeof db.stats.views !== 'number') db.stats = { views: 0 };

    // Seed default admin user if missing
    let admin = db.users.find(u => u.role === 'admin');
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
    }

    // Seed initial courses if missing
    if (db.courses.length === 0) {
        db.courses = initialCourses;
    }

    dbCache = db;
    await writeDB(db);
    return dbCache;
};

// Helper function to write to database with queuing
const writeDB = async (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch((err) => {
        console.error('Error in writeDB queue:', err);
    });
    return writeQueue;
};

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token required' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin access required' });
        }
    });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const db = await readDB();
        if (db.users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Security policy: Hardcode 'user' role for self-registration to prevent privilege escalation
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
    } catch (err) {
        res.status(500).json({ message: 'Server error during registration' });
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
            { expiresIn: '24h' }
        );
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Courses API
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving courses' });
    }
});

app.post('/api/courses', authenticateAdmin, async (req, res) => {
    try {
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

        res.status(201).json({ message: 'Course added successfully', course: newCourse });
    } catch (err) {
        res.status(500).json({ message: 'Error adding course' });
    }
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }

        const db = await readDB();
        const newMessage = {
            id: db.messages.length + 1,
            sender: `${firstName || ''} ${lastName || ''}`.trim() || 'Anonymous',
            email,
            message,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending'
        };

        db.messages.push(newMessage);
        await writeDB(db);

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error sending message' });
    }
});

// Page view stats endpoint
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        db.stats.views = (db.stats.views || 0) + 1;
        await writeDB(db);
        res.json({ views: db.stats.views });
    } catch (err) {
        res.status(500).json({ message: 'Error recording page view' });
    }
});

// Admin stats endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await readDB();
        const recentTutors = [
            { tutor: 'Haile', course: 'Mathematics', payment: 'ETB 450/hr', status: 'Delivered' },
            { tutor: 'Fikre', course: 'Physics', payment: 'ETB 500/hr', status: 'Pending' },
            { tutor: 'Tsion', course: 'Chemistry', payment: 'ETB 400/hr', status: 'Return' },
            { tutor: 'Abebe', course: 'Biology', payment: 'ETB 350/hr', status: 'In Progress' },
            { tutor: 'Almaz', course: 'English', payment: 'ETB 300/hr', status: 'Delivered' }
        ];

        const recentCustomers = [
            { name: 'Gebre', grade: 'Grade 12', avatar: './images/digitalmarketing.png' },
            { name: 'Selam', grade: 'Grade 11', avatar: './images/digitalmarketing.png' },
            { name: 'Yonas', grade: 'Grade 10', avatar: './images/digitalmarketing.png' },
            { name: 'Meron', grade: 'Grade 9', avatar: './images/digitalmarketing.png' }
        ];

        res.json({
            views: db.stats.views || 0,
            tutorsCount: 80,
            coursesCount: db.courses.length,
            messagesCount: db.messages.length,
            recentTutors,
            recentCustomers,
            messages: db.messages
        });
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving stats' });
    }
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
