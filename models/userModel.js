// console.log('Loading userModel.js');
const pool = require('../config/db');

const createUser = async (userData) => {
    const { firstName, lastName, email, password, role, department } = userData;
    const [result] = await pool.query(
        'INSERT INTO users (firstName, lastName, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)',
        [firstName, lastName, email, password, role, department]
    );
    return result.insertId;
};

const findUserByEmail = async (email) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

const findUserById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
};

const updateResetToken = async (email, resetToken, resetTokenExpiry) => {
    await pool.query(
        'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
        [resetToken, resetTokenExpiry, email]
    );
};

const findUserByResetToken = async (resetToken) => {
    const [rows] = await pool.query(
        'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()',
        [resetToken]
    );
    return rows[0];
};

const updatePassword = async (userId, password) => {
    await pool.query(
        'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
        [password, userId]
    );
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    updateResetToken,
    findUserByResetToken,
    updatePassword,
};