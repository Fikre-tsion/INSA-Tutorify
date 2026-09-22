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

// In-memory cache for fast, non-blocking database access
let dbCache = null;

// Performance Optimization: Asynchronous non-blocking database read with in-memory caching.
// Eliminates repetitive synchronous disk reads (`fs.readFileSync`) which block the Node.js event loop during high concurrent requests.
const readDB = async () => {
    if (dbCache) {
        return dbCache;
    }
    try {
        const data = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(data);
        return dbCache;
    } catch (err) {
        if (err.code === 'ENOENT') {
            dbCache = { users: [] };
            return dbCache;
        }
        throw err;
    }
};

// Performance Optimization: Asynchronous non-blocking database write.
// Updates the in-memory cache instantly and performs asynchronous disk persistence using `fs.promises.writeFile`.
const writeDB = async (data) => {
    dbCache = data;
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Register endpoint
app.post('/api/register', async (req, res, next) => {
    try {
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

        const updatedUsers = [...db.users, newUser];
        await writeDB({ ...db, users: updatedUsers });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        next(error);
    }
});

// Login endpoint
app.post('/api/login', async (req, res, next) => {
    try {
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
    } catch (error) {
        next(error);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
