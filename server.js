const express = require('express');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// In-memory cache & serialized write queue for high performance & non-blocking async I/O
let dbCache = null;
let writeQueue = Promise.resolve();

// Initial Course Catalog Data (18 courses)
const initialCourses = [
  { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
  { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
  { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
  { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './images/course4.jpg' },
  { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and effective communication.', image: './images/course5.jpg' },
  { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
  { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO, social media marketing, and email marketing.', image: './digitalmarketing.png' },
  { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success for personal and professional growth.', image: './images/digitalmarketing.png' },
  { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
  { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
  { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles and typography.', image: './images/course11.jpg' },
  { id: 12, title: 'Responsive Admin Dashboard UI Design Pro', description: 'Master advanced dashboard analytics layout and interactions with modern CSS.', image: './images/course12.jpg' },
  { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, smart contracts, and real-world applications.', image: './images/digitalmarketing.png' },
  { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML, CSS, and JavaScript.', image: './images/course14.jpg' },
  { id: 15, title: 'Landing Page Design', description: 'Learn how to create a high-converting responsive Landing Page design.', image: './images/course15.jpg' },
  { id: 16, title: 'World Class Portfolio Website development', description: 'Learn how to create a world class Portfolio Website to showcase your projects.', image: './images/course16.jpg' },
  { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to create a responsive Business manager dashboard UI design.', image: './images/course17.jpg' },
  { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Learn how to create a responsive Smart home Application UI design.', image: './images/course18.jpg' }
];

// Helper function to read database asynchronously with in-memory caching
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }
    try {
        if (!fsSync.existsSync(DB_FILE)) {
            const adminPasswordHash = await bcrypt.hash('password123', 10);
            const initialData = {
                users: [
                    {
                        id: 1,
                        name: 'Administrator',
                        email: 'admin@tutorify.com',
                        password: adminPasswordHash,
                        role: 'admin'
                    }
                ],
                courses: initialCourses,
                messages: [
                    {
                        id: 1,
                        firstName: 'Abebe',
                        lastName: 'Bikila',
                        email: 'abebe@example.com',
                        message: 'Interested in the Digital Marketing course.',
                        createdAt: new Date().toISOString()
                    }
                ],
                stats: {
                    profileViews: 1504,
                    tutorials: 18,
                    comments: 284,
                    earnings: 7842
                }
            };
            await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
            dbCache = initialData;
            return dbCache;
        }

        const data = await fs.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);

        // Schema migration check
        let modified = false;
        if (!dbCache.users) { dbCache.users = []; modified = true; }
        if (!dbCache.courses || dbCache.courses.length === 0) { dbCache.courses = initialCourses; modified = true; }
        if (!dbCache.messages) { dbCache.messages = []; modified = true; }
        if (!dbCache.stats) {
            dbCache.stats = { profileViews: 1504, tutorials: 18, comments: 284, earnings: 7842 };
            modified = true;
        }

        // Seed admin user if missing
        if (!dbCache.users.find(u => u.email === 'admin@tutorify.com')) {
            const adminPasswordHash = await bcrypt.hash('password123', 10);
            dbCache.users.push({
                id: dbCache.users.length + 1,
                name: 'Administrator',
                email: 'admin@tutorify.com',
                password: adminPasswordHash,
                role: 'admin'
            });
            modified = true;
        }

        if (modified) {
            await writeDB(dbCache);
        }

        return dbCache;
    } catch (err) {
        console.error('Error reading DB file:', err);
        return { users: [], courses: initialCourses, messages: [], stats: { profileViews: 0, tutorials: 18, comments: 0, earnings: 0 } };
    }
};

// Helper function to write database asynchronously using serialized write queue
const writeDB = (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        try {
            await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error('Error writing DB file:', err);
        }
    }).catch(err => {
        console.error('Write queue error:', err);
    });
    return writeQueue;
};

// Authentication Middlewares
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

const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin access required' });
        }
    });
};

// --- Endpoints ---

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
        const newUser = {
            id: db.users.length + 1,
            name,
            email,
            password: hashedPassword,
            role: 'user' // Hardcoded user role for safety
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
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const db = await readDB();
        const user = db.users.find(u => u.email === email && (!role || u.role === role));
        if (!user) {
            return res.status(400).json({ message: 'Invalid email, password or role' });
        }

        let isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid && password === user.password) {
            isPasswordValid = true; // Fallback for plain text if seeded without bcrypt
        }

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email, password or role' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            SECRET_KEY,
            { expiresIn: '2h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get Courses Catalog endpoint
app.get('/api/courses', async (req, res) => {
    try {
        const db = await readDB();
        res.json(db.courses || []);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

// Contact Form submission endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }

        const db = await readDB();
        const newMessage = {
            id: (db.messages ? db.messages.length : 0) + 1,
            firstName: firstName || '',
            lastName: lastName || '',
            email,
            message,
            createdAt: new Date().toISOString()
        };

        if (!db.messages) db.messages = [];
        db.messages.push(newMessage);
        if (!db.stats) db.stats = { profileViews: 1504, tutorials: 18, comments: 0, earnings: 7842 };
        db.stats.comments = (db.stats.comments || 0) + 1;

        await writeDB(db);

        res.status(201).json({ message: 'Thank you for your message! We will get back to you soon.' });
    } catch (err) {
        res.status(500).json({ message: 'Error submitting message' });
    }
});

// Admin Statistics endpoint (Protected)
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await readDB();
        res.json({
            stats: db.stats,
            messages: db.messages,
            userCount: db.users.length,
            courseCount: db.courses.length
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

// Increment Page View count endpoint
app.post('/api/stats/view', async (req, res) => {
    try {
        const db = await readDB();
        if (!db.stats) db.stats = { profileViews: 1504, tutorials: 18, comments: 284, earnings: 7842 };
        db.stats.profileViews = (db.stats.profileViews || 0) + 1;
        await writeDB(db);
        res.json({ success: true, profileViews: db.stats.profileViews });
    } catch (err) {
        res.status(500).json({ message: 'Error recording page view' });
    }
});

// Startup server and seed DB if run directly
if (require.main === module) {
    app.listen(PORT, async () => {
        await readDB();
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
