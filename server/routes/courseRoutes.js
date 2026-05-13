const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/auth');
const { hasRole } = require('../middleware/roleCheck');

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.get('/:id/reviews', courseController.getReviews);

// Student routes
router.get('/my-courses', authenticateToken, courseController.getMyCourses);
router.post('/enroll', authenticateToken, courseController.enroll);
router.get('/:id/progress', authenticateToken, courseController.getProgress);
router.post('/:id/progress', authenticateToken, courseController.updateProgress);
router.post('/:id/reviews', authenticateToken, courseController.addReview);
router.get('/:id/comments', authenticateToken, courseController.getComments);
router.post('/comments', authenticateToken, courseController.addComment);
router.post('/:id/like', authenticateToken, courseController.likeCourse);

// Teacher/Admin routes
router.get('/teacher', authenticateToken, hasRole(['teacher', 'admin']), courseController.getTeacherCourses);
router.post('/', authenticateToken, hasRole(['teacher', 'admin']), courseController.createCourse);
router.put('/:id', authenticateToken, hasRole(['teacher', 'admin']), courseController.updateCourse);
router.delete('/:id', authenticateToken, hasRole(['teacher', 'admin']), courseController.deleteCourse);

module.exports = router;
