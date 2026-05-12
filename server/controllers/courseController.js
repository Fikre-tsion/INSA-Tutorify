const { readDB, writeDB } = require('../models/db');

exports.getAllCourses = (req, res) => {
    const db = readDB();
    res.json(db.courses);
};

exports.enroll = (req, res) => {
    const { courseId } = req.body;
    const db = readDB();

    const enrollment = {
        userId: req.user.id,
        courseId,
        enrolledAt: new Date().toISOString()
    };

    if (db.enrollments.find(e => e.userId === req.user.id && e.courseId === courseId)) {
        return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    db.enrollments.push(enrollment);
    writeDB(db);
    res.json({ message: 'Enrolled successfully' });
};

exports.getMyCourses = (req, res) => {
    const db = readDB();
    const userEnrollments = db.enrollments.filter(e => e.userId === req.user.id);
    const enrolledCourses = db.courses.filter(c => userEnrollments.find(e => e.courseId === c.id));
    res.json(enrolledCourses);
};
