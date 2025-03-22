const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware'); 
router.get(
    '/links',
    authMiddleware.ensureAuthenticated,
    authMiddleware.ensureRole(['student']),
    studentController.getAllResearchLinks
);
router.get(
    '/profile',
    authMiddleware.ensureAuthenticated,
    authMiddleware.ensureRole(['student']),
    studentController.getProfile
);

module.exports = router;