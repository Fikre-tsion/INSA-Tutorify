const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/stats', authenticateToken, isAdmin, adminController.getStats);

module.exports = router;
