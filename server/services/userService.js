const { readDB, writeDB } = require('../models/db');

const UserService = {
    getUserById(id) {
        const db = readDB();
        return db.users.find(u => u.id === id);
    },

    updateUser(id, updates) {
        const db = readDB();
        const index = db.users.findIndex(u => u.id === id);
        if (index === -1) return null;

        const { xp_increment, ...otherUpdates } = updates;
        if (xp_increment) {
            db.users[index].xp = (db.users[index].xp || 0) + xp_increment;
        }

        db.users[index] = { ...db.users[index], ...otherUpdates, id };
        writeDB(db);
        return db.users[index];
    },

    addXP(id, amount) {
        const db = readDB();
        const index = db.users.findIndex(u => u.id === id);
        if (index === -1) return null;

        db.users[index].xp = (db.users[index].xp || 0) + amount;
        writeDB(db);
        return db.users[index].xp;
    }
};

module.exports = UserService;
