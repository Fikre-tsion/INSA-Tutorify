const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
    console.error('FATAL: JWT_SECRET environment variable is not set.');
    process.exit(1);
}

const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// DB write queue to prevent corruption
let dbQueue = Promise.resolve();

// Helper function to read database
const readDB = () => {
    try {
        if (!fs.existsSync(DB_FILE)) {
            return { users: [], contacts: [], courses: [] };
        }
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(data);
        if (!parsed.users) parsed.users = [];
        if (!parsed.contacts) parsed.contacts = [];
        if (!parsed.courses) parsed.courses = [];
        return parsed;
    } catch (err) {
        console.error("Error reading DB:", err);
        return { users: [], contacts: [], courses: [] };
    }
};

// Helper function to write to database
const writeDB = (data) => {
    dbQueue = dbQueue.then(() => {
        return fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8')
            .catch(err => console.error("Error writing DB:", err));
    });
    return dbQueue;
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const db = readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password: hashedPassword,
        role
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.email === email && u.role === role);
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

// Stats endpoint
app.get('/api/stats', (req, res) => {
    const db = readDB();
    res.json({
        users: db.users.length,
        courses: db.courses.length,
        contacts: db.contacts.length
    });
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = readDB();

    const newContact = {
        id: db.contacts.length + 1,
        firstName,
        lastName,
        email,
        message,
        date: new Date().toISOString()
    };

    db.contacts.push(newContact);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Courses endpoint
app.get('/api/courses', (req, res) => {
    const db = readDB();
    res.json(db.courses);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
