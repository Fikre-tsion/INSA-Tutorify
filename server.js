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

// In-memory DB cache to eliminate disk I/O on repeated reads
let dbCache = null;
let writeQueue = Promise.resolve();

// Performance Optimization: Asynchronous non-blocking database read with caching.
// Avoids synchronous fs.readFileSync which blocks the Node.js event loop under load.
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }
    try {
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            dbCache = { users: [] };
        } else {
            throw err;
        }
    }
    return dbCache;
};

// Performance Optimization: Asynchronous non-blocking serialized database write.
// Updates in-memory cache instantly and serializes disk writes asynchronously without blocking HTTP response handling.
const writeDB = async (data) => {
    dbCache = data;
    writeQueue = writeQueue.then(async () => {
        await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    }).catch(err => {
        console.error('Error writing DB asynchronously:', err);
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
