const pool = require('../config/db'); 
const userModel = require('../models/userModel'); 
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Publication = require('../models/publicationModel');

const submitPublication = catchAsync(async (req, res) => {
    const {
        title,
        url,
        date,
        type,
        journalName,
        isbn,
        authorType,
        publisher,
        faculty
    } = req.body;

    // Validate 
    if (!title || !url || !date || !type || !journalName || !authorType || !publisher || !faculty) {
        return res.status(400).json({ 
            message: 'All required fields must be provided.' 
        });
    }

    const publicationData = {
        title,
        type_of_paper: type,
        conference_or_journal_name: journalName,
        issn_isbn_number: isbn || null,
        author_type: authorType,
        author_id: req.user.id, 
        doi: url,
        year_of_publication: new Date(date).getFullYear(),
        publisher_name: publisher,
        faculty_name: faculty
    };

    try {
        const insertId = await Publication.insertPublication(publicationData);
        res.status(201).json({ 
            message: 'Publication submitted successfully', 
            id: insertId 
        });
    } catch (error) {
        console.error('Error submitting publication:', error);
        res.status(500).json({ 
            message: 'Failed to submit publication. Please try again.' 
        });
    }
});


// Fetch submitted publications
const getSubmittedPublications = catchAsync( async (req, res) => {
    try {
        const publications = await Publication.getPublicationsByAuthor(req.user.id);
        res.json(publications);
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

module.exports = { getSubmittedPublications, submitPublication, getProfile };
