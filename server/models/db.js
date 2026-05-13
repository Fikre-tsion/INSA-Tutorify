const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../data/db.json');

const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        return { users: [], courses: [], enrollments: [], contacts: [] };
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
};

const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

module.exports = { readDB, writeDB };
