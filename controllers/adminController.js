const pool = require('../config/db');
const userModel = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const getAllUsers = catchAsync(async (req, res, next) => {
    try {
        const [users] = await pool.query('SELECT * FROM users');
        res.status(200).json({
            status: 'success',
            data: {
                users
            }
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

const deleteUser = catchAsync(async (req, res, next) => {
    try {
        const userId = req.params.id;
        const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user[0]) {
            return next(new AppError('User not found.', 404));
        }
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

const getAllPublications = catchAsync(async (req, res, next) => {
    try {
        const [publications] = await pool.query(`
            SELECT 
                p.id,
                p.title,
                p.doi as url,
                p.year_of_publication as date,
                p.author_id as teacherId,
                u.firstName as teacher_first_name,
                u.lastName as teacher_last_name,
                p.type_of_paper as type,
                p.conference_or_journal_name as journal,
                p.publisher_name as publisher,
                p.faculty_name as faculty_name
            FROM publications p
            JOIN users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.status(200).json({
            status: 'success',
            data: {
                publications
            }
        });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

const deletePublication = catchAsync(async (req, res, next) => {
    try {
        const publicationId = req.params.id;
        await pool.query('DELETE FROM publications WHERE id = ?', [publicationId]);
        res.status(200).json({ message: 'Publication deleted successfully.' });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

module.exports = { getAllUsers, deleteUser, getAllPublications, deletePublication };