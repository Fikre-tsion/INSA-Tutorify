const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', courseController.getAllCourses);
router.post('/enroll', authenticateToken, courseController.enroll);
router.get('/my-courses', authenticateToken, courseController.getMyCourses);

module.exports = router;
