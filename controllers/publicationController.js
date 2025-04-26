const ExcelJS = require('exceljs');
const Publication = require('../models/publicationModel');
const AppError = require('../utils/appError');
const pool = require('../config/db');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.Console(),
    ],
});

const uploadPublications = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('No file uploaded.', 400));
        }

        // Parse the Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];
        if (!worksheet || worksheet.rowCount <= 1) {
            return next(new AppError('Empty or invalid Excel file.', 400));
        }

        const data = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return;
            data.push({
                title: row.getCell(2).value, 
                type_of_paper: row.getCell(3).value, 
                conference_or_journal_name: row.getCell(4).value, 
                issn_isbn_number: row.getCell(5).value, 
                author_type: row.getCell(6).value, 
                doi: row.getCell(7).value, 
                year_of_publication: row.getCell(8).value, 
                publisher_name: row.getCell(9).value, 
                faculty_name: row.getCell(10).value, 
            });
        });
        if (data.length === 0) {
            return next(new AppError('No data found in Excel file after header.', 400));
        }

        // Map and validate data
        const publications = await Promise.all(data.map(async (row, index) => {
            const rowIndex = index + 2;
            if (!row.title || !row.type_of_paper || !row.conference_or_journal_name || 
                !row.author_type || !row.year_of_publication || !row.publisher_name) {
                throw new AppError(`Missing required fields in row ${rowIndex}.`, 400);
            }

            // Validate year of publication
            let year;
            if (row.year_of_publication instanceof Date) {
                year = row.year_of_publication.getFullYear();
            } else {
                year = parseInt(row.year_of_publication);
            }
            if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
                throw new AppError(`Invalid year of publication in row ${rowIndex}: ${row.year_of_publication}`, 400);
            }

            return {
                title: row.title,
                type_of_paper: mapTypeOfPaper(row.type_of_paper),
                conference_or_journal_name: row.conference_or_journal_name,
                issn_isbn_number: row.issn_isbn_number || null,
                author_type: row.author_type?.toLowerCase() === 'principal author' ? 'principal_author' : 'co_author',
                doi: row.doi?.text || row.doi?.hyperlink || null,
                year_of_publication: year,
                publisher_name: row.publisher_name,
                author_id: req.session.user.id || null,
                faculty_name: row.faculty_name
            };
        }));

        // Bulk insert
        const affectedRows = await Publication.bulkInsertPublications(publications);
        res.status(201).json({ message: `Successfully inserted ${affectedRows} publications.` });
    } catch (error) {
        return next(new AppError(`Error processing Excel file: ${error.message}`, 500));
    }
};

const getPublications = async (req, res) => {
    try {
        const [publications] = await pool.query(`
            SELECT 
                p.*,
                u.first_name,
                u.last_name
            FROM publications p
            JOIN users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.json({
            success: true,
            publications
        });
    } catch (error) {
        logger.error('Error fetching publications', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch publications'
        });
    }
};

const mapTypeOfPaper = (type) => {
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
        case 'faculty publication journals':
            return 'faculty_publication_journal';
        case 'faculty publications conference':
            return 'faculty_publication_conference';
        case 'book chapter publications':
            return 'book_chapter_publication';
        case 'research proposals':
            return 'research_proposal';
        case 'student publications':
            return 'student_publication';
        default:
            throw new Error(`Invalid type of paper: ${type}`);
    }
};

module.exports = { uploadPublications, getPublications };