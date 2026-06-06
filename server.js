const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Helper function to read database
const readDB = async () => {
    if (!fs.existsSync(DB_FILE)) {
        return { users: [], courses: [], contacts: [] };
    }
    const data = await fs.promises.readFile(DB_FILE, 'utf8');
    try {
        return JSON.parse(data);
    } catch (error) {
        console.error("Error parsing database file:", error);
        throw new Error("Database corruption detected. Please check db.json.");
    }
};

// Simple promise-based queue to ensure atomic writes
let dbQueue = Promise.resolve();

// Helper function to write to database
const writeDB = async (data) => {
    dbQueue = dbQueue.then(async () => {
        try {
            await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error("Database write error:", error);
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
    const db = await readDB();

    const user = db.users.find(u => u.email === email && u.role === role);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email, password or role' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        // Fallback for initial placeholder users if needed, but we'll re-register them or just use hashed passwords
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

// Stats endpoint
app.get('/api/stats', async (req, res) => {
    const db = await readDB();
    const stats = {
        profileViews: "1,504", // Placeholder as it's not tracked yet
        tutorials: (db.courses || []).length,
        comments: "284", // Placeholder
        earnings: "7,842", // Placeholder
        usersCount: (db.users || []).length,
        contactsCount: (db.contacts || []).length
    };
    res.json(stats);
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const db = await readDB();

    const newContact = {
        id: (db.contacts || []).length + 1,
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
