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

        const { xp_increment, shield_increment, ...otherUpdates } = updates;
        if (xp_increment) {
            db.users[index].xp = (db.users[index].xp || 0) + xp_increment;
        }
        if (shield_increment) {
            db.users[index].shieldCount = (db.users[index].shieldCount || 0) + shield_increment;
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

        // Handle Streak Update
        const today = new Date().toISOString().split('T')[0];
        const last = db.users[index].lastActivity ? db.users[index].lastActivity.split('T')[0] : "";

        if (last !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (last === yesterdayStr) {
                db.users[index].streak += 1;
            } else {
                // Check for Streak Freeze (Shield)
                if (db.users[index].shieldCount > 0 && last !== "") {
                   db.users[index].shieldCount -= 1;
                   db.users[index].streak += 1;
                } else {
                   db.users[index].streak = 1;
                }
            }
            db.users[index].lastActivity = new Date().toISOString();
            if (db.users[index].streak > (db.users[index].bestStreak || 0)) {
                db.users[index].bestStreak = db.users[index].streak;
            }
        }

        writeDB(db);
        return { xp: db.users[index].xp, streak: db.users[index].streak };
    }
};

module.exports = UserService;
