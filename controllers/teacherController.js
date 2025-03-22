const Teacher = require('../models/teacherModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getSubmittedPapers = catchAsync( async (req, res, next) => {
    try {
        if (!req.session.user) {
            return next(new AppError('Unauthorized. Please log in.', 401));
        }
        const papers = await Teacher.getSubmittedPapers(req.session.user.id);
        res.status(200).json(papers);
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

exports.submitPaper = catchAsync( async (req, res, next) => {
    try {
        if (!req.session.user) {
            return next(new AppError('Unauthorized. Please log in.', 401));
        }
        const { title, url } = req.body;
        if (!title || !url) {
            return next(new AppError('Title and URL are required.', 400));
        }
        const paperId = await Teacher.submitPaper(req.session.user.id, title, url);
        res.status(201).json({ message: 'Paper submitted successfully', paperId });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

exports.getProfile = catchAsync( async (req, res, next) => {
    try {
        if (!req.session.user) {
            return next(new AppError('Unauthorized. Please log in.', 401));
        }
        const profile = await Teacher.getProfile(req.session.user.id);
        res.status(200).json(profile);
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});