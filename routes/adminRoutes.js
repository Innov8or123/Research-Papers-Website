const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const publicationController = require('../controllers/publicationController');
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');
const upload = require('../config/multer');
const validateCsrfToken = require('../middleware/csrfMiddleware');

router.post('/upload-debug', (req, res) => {
    console.log('Headers:', req.headers);

    // debug ends here not going forward 
    //chunks and all not workig ???
    
    const chunks = [];
    req.on('data', chunk => {
      chunks.push(chunk);
      console.log('Received chunk:', chunk.length, 'bytes');
    });
    
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      require('fs').writeFileSync('debug_upload.bin', buffer);
      console.log('Total received:', buffer.length, 'bytes');
      res.send('Debug completed - file saved');
    });
  });

router.post(
    '/upload-publications', 
    ensureAuthenticated, 
    ensureRole(['admin']), 
    upload.single('file'), 
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