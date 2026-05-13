const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const { authenticateToken } = require('../middleware/auth');

router.get('/profile', authenticateToken, (req, res) => {
    const user = UserService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
});

router.put('/profile', authenticateToken, (req, res) => {
    const updatedUser = UserService.updateUser(req.user.id, req.body);
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
});

module.exports = router;
