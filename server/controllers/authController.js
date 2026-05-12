const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../models/db');

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    const db = readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Security: Only allow self-registration as 'user'
    const finalRole = role === 'admin' ? 'user' : role;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: Date.now(),
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: finalRole,
        createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);
    res.status(201).json({ message: 'User registered successfully' });
};

exports.login = async (req, res) => {
    const { email, password, role } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.email === email.toLowerCase() && u.role === role);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
    );

    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
};
