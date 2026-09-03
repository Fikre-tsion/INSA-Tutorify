const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
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
  { id: 1, title: 'Responsive Social Media Website UI Design', category: 'Web Development', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './images/course1.jpg' },
  { id: 2, title: 'Responsive SmartHome Website Design', category: 'Web Development', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './images/course2.jpg' },
  { id: 3, title: 'Responsive Admin Dashboard UI Design', category: 'Web Development', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './images/course3.jpg' },
  { id: 4, title: 'Blockchain & Smart Contracts Fundamentals', category: 'Blockchain', description: 'Understand blockchain mechanics, Ethereum, and Solidity smart contracts from scratch.', image: './images/digitalmarketing.png' },
  { id: 5, title: 'Python Programming Masterclass', category: 'Programming', description: 'Master Python fundamentals, object-oriented programming, and essential data structures.', image: './images/digitalmarketing.png' },
  { id: 6, title: 'Personal Finance & Wealth Management', category: 'Finance', description: 'Learn investing, budgeting, stock market basics, and strategies for long-term financial growth.', image: './images/digitalmarketing.png' },
  { id: 7, title: 'UI/UX & Graphic Design Essentials', category: 'Graphic Design', description: 'Discover layout principles, color theory, typography, and visual design tools.', image: './images/digitalmarketing.png' },
  { id: 8, title: 'Ethical Hacking & Cyber Security', category: 'Cyber Security', description: 'Understand network security, penetration testing basics, and safe digital practices.', image: './images/digitalmarketing.png' },
  { id: 9, title: 'Entrepreneurship & Business Strategy', category: 'Business', description: 'Build and scale a successful business startup with effective operational strategies.', image: './images/digitalmarketing.png' },
  { id: 10, title: 'Data Science & Machine Learning with Python', category: 'Data Science', description: 'Analyze data with Pandas, NumPy, and build machine learning models with Scikit-Learn.', image: './images/digitalmarketing.png' },
  { id: 11, title: 'Modern JavaScript from Beginner to Advanced', category: 'Programming', description: 'Master ES6+, async/await, DOM manipulation, and functional programming patterns.', image: './images/digitalmarketing.png' },
  { id: 12, title: 'Fullstack Web Development with React & Node', category: 'Web Development', description: 'Build fullstack applications using React, Express, Node.js, and RESTful APIs.', image: './images/digitalmarketing.png' },
  { id: 13, title: 'Digital Marketing & Growth Hacking', category: 'Marketing', description: 'Optimize SEO, execute social media campaigns, and boost customer acquisition.', image: './images/digitalmarketing.png' },
  { id: 14, title: 'Java Programming & Data Structures', category: 'Programming', description: 'Comprehensive guide to Java, Object-Oriented design, algorithms, and data structures.', image: './images/digitalmarketing.png' },
  { id: 15, title: 'Cloud Computing Essentials (AWS & Azure)', category: 'Cloud', description: 'Deploy, manage, and scale cloud applications on industry-standard infrastructure.', image: './images/digitalmarketing.png' },
  { id: 16, title: 'Mobile App Development with Flutter', category: 'Mobile', description: 'Build cross-platform mobile apps for iOS and Android using Dart and Flutter.', image: './images/digitalmarketing.png' },
  { id: 17, title: 'SQL & Database Architecture', category: 'Data Science', description: 'Master relational database design, complex SQL queries, and database optimization.', image: './images/digitalmarketing.png' },
  { id: 18, title: 'DevOps Pipelines & Docker Fundamentals', category: 'Cloud', description: 'Containerize applications, build CI/CD pipelines, and streamline modern deployment.', image: './images/digitalmarketing.png' }
];

async function readDB() {
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

  let modified = false;
  if (!dbCache.users) { dbCache.users = []; modified = true; }
  if (!dbCache.courses) { dbCache.courses = []; modified = true; }
  if (!dbCache.messages) { dbCache.messages = []; modified = true; }
  if (!dbCache.stats) { dbCache.stats = { views: 0 }; modified = true; }

  // Seed default admin user
  const adminEmail = 'admin@tutorify.com';
  let adminUser = dbCache.users.find(u => u.email === adminEmail);
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    adminUser = {
      id: dbCache.users.length + 1,
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    };
    dbCache.users.push(adminUser);
    modified = true;
  }

  // Seed courses if missing or fewer than initialCourses
  if (dbCache.courses.length === 0) {
    dbCache.courses = initialCourses;
    modified = true;
  }

  if (modified) {
    await writeDB(dbCache);
  }

  return dbCache;
}

async function writeDB(data) {
  dbCache = data;
  writeQueue = writeQueue.then(async () => {
    await fs.promises.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
  }).catch(err => {
    console.error('Failed to write DB file:', err);
  });
  return writeQueue;
}

// Authentication Middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || !decoded || decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    req.user = decoded;
    next();
  });
}

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
      role: 'user' // Hardcoded user role for security
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET Courses endpoint
app.get('/api/courses', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST Contact endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const db = await readDB();
    const newMessage = {
      id: db.messages.length + 1,
      firstName,
      lastName: lastName || '',
      email,
      message,
      date: new Date().toISOString(),
      status: 'Pending'
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST View Stats tracking endpoint
app.post('/api/stats/view', async (req, res) => {
  try {
    const db = await readDB();
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET Stats endpoint (Admin only)
app.get('/api/stats', authenticateAdmin, async (req, res) => {
  try {
    const db = await readDB();
    const views = db.stats.views || 0;
    const courseCount = db.courses.length;
    const messageCount = db.messages.length;
    const userCount = db.users.length;

    res.json({
      views,
      courseCount,
      messageCount,
      userCount,
      messages: db.messages,
      users: db.users
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, async () => {
  await readDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
