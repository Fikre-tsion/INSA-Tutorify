const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { hasRole } = require('../middleware/roleCheck');

router.get('/stats', authenticateToken, hasRole(['admin']), adminController.getStats);

module.exports = router;
