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

let dbCache = null;
let writeQueue = Promise.resolve();

const initialCourses = [
  { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS.', image: './digitalmarketing.png' },
  { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS.', image: './digitalmarketing.png' },
  { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS.', image: './digitalmarketing.png' },
  { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and goal setting.', image: './digitalmarketing.png' },
  { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and effective communication.', image: './digitalmarketing.png' },
  { id: 6, title: 'Responsive social Media UI design', description: 'Learn layout techniques and best practices for building responsive user interfaces.', image: './digitalmarketing.png' },
  { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn SEO, social media marketing, email marketing, and content marketing.', image: './digitalmarketing.png' },
  { id: 8, title: 'How to be a confident and successful person', description: 'Learn self-confidence and personal development strategies.', image: './digitalmarketing.png' },
  { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './digitalmarketing.png' },
  { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn digital media styling and layout techniques using HTML and CSS.', image: './digitalmarketing.png' },
  { id: 11, title: 'Logo and Graphic Designing', description: 'Learn design principles, color theory, and typography for logo design.', image: './digitalmarketing.png' },
  { id: 12, title: 'Responsive Admin Dashboard UI Design V2', description: 'Advanced UI dashboard techniques with modern CSS grid and flexbox.', image: './digitalmarketing.png' },
  { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn blockchain architecture, consensus mechanisms, and decentralized apps.', image: './digitalmarketing.png' },
  { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn responsive form layout techniques and interaction handling.', image: './digitalmarketing.png' },
  { id: 15, title: 'Landing Page Design', description: 'Build high-converting landing page designs with HTML and modern CSS.', image: './digitalmarketing.png' },
  { id: 16, title: 'World Class Portfolio Website development', description: 'Showcase your work with a responsive, modern developer portfolio.', image: './digitalmarketing.png' },
  { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Design complex management UI components efficiently.', image: './digitalmarketing.png' },
  { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Master application UI concepts for IoT and smart devices.', image: './digitalmarketing.png' }
];

async function readDB() {
  if (dbCache) return dbCache;

  let db = { users: [], courses: [], messages: [], stats: { profileViews: 1504, tutorials: 18, comments: 284, earnings: 7842 } };

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = await fs.promises.readFile(DB_FILE, 'utf8');
      db = { ...db, ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed to read db.json:', e);
    }
  }

  if (!db.users) db.users = [];
  if (!db.courses || db.courses.length === 0) db.courses = initialCourses;
  if (!db.messages) db.messages = [];
  if (!db.stats) db.stats = { profileViews: 1504, tutorials: 18, comments: 284, earnings: 7842 };

  // Seed default admin if missing
  const adminExists = db.users.some(u => u.role === 'admin' || u.email === 'admin@tutorify.com');
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    db.users.push({
      id: db.users.length + 1,
      name: 'Admin',
      email: 'admin@tutorify.com',
      password: hashedPassword,
      role: 'admin'
    });
  }

  dbCache = db;
  await writeDB(db);
  return db;
}

function writeDB(data) {
  dbCache = data;
  writeQueue = writeQueue.then(async () => {
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  }).catch(err => {
    console.error('Write DB error:', err);
  });
  return writeQueue;
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Admin role required' });
    }
  });
}

// Endpoints

// Register
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

// Login
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

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Submit Contact Form
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, name, email, message } = req.body;
  const senderName = name || `${firstName || ''} ${lastName || ''}`.trim();

  if (!email || !message) {
    return res.status(400).json({ message: 'Email and message are required' });
  }

  const db = await readDB();
  const newMessage = {
    id: db.messages.length + 1,
    sender: senderName || 'Anonymous',
    email,
    message,
    date: new Date().toISOString()
  };

  db.messages.unshift(newMessage);
  await writeDB(db);

  res.status(201).json({ message: 'Message sent successfully' });
});

// Get Courses
app.get('/api/courses', async (req, res) => {
  const db = await readDB();
  res.json(db.courses);
});

// Record Page View
app.post('/api/stats/view', async (req, res) => {
  const db = await readDB();
  db.stats.profileViews = (db.stats.profileViews || 0) + 1;
  await writeDB(db);
  res.json({ profileViews: db.stats.profileViews });
});

// Get Admin Stats
app.get('/api/stats', authenticateAdmin, async (req, res) => {
  const db = await readDB();
  res.json({
    stats: db.stats,
    messages: db.messages,
    usersCount: db.users.length
  });
});

app.listen(PORT, async () => {
  await readDB();
  console.log(`Server running on http://localhost:${PORT}`);
});
