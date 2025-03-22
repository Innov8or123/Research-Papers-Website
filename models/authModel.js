const pool = require('../config/db');

const Auth = {
    createUser: async (userData) => {
        try {
            const [result] = await pool.execute(
                'INSERT INTO users (firstName, lastName, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)',
                [userData.firstName, userData.lastName, userData.email, userData.password, userData.role, userData.department]
            );
            return result;
        } catch (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    },

    findByEmail: async (email) => {
        try {
            const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    },
};

module.exports = Auth;