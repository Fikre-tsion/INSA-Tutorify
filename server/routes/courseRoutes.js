const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/auth');
const { hasRole } = require('../middleware/roleCheck');

// Public routes
router.get('/', courseController.getAllCourses);

// Student routes
router.get('/my-courses', authenticateToken, courseController.getMyCourses);
router.post('/enroll', authenticateToken, courseController.enroll);

// Teacher/Admin routes
router.get('/teacher', authenticateToken, hasRole(['teacher', 'admin']), courseController.getTeacherCourses);
router.post('/', authenticateToken, hasRole(['teacher', 'admin']), courseController.createCourse);
router.put('/:id', authenticateToken, hasRole(['teacher', 'admin']), courseController.updateCourse);
router.delete('/:id', authenticateToken, hasRole(['teacher', 'admin']), courseController.deleteCourse);

module.exports = router;
