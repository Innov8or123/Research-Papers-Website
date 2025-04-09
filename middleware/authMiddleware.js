const AppError = require('../utils/appError');

const ensureAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return next(new AppError('Unauthorized. Please log in.', 401));
    }
    req.user = req.session.user;
    next();
};

const ensureRole = (roles) => (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
        return next(new AppError('Forbidden. Insufficient permissions.', 403));
    }
    next();
};

module.exports = { ensureAuthenticated, ensureRole };