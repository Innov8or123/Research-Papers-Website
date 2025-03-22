const pool = require('../config/db');

const Publication = {
    // Insert a single publication
    insertPublication: async (publicationData) => {
        try {
            const [result] = await pool.execute(
                'INSERT INTO publications (title, type_of_paper, conference_or_journal_name, issn_isbn_number, author_type, doi, year_of_publication, publisher_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    publicationData.title,
                    publicationData.type_of_paper,
                    publicationData.conference_or_journal_name,
                    publicationData.issn_isbn_number || null,
                    publicationData.author_type,
                    publicationData.doi || null,
                    publicationData.year_of_publication,
                    publicationData.publisher_name,
                ]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    },

    // Bulk insert for multiple publications
    bulkInsertPublications: async (publications) => {
        try {
            const values = publications.map(pub => [
                pub.title,
                pub.type_of_paper,
                pub.conference_or_journal_name,
                pub.issn_isbn_number || null,
                pub.author_type,
                pub.doi || null,
                pub.year_of_publication,
                pub.publisher_name,
            ]);
            const [result] = await pool.query(
                'INSERT INTO publications (title, type_of_paper, conference_or_journal_name, issn_isbn_number, author_type, doi, year_of_publication, publisher_name) VALUES ?',
                [values]
            );
            return result.affectedRows;
        } catch (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    },
};

module.exports = Publication;