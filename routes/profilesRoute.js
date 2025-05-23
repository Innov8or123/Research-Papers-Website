const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.get('/profile', ensureAuthenticated, profileController.getProfile);

module.exports = router;