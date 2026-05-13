const { readDB, writeDB } = require('../models/db');

exports.getCourseById = (req, res) => {
    const db = readDB();
    const course = db.courses.find(c => c.id === parseInt(req.params.id));
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
};

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

// Progress Tracking
exports.getProgress = (req, res) => {
    const db = readDB();
    const courseId = parseInt(req.params.id);
    const progress = db.progress.find(p => p.userId === req.user.id && p.courseId === courseId);
    res.json(progress || { completedLessons: [] });
};

exports.updateProgress = (req, res) => {
    const db = readDB();
    const courseId = parseInt(req.params.id);
    const { lessonId } = req.body;

    let progressIndex = db.progress.findIndex(p => p.userId === req.user.id && p.courseId === courseId);

    if (progressIndex === -1) {
        db.progress.push({
            userId: req.user.id,
            courseId: courseId,
            completedLessons: [parseInt(lessonId)]
        });
    } else {
        if (!db.progress[progressIndex].completedLessons.includes(parseInt(lessonId))) {
            db.progress[progressIndex].completedLessons.push(parseInt(lessonId));
        }
    }

    writeDB(db);
    res.json({ message: 'Progress updated' });
};

// Reviews
exports.getReviews = (req, res) => {
    const db = readDB();
    const courseId = parseInt(req.params.id);
    const reviews = db.reviews.filter(r => r.courseId === courseId);
    res.json(reviews);
};

exports.addReview = (req, res) => {
    const db = readDB();
    const courseId = parseInt(req.params.id);
    const { rating, comment } = req.body;

    const newReview = {
        id: Date.now(),
        userId: req.user.id,
        userName: req.user.name,
        courseId,
        rating: parseFloat(rating),
        comment,
        createdAt: new Date().toISOString()
    };

    db.reviews.push(newReview);

    // Update course average rating
    const courseReviews = db.reviews.filter(r => r.courseId === courseId);
    const avgRating = courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length;

    const courseIndex = db.courses.findIndex(c => c.id === courseId);
    if (courseIndex !== -1) {
        db.courses[courseIndex].rating = parseFloat(avgRating.toFixed(1));
        db.courses[courseIndex].reviewCount = courseReviews.length;
    }

    writeDB(db);
    res.status(201).json({ message: 'Review added', review: newReview });
};
