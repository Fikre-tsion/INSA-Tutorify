const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Performance Optimization: In-memory DB cache & serialized async write queue
let dbCache = null;
let writeQueue = Promise.resolve();

// Initial course catalog seeding
const initialCourses = [
  { id: 1, title: "Responsive Social Media Website UI Design", description: "Learn how to create a responsive social media website UI design using HTML and CSS.", image: "./images/course1.jpg" },
  { id: 2, title: "Responsive SmartHome Website Design", description: "Learn how to create a responsive SmartHome website design using HTML and CSS.", image: "./images/course2.jpg" },
  { id: 3, title: "Responsive Admin Dashboard UI Design", description: "Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.", image: "./images/course3.jpg" },
  { id: 4, title: "Be focused and productive", description: "Learn the fundamentals of productivity and focus, including time management and goal setting.", image: "./images/course4.jpg" },
  { id: 5, title: "How to use every opportunity to be successful", description: "Learn the fundamentals of success, including mindset, goal setting, and communication.", image: "./images/course5.jpg" },
  { id: 6, title: "Responsive social Media UI design", description: "Learn layout techniques, styling, and best practices for social interfaces.", image: "./images/course6.jpg" },
  { id: 7, title: "Fundamentals of Digital Marketing", description: "Learn SEO, social media marketing, email marketing, and content marketing.", image: "./images/digitalmarketing.png" },
  { id: 8, title: "How to be a confident and successful person", description: "Build self-confidence, goal setting, and effective communication skills.", image: "./images/self.png" },
  { id: 9, title: "Cloning Netflix Website", description: "Create a responsive Netflix website clone using HTML and CSS.", image: "./images/course9.jpg" },
  { id: 10, title: "Digital Newspaper Website Design", description: "Design an interactive online newspaper layout with HTML and CSS.", image: "./images/course10.jpg" },
  { id: 11, title: "Logo and Graphic Designing", description: "Master design principles, color theory, and typography.", image: "./images/course11.jpg" },
  { id: 12, title: "Responsive Admin Dashboard UI Design Pro", description: "Advanced dashboard UI components and charting design.", image: "./images/course12.jpg" },
  { id: 13, title: "Introduction to Blockchain Technology", description: "Learn blockchain architecture, smart contracts, and decentralized apps.", image: "./images/blockchain.png" },
  { id: 14, title: "Fully functioning Contact Form Design", description: "Create accessible and functional contact form components.", image: "./images/course14.jpg" },
  { id: 15, title: "Landing Page Design", description: "Create conversion-focused high quality landing page interfaces.", image: "./images/course15.jpg" },
  { id: 16, title: "World Class Portfolio Website development", description: "Build a modern developer or design portfolio website.", image: "./images/course16.jpg" },
  { id: 17, title: "Responsive Business manager dashboard UI Design", description: "Layouts for enterprise business analytics.", image: "./images/course17.jpg" },
  { id: 18, title: "Responsive Smart home Application UI Design", description: "UI patterns for IoT and Smart Home mobile/web apps.", image: "./images/course18.jpg" }
];

// Read DB asynchronously with cache
async function readDB() {
  if (dbCache) return dbCache;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = await fs.promises.readFile(DB_FILE, 'utf8');
      dbCache = JSON.parse(data);
    } else {
      dbCache = { users: [], courses: [], messages: [], stats: { views: 1504, tutorials: 80, comments: 284, earnings: 7842 } };
    }
  } catch (err) {
    dbCache = { users: [], courses: [], messages: [], stats: { views: 1504, tutorials: 80, comments: 284, earnings: 7842 } };
  }

  let changed = false;
  if (!dbCache.users) { dbCache.users = []; changed = true; }
  if (!dbCache.courses || dbCache.courses.length === 0) { dbCache.courses = initialCourses; changed = true; }
  if (!dbCache.messages) { dbCache.messages = []; changed = true; }
  if (!dbCache.stats) {
    dbCache.stats = { views: 1504, tutorials: 80, comments: 284, earnings: 7842 };
    changed = true;
  }

  // Seed admin user if not present
  const adminExists = dbCache.users.some(u => u.email === 'admin@tutorify.com');
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    dbCache.users.push({
      id: dbCache.users.length + 1,
      name: 'System Admin',
      email: 'admin@tutorify.com',
      password: hashedPassword,
      role: 'admin'
    });
    changed = true;
  }

  if (changed) {
    await writeDB(dbCache);
  }

  return dbCache;
}

// Write DB asynchronously with Promise chaining queue to prevent race conditions
function writeDB(data) {
  dbCache = data;
  writeQueue = writeQueue.then(async () => {
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  }).catch(() => {});
  return writeQueue;
}

// Middleware: Authenticate Admin JWT token
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied, token missing' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || !decoded || decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    req.user = decoded;
    next();
  });
}

// Routes

// Register Endpoint
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
    role: 'user' // Hardcoded role to prevent privilege escalation
  };

  db.users.push(newUser);
  await writeDB(db);

  res.status(201).json({ message: 'User registered successfully' });
});

// Login Endpoint
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

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    SECRET_KEY,
    { expiresIn: '2h' }
  );

  res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Get Courses Endpoint
app.get('/api/courses', async (req, res) => {
  const db = await readDB();
  res.json(db.courses || []);
});

// Contact Submission Endpoint
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
    createdAt: new Date().toISOString()
  };

  db.messages.push(newMessage);
  if (db.stats) {
    db.stats.comments = (db.stats.comments || 0) + 1;
  }
  await writeDB(db);

  res.status(201).json({ message: 'Message submitted successfully' });
});

// Get Admin Dashboard Stats Endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
  const db = await readDB();
  res.json({
    stats: db.stats,
    usersCount: db.users.length,
    messages: db.messages.slice(-10),
    users: db.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
  });
});

// Record Page View Metric
app.post('/api/stats/view', async (req, res) => {
  const db = await readDB();
  if (db.stats) {
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
  }
  res.json({ success: true, views: db.stats ? db.stats.views : 0 });
});

app.listen(PORT, () => {
  readDB().then(() => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
