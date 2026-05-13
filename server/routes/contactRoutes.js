const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { validate, contactValidationRules } = require('../middleware/validate');

router.post('/', contactValidationRules, validate, contactController.submitContact);

module.exports = router;
