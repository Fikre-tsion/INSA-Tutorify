const { readDB, writeDB } = require('../models/db');

exports.getAllCourses = (req, res) => {
    const db = readDB();
    let courses = [...db.courses];

    // Filtering
    if (req.query.category) {
        courses = courses.filter(c => c.category === req.query.category);
    }

    // Sorting
    if (req.query.sort) {
        switch (req.query.sort) {
            case 'date':
                courses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'popularity':
                courses.sort((a, b) => b.popularity - a.popularity);
                break;
            case 'title':
                courses.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
    }

    res.json(courses);
};

exports.enroll = (req, res) => {
    const { courseId } = req.body;
    const db = readDB();

    const enrollment = {
        userId: req.user.id,
        courseId: parseInt(courseId),
        enrolledAt: new Date().toISOString()
    };

    if (db.enrollments.find(e => e.userId === req.user.id && e.courseId === parseInt(courseId))) {
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

// Teacher management
exports.getTeacherCourses = (req, res) => {
    const db = readDB();
    const courses = db.courses.filter(c => c.instructorId === req.user.id);
    res.json(courses);
};

exports.createCourse = (req, res) => {
    const { title, description, image, category } = req.body;
    const db = readDB();

    const newCourse = {
        id: Date.now(),
        title,
        description,
        image: image || 'https://via.placeholder.com/400x300?text=Course',
        category: category || 'General',
        createdAt: new Date().toISOString(),
        popularity: 0,
        instructorId: req.user.id
    };

    db.courses.push(newCourse);
    writeDB(db);
    res.status(201).json({ message: 'Course created successfully', course: newCourse });
};

exports.updateCourse = (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const index = db.courses.findIndex(c => c.id === parseInt(id));

    if (index === -1) return res.status(404).json({ message: 'Course not found' });

    // Check ownership
    if (db.courses[index].instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    db.courses[index] = { ...db.courses[index], ...req.body, id: parseInt(id) };
    writeDB(db);
    res.json({ message: 'Course updated successfully', course: db.courses[index] });
};

exports.deleteCourse = (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const course = db.courses.find(c => c.id === parseInt(id));

    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    db.courses = db.courses.filter(c => c.id !== parseInt(id));
    // Also cleanup enrollments
    db.enrollments = db.enrollments.filter(e => e.courseId !== parseInt(id));

    writeDB(db);
    res.json({ message: 'Course deleted successfully' });
};
