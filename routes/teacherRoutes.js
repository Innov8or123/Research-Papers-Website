const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authMiddleware = require('../middleware/authMiddleware'); 

router.get(
    '/papers',
     authMiddleware.ensureAuthenticated,
     authMiddleware.ensureRole(['teacher', 'admin']),
     teacherController.getSubmittedPapers
    );
router.post(
    '/submit-link',
     authMiddleware.ensureAuthenticated,
     authMiddleware.ensureRole(['teacher', 'admin']),
     teacherController.submitPaper
    );
router.get(
    '/profile',
     authMiddleware.ensureAuthenticated,
     authMiddleware.ensureRole(['teacher', 'admin']),
     teacherController.getProfile
    );

module.exports = router;