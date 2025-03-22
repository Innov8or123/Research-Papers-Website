const pool = require('../config/db');

const Student = {
    // Table schema (for reference, create manually in MySQL)
    schema: `
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            firstName VARCHAR(255) NOT NULL,
            lastName VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            department VARCHAR(255) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,

    // Method to get all research links (assuming a separate research_links table)
    getAllResearchLinks: async () => {
        try {
            const [rows] = await pool.execute('SELECT * FROM research_links');
            return rows;
        } catch (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    },

    // Method to get student profile
    getProfile: async (userId) => {
        try {
            const [rows] = await pool.execute('SELECT firstName, lastName, email, department FROM students WHERE id = ?', [userId]);
            if (rows.length === 0) throw new Error('Student not found');
            return rows[0];
        } catch (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    },
};

module.exports = Student;