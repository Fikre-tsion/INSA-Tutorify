const { readDB, writeDB } = require('../models/db');

const CourseService = {
    getAll(filters = {}) {
        const db = readDB();
        let courses = [...db.courses];
        if (filters.category) courses = courses.filter(c => c.category === filters.category);
        return courses;
    },

    getById(id) {
        const db = readDB();
        return db.courses.find(c => c.id === parseInt(id));
    },

    getEnrolled(userId) {
        const db = readDB();
        const userEnrollments = db.enrollments.filter(e => e.userId === userId);
        return db.courses.filter(c => userEnrollments.find(e => e.courseId === c.id));
    },

    enroll(userId, courseId) {
        const db = readDB();
        const cid = parseInt(courseId);
        if (db.enrollments.find(e => e.userId === userId && e.courseId === cid)) {
            throw new Error('Already enrolled');
        }
        db.enrollments.push({ userId, courseId: cid, enrolledAt: new Date().toISOString() });
        writeDB(db);
        return true;
    }
};

module.exports = CourseService;
