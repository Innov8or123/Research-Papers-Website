const pool = require('../config/db');

const Teacher = {
    // Table schema (for reference, create manually in MySQL)
    schema: `
        CREATE TABLE IF NOT EXISTS teachers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            firstName VARCHAR(255) NOT NULL,
            lastName VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            department VARCHAR(255) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,

    // Table schema for papers
    papersSchema: `
        CREATE TABLE IF NOT EXISTS papers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            url VARCHAR(2048) NOT NULL,
            date DATE NOT NULL,
            teacherId INT NOT NULL,
            FOREIGN KEY (teacherId) REFERENCES teachers(id)
        )
    `,

    // Method to get all research links submitted by the teacher
    getSubmittedPapers: async (teacherId) => {
        try {
            const [rows] = await pool.execute('SELECT * FROM papers WHERE teacherId = ?', [teacherId]);
            return rows;
        } catch (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    },

    // Method to submit a new paper
    submitPaper: async (teacherId, title, url) => {
        try {
            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const [result] = await pool.execute(
                'INSERT INTO papers (title, url, date, teacherId) VALUES (?, ?, ?, ?)',
                [title, url, date, teacherId]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    },

    // Method to get teacher profile
    getProfile: async (userId) => {
        try {
            const [rows] = await pool.execute('SELECT firstName, lastName, email, department FROM teachers WHERE id = ?', [userId]);
            if (rows.length === 0) throw new Error('Teacher not found');
            return rows[0];
        } catch (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    },
};

module.exports = Teacher;