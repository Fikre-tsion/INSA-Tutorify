const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'tutorify_jwt_secret_key_2025_prod_safe';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let dbCache = null;
let writeQueue = Promise.resolve();

// Initial seed courses array (18 courses)
const initialCourses = [
  { id: 1, title: 'Responsive Social Media Website UI Design', description: 'Learn how to create a responsive social media website UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course1.jpg' },
  { id: 2, title: 'Responsive SmartHome Website Design', description: 'Learn how to create a responsive SmartHome website design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course2.jpg' },
  { id: 3, title: 'Responsive Admin Dashboard UI Design', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course3.jpg' },
  { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management, goal setting, and effective work habits. This course is designed for beginners looking to enhance their productivity skills.', image: './images/course4.jpg' },
  { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and effective communication. This course is designed for beginners looking to enhance their personal and professional lives.', image: './images/course5.jpg' },
  { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course6.jpg' },
  { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO, social media marketing, email marketing, and content marketing. This course is designed for beginners looking to enhance their marketing skills.', image: './digitalmarketing.png' },
  { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success, including mindset, goal setting, and effective communication. This course is designed for beginners looking to enhance their personal and professional lives.', image: './images/self.png' },
  { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course9.jpg' },
  { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course10.jpg' },
  { id: 11, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles, color theory, and typography. This course is designed for beginners looking to enhance their design skills.', image: './images/course11.jpg' },
  { id: 12, title: 'Responsive Admin Dashboard UI Design Pro', description: 'Learn how to create a responsive Admin Dashboard UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course12.jpg' },
  { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, including its architecture, consensus mechanisms, and real-world applications. This course is designed for beginners looking to understand the basics of blockchain.', image: './images/blockchain.png' },
  { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course14.jpg' },
  { id: 15, title: 'Landing Page Design', description: 'Learn how to create a responsive Landing Page design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course15.jpg' },
  { id: 16, title: 'World Class Portfolio Website Development', description: 'Learn how to create a world Class Portfolio Website using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course16.jpg' },
  { id: 17, title: 'Responsive Business Manager Dashboard UI Design', description: 'Learn how to create a responsive Business manager dashboard UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course17.jpg' },
  { id: 18, title: 'Responsive Smart Home Application UI Design', description: 'Learn how to create a responsive Smart home Application UI design using HTML and CSS. This course covers layout techniques, styling, and best practices for building user-friendly interfaces.', image: './images/course18.jpg' }
];

// Asynchronous readDB helper function
async function readDB() {
  if (dbCache) {
    return dbCache;
  }
  let db = { users: [], courses: [], messages: [], stats: { views: 0 } };
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = await fsPromises.readFile(DB_FILE, 'utf8');
      db = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }

  // Schema migrations & defaults
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.courses) || db.courses.length === 0) db.courses = initialCourses;
  if (!Array.isArray(db.messages)) db.messages = [];
  if (!db.stats || typeof db.stats !== 'object') db.stats = { views: 0 };
  if (typeof db.stats.views !== 'number') db.stats.views = 0;

  // Seed default admin user if missing
  let admin = db.users.find(u => u.role === 'admin');
  if (!admin) {
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const maxUserId = db.users.reduce((max, u) => Math.max(max, u.id || 0), 0);
    admin = {
      id: maxUserId + 1,
      name: 'Admin User',
      email: 'admin@tutorify.com',
      password: hashedAdminPassword,
      role: 'admin'
    };
    db.users.push(admin);
  }

  dbCache = db;
  await writeDB(dbCache);
  return dbCache;
}

// Asynchronous writeDB helper function with serialized write queue
function writeDB(data) {
  dbCache = data;
  writeQueue = writeQueue.then(async () => {
    try {
      await fsPromises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing to db.json:', err);
    }
  }).catch(() => {});
  return writeQueue;
}

// Middleware: Authenticate Admin User via JWT
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// --- REST API ENDPOINTS ---

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
    const maxUserId = db.users.reduce((max, u) => Math.max(max, u.id || 0), 0);
    // Security policy: Hardcode 'user' role for registration to prevent privilege escalation
    const newUser = {
      id: maxUserId + 1,
      name,
      email,
      password: hashedPassword,
      role: 'user'
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

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
      { expiresIn: '1h' }
    );

    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Courses endpoint
app.get('/api/courses', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.courses || []);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !email || !message) {
      return res.status(400).json({ message: 'First name, email, and message are required' });
    }

    const db = await readDB();
    const maxMsgId = db.messages.reduce((max, m) => Math.max(max, m.id || 0), 0);
    const newMessage = {
      id: maxMsgId + 1,
      firstName,
      lastName: lastName || '',
      email,
      message,
      date: new Date().toISOString()
    };

    db.messages.push(newMessage);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Admin stats endpoint
app.get('/api/stats', authenticateAdmin, async (req, res) => {
  try {
    const db = await readDB();
    const stats = {
      views: db.stats ? db.stats.views : 0,
      coursesCount: db.courses.length,
      messagesCount: db.messages.length,
      usersCount: db.users.length,
      recentMessages: db.messages.slice(-10).reverse(),
      recentUsers: db.users.slice(-10).reverse()
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Page view tracking endpoint
app.post('/api/stats/view', async (req, res) => {
  try {
    const db = await readDB();
    if (!db.stats) db.stats = { views: 0 };
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record page view' });
  }
});

app.listen(PORT, async () => {
  await readDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
