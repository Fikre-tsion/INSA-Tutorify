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

// Performance Optimization: In-memory DB cache and non-blocking asynchronous file operations.
// Eliminates blocking `readFileSync` disk access on every API request.
let dbCache = null;
let writeQueue = Promise.resolve();

/**
 * Asynchronously reads the database into an in-memory cache.
 * Subsequent reads serve directly from `dbCache` without blocking event loop disk I/O.
 */
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }
    try {
        if (!fs.existsSync(DB_FILE)) {
            dbCache = { users: [] };
            return dbCache;
        }
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        if (!dbCache.users) dbCache.users = [];
    } catch (err) {
        console.error('Error reading DB_FILE:', err);
        dbCache = { users: [] };
    }
    return dbCache;
};

/**
 * Asynchronously writes database data to disk using a serialized promise queue.
 * Keeps memory cache updated instantly for zero-latency subsequent reads.
 */
const writeDB = async (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(err => {
        console.error('Error in writeDB queue:', err);
    });
    return writeQueue;
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

// Warm up DB cache on startup
app.listen(PORT, () => {
    readDB().then(() => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});

module.exports = app;
