const multer = require('multer');
const AppError = require('../utils/appError');

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError('Only Excel files (.xlsx, .xls) files are allowed!', 400), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
        parts: 5
    }
});

module.exports = upload;