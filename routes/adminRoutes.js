const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publicationController');
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');
const upload = require('multer')({ storage: 'memory' }); // In-memory storage for file upload

router.post(
    '/upload-publications',
    ensureAuthenticated,
    ensureRole(['admin']),
    upload.single('file'),
    publicationController.uploadPublications
);

module.exports = router;