const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev_secret');

if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is missing in production');
    process.exit(1);
}

const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;

const initialCourses = [
    {
        id: 1,
        title: "Responsive Social Media Website UI Design",
        description: "Learn how to create a responsive social media website UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course1.jpg"
    },
    {
        id: 2,
        title: "Responsive SmartHome Website Design",
        description: "Learn how to create a responsive SmartHome website design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course2.jpg"
    },
    {
        id: 3,
        title: "Responsive Admin Dashboard UI Design",
        description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course3.jpg"
    },
    {
        id: 4,
        title: "Be focused and productive",
        description: "Learn the fundamentals of productivity and focus, including time management, goal setting, and effective work habits. This course is designed for beginners looking to enhance their productivity skills.",
        image: "./images/course4.jpg"
    },
    {
        id: 5,
        title: "How to use every opportunity to be successful",
        description: "Learn the fundamentals of success, including mindset, goal setting, and effective communication. This course is designed for beginners looking to enhance their personal and professional lives.",
        image: "./images/course5.jpg"
    },
    {
        id: 6,
        title: "Responsive social Media UI design",
        description: "Learn how to create a responsive social Media UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course6.jpg"
    },
    {
        id: 7,
        title: "Fundamentals of Digital Marketing",
        description: "Learn the fundamentals of Digital Marketing, including SEO, social media marketing, email marketing, and content marketing. This course is designed for beginners looking to enhance their marketing skills.",
        image: "./images/digitalmarketing.png"
    },
    {
        id: 8,
        title: "How to be a confident and successful person",
        description: "Learn the fundamentals of self-confidence and success, including mindset, goal setting, and effective communication. This course is designed for beginners looking to enhance their personal and professional lives.",
        image: "./images/self.png"
    },
    {
        id: 9,
        title: "Cloning Netflix Website",
        description: "Learn how to create a responsive Netflix website clone using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course9.jpg"
    },
    {
        id: 10,
        title: "Digital Newspaper Website Design",
        description: "Learn how to create a responsive Digital Newspaper website design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course10.jpg"
    },
    {
        id: 11,
        title: "Responsive Admin Dashboard UI Design",
        description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course12.jpg"
    },
    {
        id: 12,
        title: "Logo and Graphic Designing",
        description: "Learn the fundamentals of Logo and Graphic Designing, including design principles, color theory, and typography. This course is designed for beginners looking to enhance their design skills.",
        image: "./images/course11.jpg"
    },
    {
        id: 13,
        title: "Introduction to Blockchain Technology",
        description: "Learn the fundamentals of Blockchain Technology, including its architecture, consensus mechanisms, and real-world applications. This course is designed for beginners looking to understand the basics of blockchain.",
        image: "./images/blockchain.png"
    },
    {
        id: 14,
        title: "Fully functioning Contact Form Design",
        description: "Learn how to create a responsive Contact Form design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course14.jpg"
    },
    {
        id: 15,
        title: "Landing Page Design",
        description: "Learn how to create a responsive Landing Page design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course15.jpg"
    },
    {
        id: 16,
        title: "World Class Portfolio Website development",
        description: "Learn how to create a world Class Portfolio Website using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course16.jpg"
    },
    {
        id: 17,
        title: "Responsive Business manager dashboard UI Design",
        description: "Learn how to create a responsive Business manager dashboard UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course17.jpg"
    },
    {
        id: 18,
        title: "Responsive Smart home Application UI Design",
        description: "Learn how to create a responsive Smart home Application UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.",
        image: "./images/course18.jpg"
    }
];

const writeDB = async (data) => {
    dbCache = data;
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const readDB = async () => {
    if (dbCache) return dbCache;
    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: [], messages: [], stats: { views: 0 } };
        } else {
            const data = await fs.promises.readFile(DB_FILE, 'utf8');
            dbCache = JSON.parse(data);
        }
    } catch (err) {
        dbCache = { users: [], courses: [], messages: [], stats: { views: 0 } };
    }

    if (!Array.isArray(dbCache.users)) dbCache.users = [];
    if (!Array.isArray(dbCache.courses)) dbCache.courses = [];
    if (!Array.isArray(dbCache.messages)) dbCache.messages = [];
    if (!dbCache.stats || typeof dbCache.stats !== 'object') dbCache.stats = { views: 0 };
    if (typeof dbCache.stats.views !== 'number') dbCache.stats.views = 0;

    const hasAdmin = dbCache.users.some(u => u.role === 'admin' || u.email === 'admin@tutorify.com');
    if (!hasAdmin) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        dbCache.users.push({
            id: dbCache.users.length + 1,
            name: 'Admin',
            email: 'admin@tutorify.com',
            password: hashedPassword,
            role: 'admin'
        });
        await writeDB(dbCache);
    }

    if (dbCache.courses.length === 0) {
        dbCache.courses = initialCourses;
        await writeDB(dbCache);
    }

    return dbCache;
};

// Register endpoint
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
        role: 'user' // Hardcoded to 'user' for security
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = await readDB();

    const user = db.users.find(u => u.email === email && (!role || u.role === role));
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

// Courses endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses);
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({ message: 'Email and message are required' });
    }
    const db = await readDB();
    const newMessage = {
        id: db.messages.length + 1,
        firstName: firstName || '',
        lastName: lastName || '',
        email,
        message,
        date: new Date().toISOString()
    };
    db.messages.push(newMessage);
    await writeDB(db);
    res.status(201).json({ message: 'Message sent successfully' });
});

// Track page view
app.post('/api/stats/view', async (req, res) => {
    const db = await readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
});

// Admin Stats endpoint
app.get('/api/stats', async (req, res) => {
    const db = await readDB();
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }
    } catch (e) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    res.json({
        views: db.stats.views || 0,
        courseCount: db.courses.length,
        messageCount: db.messages.length,
        userCount: db.users.length,
        messages: db.messages,
        users: db.users
    });
});

app.listen(PORT, async () => {
    await readDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
