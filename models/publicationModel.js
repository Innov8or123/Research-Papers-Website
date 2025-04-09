const pool = require('../config/db');

const Publication = {
    insertPublication: async (publicationData) => {
        try {
            const [result] = await pool.execute(
                `INSERT INTO publications (
                    title, 
                    type_of_paper, 
                    conference_or_journal_name, 
                    issn_isbn_number, 
                    author_type, 
                    author_id, 
                    doi, 
                    year_of_publication, 
                    publisher_name,
                    faculty_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    publicationData.title,
                    publicationData.type_of_paper,
                    publicationData.conference_or_journal_name,
                    publicationData.issn_isbn_number || null,
                    publicationData.author_type,
                    publicationData.author_id,
                    publicationData.doi || null,
                    publicationData.year_of_publication,
                    publicationData.publisher_name,
                    publicationData.faculty_name
                ]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    },

    getPublicationsByAuthor: async (authorId) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM publications WHERE author_id = ? ORDER BY created_at DESC',
                [authorId]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching publications:', error);
            throw new Error(`Database error: ${error.message}`);
        }
    },

    bulkInsertPublications: async (publications) => {
        try {
            const values = publications.map(pub => [
                pub.title,
                pub.type_of_paper,
                pub.conference_or_journal_name,
                pub.issn_isbn_number || null,
                pub.author_type,
                pub.author_id,
                pub.doi || null,
                pub.year_of_publication,
                pub.publisher_name,
                pub.faculty_name
            ]);
            const [result] = await pool.query(
                'INSERT INTO publications (title, type_of_paper, conference_or_journal_name, issn_isbn_number, author_type, author_id, doi, year_of_publication, publisher_name, faculty_name) VALUES ?',
                [values]
            );
            return result.affectedRows;
        } catch (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    },
};

module.exports = Publication;