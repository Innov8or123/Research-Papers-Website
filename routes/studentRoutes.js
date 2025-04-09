// console.log('Loading studentRoutes.js');
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');

router.get(
    '/links',
    ensureAuthenticated,
    ensureRole(['student']),
    studentController.getAllResearchLinks
);

router.get(
    '/profile',
    ensureAuthenticated,
    ensureRole(['student']),
    studentController.getProfile
);

module.exports = router;