const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'tutorify_jwt_secret_key_2025';
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
  { id: 4, title: 'Be focused and productive', description: 'Learn the fundamentals of productivity and focus, including time management and work habits.', image: './images/course4.jpg' },
  { id: 5, title: 'How to use every opportunity to be successful', description: 'Learn the fundamentals of success, including mindset, goal setting, and effective communication.', image: './images/course5.jpg' },
  { id: 6, title: 'Responsive social Media UI design', description: 'Learn how to create a responsive social Media UI design using HTML and CSS.', image: './images/course6.jpg' },
  { id: 7, title: 'Fundamentals of Digital Marketing', description: 'Learn the fundamentals of Digital Marketing, including SEO, social media, and content marketing.', image: './digitalmarketing.png' },
  { id: 8, title: 'How to be a confident and successful person', description: 'Learn the fundamentals of self-confidence and success for personal and professional growth.', image: './images/self.png' },
  { id: 9, title: 'Cloning Netflix Website', description: 'Learn how to create a responsive Netflix website clone using HTML and CSS.', image: './images/course9.jpg' },
  { id: 10, title: 'Digital Newspaper Website Design', description: 'Learn how to create a responsive Digital Newspaper website design using HTML and CSS.', image: './images/course10.jpg' },
  { id: 11, title: 'Responsive Admin Dashboard UI Design - Advanced', description: 'Learn advanced layout techniques for building complex Admin Dashboard UIs.', image: './images/course12.jpg' },
  { id: 12, title: 'Logo and Graphic Designing', description: 'Learn the fundamentals of Logo and Graphic Designing, including design principles and color theory.', image: './images/course11.jpg' },
  { id: 13, title: 'Introduction to Blockchain Technology', description: 'Learn the fundamentals of Blockchain Technology, architecture, and consensus mechanisms.', image: './images/blockchain.png' },
  { id: 14, title: 'Fully functioning Contact Form Design', description: 'Learn how to create a responsive Contact Form design with backend submission handling.', image: './images/course14.jpg' },
  { id: 15, title: 'Landing Page Design', description: 'Learn how to create high-converting responsive Landing Page designs using HTML and CSS.', image: './images/course15.jpg' },
  { id: 16, title: 'World Class Portfolio Website development', description: 'Learn how to create a world class portfolio website to showcase your projects and skills.', image: './images/course16.jpg' },
  { id: 17, title: 'Responsive Business manager dashboard UI Design', description: 'Learn how to design clean business management dashboards for enterprise web apps.', image: './images/course17.jpg' },
  { id: 18, title: 'Responsive Smart home Application UI Design', description: 'Learn how to build intuitive smart home interfaces with modern CSS grid and flexbox.', image: './images/course18.jpg' }
];

const seedDB = async () => {
  const adminHashedPassword = await bcrypt.hash('admin123', 10);
  return {
    users: [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@tutorify.com',
        password: adminHashedPassword,
        role: 'admin'
      }
    ],
    courses: initialCourses,
    messages: [],
    stats: {
      views: 1504,
      tutorials: 80,
      comments: 284,
      earnings: 7842
    }
  };
};

const readDB = async () => {
  if (dbCache) return dbCache;
  try {
    if (!fs.existsSync(DB_FILE)) {
      dbCache = await seedDB();
      await writeDB(dbCache);
      return dbCache;
    }
    const data = await fs.promises.readFile(DB_FILE, 'utf8');
    dbCache = JSON.parse(data);

    let updated = false;
    if (!dbCache.users) { dbCache.users = []; updated = true; }
    if (!dbCache.courses || dbCache.courses.length === 0) { dbCache.courses = initialCourses; updated = true; }
    if (!dbCache.messages) { dbCache.messages = []; updated = true; }
    if (!dbCache.stats) {
      dbCache.stats = { views: 1504, tutorials: 80, comments: 284, earnings: 7842 };
      updated = true;
    }

    // Check if admin exists
    const adminExists = dbCache.users.some(u => u.role === 'admin');
    if (!adminExists) {
      const adminHashedPassword = await bcrypt.hash('admin123', 10);
      dbCache.users.push({
        id: dbCache.users.length + 1,
        name: 'Admin User',
        email: 'admin@tutorify.com',
        password: adminHashedPassword,
        role: 'admin'
      });
      updated = true;
    }

    if (updated) {
      await writeDB(dbCache);
    }
    return dbCache;
  } catch (err) {
    dbCache = await seedDB();
    await writeDB(dbCache);
    return dbCache;
  }
};

const writeDB = (data) => {
  dbCache = data;
  writeQueue = writeQueue.then(async () => {
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  }).catch((err) => {
    console.error('Error writing DB file:', err);
  });
  return writeQueue;
};

// Middleware to authenticate JWT token
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

// Middleware to authenticate Admin
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
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const db = await readDB();
    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = (role === 'admin') ? 'user' : (role || 'user'); // User role default for security
    const newUser = {
      id: db.users.length + 1,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed due to server error' });
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
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && (role ? u.role === role : true));

    if (!user) {
      return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    let isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid && password === user.password) {
      // Direct comparison if plain text during development seed
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed due to server error' });
  }
});

// Get Courses
app.get('/api/courses', async (req, res) => {
  try {
    const db = await readDB();
    res.json({ courses: db.courses || [] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// Contact Form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, name, email, message } = req.body;
    const senderName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'Anonymous';

    if (!email || !message) {
      return res.status(400).json({ message: 'Email and message are required' });
    }

    const db = await readDB();
    const newMessage = {
      id: (db.messages ? db.messages.length : 0) + 1,
      sender: senderName,
      email,
      message,
      date: new Date().toISOString()
    };

    if (!db.messages) db.messages = [];
    db.messages.unshift(newMessage);
    if (db.stats) db.stats.comments = (db.stats.comments || 0) + 1;

    await writeDB(db);

    res.status(200).json({ message: 'Thank you for reaching out! Your message has been sent successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process contact form submission' });
  }
});

// Record Page View
app.post('/api/stats/view', async (req, res) => {
  try {
    const db = await readDB();
    if (!db.stats) db.stats = { views: 0, tutorials: 80, comments: 284, earnings: 7842 };
    db.stats.views = (db.stats.views || 0) + 1;
    await writeDB(db);
    res.json({ views: db.stats.views });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record view' });
  }
});

// Get Admin Stats
app.get('/api/stats', authenticateAdmin, async (req, res) => {
  try {
    const db = await readDB();
    res.json({
      stats: db.stats || { views: 0, tutorials: 0, comments: 0, earnings: 0 },
      recentMessages: db.messages ? db.messages.slice(0, 10) : [],
      usersCount: db.users ? db.users.length : 0,
      coursesCount: db.courses ? db.courses.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

app.listen(PORT, async () => {
  await readDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
