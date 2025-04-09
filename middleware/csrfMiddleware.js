const AppError = require('../utils/appError');

const validateCsrfToken = (req, res, next) => {
    const token = req.body._csrf || req.headers['x-csrf-token'];
    if (!token || token !== req.session.csrfToken) {
        return next(new AppError('Invalid CSRF token.', 403));
    }
    next();
};

module.exports = { validateCsrfToken };