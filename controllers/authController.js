// const jwt = require('jsonwebtoken');
// const { promisify } = require('util');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Auth = require('../models/authModel');
const bcrypt = require('bcrypt');

exports.signup = catchAsync(async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, role, department } = req.body;
        if (!firstName || !lastName || !email || !password || !role || !department || !['admin', 'teacher', 'student'].includes(role)) {
            return next(new AppError('All fields are required, and role must be admin, teacher, or student.', 400));
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await Auth.createUser({ firstName, lastName, email, password: hashedPassword, role, department });
        req.session.user = { id: result.insertId, email, role };
        res.status(201).json({ message: 'User created successfully!' });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

exports.login = catchAsync(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new AppError('Email and password are required.', 400));
        }
        const user = await Auth.findByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return next(new AppError('Invalid email or password.', 401));
        }
        req.session.user = { id: user.id, email: user.email, role: user.role };
        res.status(200).json({ message: 'Login successful!' });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out.' });
        }
        res.status(200).json({ message: 'Logout successful!' });
    });
};
