const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const asyncWrapper = require('../utils/asyncWrapper');
const { validate, registerValidationRules, loginValidationRules } = require('../middleware/validate');

router.post('/register', registerValidationRules, validate, asyncWrapper(authController.register));
router.post('/login', loginValidationRules, validate, asyncWrapper(authController.login));

module.exports = router;
