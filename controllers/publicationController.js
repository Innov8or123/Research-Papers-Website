const ExcelJS = require('exceljs');
const Publication = require('../models/publicationModel');
const AppError = require('../utils/appError');
const pool = require('../config/db');

const uploadPublications = async (req, res, next) => {
    // const fs = require('fs');
    // const filePath = '/Users/vishruthshetty/Downloads/Book2.xlsx';
    // console.log('File exists:', fs.existsSync(filePath));
    // console.log('File readable:', fs.accessSync(filePath, fs.constants.R_OK));
    console.log('Raw request:', req.rawHeaders); 
    console.log('Request headers:', req.headers);
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file); 
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
        console.log('Parsed data:', data);

        if (data.length === 0) {
            return next(new AppError('No data found in Excel file.', 400));
        }

        // Map and validate data
        const publications = await Promise.all(data.map(async (row, index) => {
            const rowIndex = index + 2;
            if (!row.title || !row.type_of_paper || !row.conference_or_journal_name || 
                !row.author_type || !row.year_of_publication || !row.publisher_name) {
                throw new AppError(`Missing required fields in row ${rowIndex}.`, 400);
            }

            // Validate year of publication
            const year = parseInt(row.year_of_publication);
            if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
                throw new AppError(`Invalid year of publication in row ${rowIndex}: ${row.year_of_publication}`, 400);
            }

            return {
                title: row.title,
                type_of_paper: mapTypeOfPaper(row.type_of_paper),
                conference_or_journal_name: row.conference_or_journal_name,
                issn_isbn_number: row.issn_isbn_number || null,
                author_type: row.author_type?.toLowerCase() === 'principal author' ? 'principal_author' : 'co_author',
                doi: row.doi || null,
                year_of_publication: year,
                publisher_name: row.publisher_name,
                author_id: null,
            };
        }));
        console.log('Validated publications:', publications); 

        // Bulk insert
        const affectedRows = await Publication.bulkInsertPublications(publications);
        res.status(201).json({ message: `Successfully inserted ${affectedRows} publications.` });
    } catch (error) {
        console.error('Error details:', error.stack);
        return next(new AppError(`Error processing Excel file: ${error.message}`, 500));
    }
    console.log('Multer processed file:', {
        originalname: req.file?.originalname,
        mimetype: req.file?.mimetype,
        size: req.file?.size
      });
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

module.exports = { uploadPublications };
