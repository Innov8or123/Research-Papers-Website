const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController'); 
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');

router.post(
    '/submit-publication',
    ensureAuthenticated,
    ensureRole(['teacher']),
    teacherController.submitPublication
);

router.get(
    '/publications',
    ensureAuthenticated,
    ensureRole(['teacher']),
    teacherController.getSubmittedPublications
);

module.exports = router;