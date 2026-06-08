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
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// In-memory cache for db.json
let dbCache = null;
let dbQueue = Promise.resolve();

// Helper function to read database
const readDB = async () => {
    if (dbCache) return dbCache;
    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = { users: [], courses: [], contacts: [] };
            return dbCache;
        }
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        return dbCache;
    } catch (error) {
        console.error('Error reading DB:', error);
        return { users: [], courses: [], contacts: [] };
    }
};

// Helper function to write to database with queue to prevent corruption
const writeDB = (data) => {
    dbCache = data;
    dbQueue = dbQueue.then(async () => {
        try {
            await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('Error writing DB:', error);
        }
    });
    return dbQueue;
};

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const db = await readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: Date.now(),
        name,
        email,
        password: hashedPassword,
        role: role || 'user'
    };

    db.users.push(newUser);
    await writeDB(db);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// Courses endpoint
app.get('/api/courses', async (req, res) => {
    const db = await readDB();
    res.json(db.courses || []);
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();

    const newContact = {
        id: Date.now(),
        firstName,
        lastName,
        email,
        message,
        date: new Date().toISOString()
    };

    if (!db.contacts) db.contacts = [];
    db.contacts.push(newContact);
    await writeDB(db);

    res.status(201).json({ message: 'Message sent successfully' });
});

// Stats endpoint for Dashboard
app.get('/api/stats', async (req, res) => {
    const db = await readDB();
    const stats = {
        users: db.users.length,
        courses: db.courses.length,
        contacts: db.contacts ? db.contacts.length : 0
    };
    res.json(stats);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
