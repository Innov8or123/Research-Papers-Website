const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const publicationController = require('../controllers/publicationController');
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');
const upload = require('../config/multer');
const validateCsrfToken = require('../middleware/csrfMiddleware');

router.post(
    '/upload-publications',
    ensureAuthenticated,
    ensureRole(['admin']),
    publicationController.uploadPublications
);

router.get(
    '/users',
    ensureAuthenticated,
    ensureRole(['admin']),
    adminController.getAllUsers
);

router.delete(
    '/users/:id',
    ensureAuthenticated,
    ensureRole(['admin']),
    adminController.deleteUser
);

router.get(
    '/publications',
    ensureAuthenticated,
    ensureRole(['admin']),
    adminController.getAllPublications
);

router.delete(
    '/publications/:id',
    ensureAuthenticated,
    ensureRole(['admin']),
    adminController.deletePublication
);

module.exports = router;