const { readDB } = require('../models/db');

exports.getStats = (req, res) => {
    const db = readDB();
    res.json({
        totalUsers: db.users.length,
        totalCourses: db.courses.length,
        totalEnrollments: db.enrollments.length,
        totalContacts: db.contacts.length,
        recentUsers: db.users.slice(-5).reverse(),
        recentContacts: db.contacts.slice(-5).reverse()
    });
};
