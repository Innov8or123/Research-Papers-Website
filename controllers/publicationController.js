const ExcelJS = require('exceljs');
const Publication = require('../models/publicationModel');
const AppError = require('../utils/appError');

exports.uploadPublications = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('No file uploaded.', 400));
        }

        // Parse the Excel file using exceljs
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];
        const data = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return;
            data.push({
                title: row.getCell(1).value,
                type_of_paper: row.getCell(2).value,
                conference_or_journal_name: row.getCell(3).value,
                issn_isbn_number: row.getCell(4).value,
                author_type: row.getCell(5).value,
                doi: row.getCell(6).value,
                year_of_publication: row.getCell(7).value,
                publisher_name: row.getCell(8).value,
            });
        });

        // Map and validate data
        const publications = data.map(row => ({
            title: row.title,
            type_of_paper: mapTypeOfPaper(row.type_of_paper),
            conference_or_journal_name: row.conference_or_journal_name,
            issn_isbn_number: row.issn_isbn_number,
            author_type: row.author_type?.toLowerCase() === 'principal author' ? 'principal_author' : 'co_author',
            doi: row.doi,
            year_of_publication: row.year_of_publication,
            publisher_name: row.publisher_name,
        }));

        for (const pub of publications) {
            if (!pub.title || !pub.type_of_paper || !pub.conference_or_journal_name || !pub.author_type || !pub.year_of_publication || !pub.publisher_name) {
                return next(new AppError('Missing required fields in Excel data.', 400));
            }
        }

        // Bulk insert into database
        const affectedRows = await Publication.bulkInsertPublications(publications);
        res.status(201).json({ message: `Successfully inserted ${affectedRows} publications.` });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
};

const mapTypeOfPaper = (type) => {
    switch (type?.toLowerCase()) {
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