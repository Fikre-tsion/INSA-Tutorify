const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'tutorify_jwt_secret_key_2025_secure_hash_8f93a2b4';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Default initial database content generator
const getDefaultDB = () => {
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    return {
        users: [
            {
                id: 1,
                name: "System Admin",
                email: "admin@tutorify.com",
                password: adminPasswordHash,
                role: "admin"
            }
        ],
        courses: [
            {
                id: 1,
                title: "Responsive Social Media Website UI Design",
                category: "Design",
                description: "Learn how to create a responsive social media website UI design using HTML and CSS.",
                image: "./digitalmarketing.png",
                price: "ETB 450"
            },
            {
                id: 2,
                title: "Responsive SmartHome Website Design",
                category: "Design",
                description: "Learn how to create a responsive SmartHome website design using HTML and CSS.",
                image: "./digitalmarketing.png",
                price: "ETB 500"
            },
            {
                id: 3,
                title: "Responsive Admin Dashboard UI Design",
                category: "Design",
                description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.",
                image: "./digitalmarketing.png",
                price: "ETB 400"
            },
            {
                id: 4,
                title: "Be focused and productive",
                category: "Personal Development",
                description: "Learn the fundamentals of productivity and focus, including time management and goal setting.",
                image: "./digitalmarketing.png",
                price: "ETB 350"
            },
            {
                id: 5,
                title: "Fundamentals of Digital Marketing",
                category: "Marketing",
                description: "Learn SEO, social media marketing, email marketing, and content marketing fundamentals.",
                image: "./digitalmarketing.png",
                price: "ETB 400"
            },
            {
                id: 6,
                title: "Introduction to Blockchain Technology",
                category: "Technology",
                description: "Learn the fundamentals of Blockchain Technology, smart contracts, and real-world applications.",
                image: "./digitalmarketing.png",
                price: "ETB 600"
            }
        ],
        messages: [
            {
                id: 1,
                firstName: "Gebre",
                lastName: "Alemu",
                email: "gebre@example.com",
                message: "Interested in Grade 12 math tutoring sessions.",
                date: new Date().toISOString()
            },
            {
                id: 2,
                firstName: "Selam",
                lastName: "Haile",
                email: "selam@example.com",
                message: "Could you provide details on the physics course schedule?",
                date: new Date().toISOString()
            }
        ],
        stats: {
            pageViews: 1504,
            tutorialsCount: 18,
            commentsCount: 284,
            earnings: 7842
        }
    };
};

let dbCache = null;
let writeQueue = Promise.resolve();

// Asynchronous background file write queue
const writeDBAsync = (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        try {
            await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error('Error writing to DB file asynchronously:', err);
        }
    }).catch(() => {});
    return writeQueue;
};

// Asynchronous DB reader with in-memory caching
const readDBAsync = async () => {
    if (dbCache) return dbCache;

    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = getDefaultDB();
            await fs.promises.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
            return dbCache;
        }

        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);

        let updated = false;
        const defaults = getDefaultDB();

        if (!Array.isArray(dbCache.users) || dbCache.users.length === 0) {
            dbCache.users = defaults.users;
            updated = true;
        } else if (!dbCache.users.find(u => u.role === 'admin')) {
            dbCache.users.push(defaults.users[0]);
            updated = true;
        }

        if (!Array.isArray(dbCache.courses)) {
            dbCache.courses = defaults.courses;
            updated = true;
        }

        if (!Array.isArray(dbCache.messages)) {
            dbCache.messages = defaults.messages;
            updated = true;
        }

        if (!dbCache.stats) {
            dbCache.stats = defaults.stats;
            updated = true;
        }

        if (updated) {
            await fs.promises.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
        }

        return dbCache;
    } catch (err) {
        console.error('Error reading db.json asynchronously, defaulting to memory DB', err);
        dbCache = getDefaultDB();
        return dbCache;
    }
};

// Synchronous wrapper using in-memory cache
const readDB = () => {
    if (!dbCache) {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = getDefaultDB();
            fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
        } else {
            try {
                dbCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            } catch (e) {
                dbCache = getDefaultDB();
            }
        }
    }
    return dbCache;
};

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Middleware to authenticate admin role
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
    const { name, email, password, role } = req.body;
    const db = await readDBAsync();

    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const userRole = 'user'; // Security policy: force user role for all self-registrations
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password: hashedPassword,
        role: userRole
    };

    db.users.push(newUser);
    writeDBAsync(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = await readDBAsync();

    const user = db.users.find(u => u.email === email && (!role || u.role === role));
    if (!user) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '2h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Courses Endpoints
app.get('/api/courses', async (req, res) => {
    const db = await readDBAsync();
    res.json(db.courses || []);
});

app.post('/api/courses', authenticateAdmin, async (req, res) => {
    const { title, category, description, price, image } = req.body;
    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
    }

    const db = await readDBAsync();
    const newCourse = {
        id: db.courses.length + 1,
        title,
        category: category || 'General',
        description,
        image: image || './digitalmarketing.png',
        price: price || 'Free'
    };

    db.courses.push(newCourse);
    writeDBAsync(db);

    res.status(201).json({ message: 'Course created successfully', course: newCourse });
});

// Contact Form Endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
        return res.status(400).json({ message: 'First name, email and message are required' });
    }

    const db = await readDBAsync();
    const newMessage = {
        id: db.messages.length + 1,
        firstName,
        lastName: lastName || '',
        email,
        message,
        date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    writeDBAsync(db);

    res.status(201).json({ message: 'Your message has been sent successfully!' });
});

// Admin Messages Endpoint
app.get('/api/messages', authenticateAdmin, async (req, res) => {
    const db = await readDBAsync();
    res.json(db.messages || []);
});

// Admin Stats Endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
    const db = await readDBAsync();
    res.json({
        stats: db.stats,
        usersCount: db.users.length,
        coursesCount: db.courses.length,
        messagesCount: db.messages.length,
        users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
});

// Page View Counter Endpoint
app.post('/api/stats/view', async (req, res) => {
    const db = await readDBAsync();
    if (!db.stats) {
        db.stats = { pageViews: 0, tutorialsCount: 18, commentsCount: 284, earnings: 7842 };
    }
    db.stats.pageViews = (db.stats.pageViews || 0) + 1;
    writeDBAsync(db);
    res.json({ pageViews: db.stats.pageViews });
});

app.listen(PORT, async () => {
    await readDBAsync();
    console.log(`Server is running on http://localhost:${PORT}`);
});
