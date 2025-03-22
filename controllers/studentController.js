const Student = require('../models/studentModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');


exports.getAllResearchLinks = catchAsync(async (req, res, next) => {
    try {
        const links = await Student.getAllResearchLinks();
        res.status(200).json(links);
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

exports.getProfile = catchAsync(async (req, res, next) => {
    try {
        if (!req.session.user) {
            return next(new AppError('Unauthorized. Please log in.', 401));
        }
        const profile = await Student.getProfile(req.session.user.id);
        res.status(200).json(profile);
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});