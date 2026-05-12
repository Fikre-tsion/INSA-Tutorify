const { readDB, writeDB } = require('../models/db');

exports.submitContact = (req, res) => {
    const { name, email, message } = req.body;
    const db = readDB();

    const newContact = {
        id: Date.now(),
        name,
        email: email.toLowerCase(),
        message,
        receivedAt: new Date().toISOString()
    };

    db.contacts.push(newContact);
    writeDB(db);
    res.json({ message: 'Message sent successfully' });
};
