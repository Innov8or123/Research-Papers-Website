const pool = require('../config/db');
const userModel = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

const getAllResearchLinks = catchAsync(async (req, res, next) => {
    try {
        let query = 'SELECT * FROM publications';
        const features = new APIFeatures(query, req.query)
            .filterBySearch()
            .paginate();
        const [links] = await pool.query(features.query);
        const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM publications' + (req.query.search ? ` WHERE title LIKE '%${req.query.search}%' OR conference_or_journal_name LIKE '%${req.query.search}%' OR publisher_name LIKE '%${req.query.search}%'` : ''));

        res.status(200).json({
            status: 'success',
            results: links.length,
            data: {
                publications: links
            },
            pagination: {
                page: parseInt(req.query.page) ||  ascended,
                page: 1,
                itemsPerPage: parseInt(req.query.limit) || 10,
                totalItems: total,
                totalPages: Math.ceil(total / (parseInt(req.query.limit) || 10))
            }
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

const getProfile = catchAsync(async (req, res, next) => {
    try {
        if (!req.session.user) {
            return next(new AppError('Unauthorized. Please log in.', 401));
        }
        const profile = await userModel.findUserById(req.session.user.id);
        if (!profile) {
            return next(new AppError('User not found.', 404));
        }
        res.status(200).json(profile);
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

module.exports = { getAllResearchLinks, getProfile };
