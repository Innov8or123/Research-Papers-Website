const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publicationController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.get('/publications', ensureAuthenticated, publicationController.getPublications);

module.exports = router;