const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');

const signup = catchAsync(async (req, res, next) => {
    const { firstName, lastName, email, password, role, department } = req.body;

    if (!firstName || !lastName || !email || !password || !role || !department) {
        return next(new AppError('All fields are required.', 400));
    }

    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
        return next(new AppError('Email already exists.', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await userModel.createUser({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        department,
    });

    req.session.user = { id: userId, email, role };
    res.status(201).json({ message: 'User created successfully.' });
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password.', 400));
    }

    const user = await userModel.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) { 
        return next(new AppError('Invalid email or password.', 401));
    }

    req.session.user = { id: user.id, role: user.role };

    // Redirect
    if (user.role === 'admin') {
        return res.redirect('/admin.html');
    } else if (user.role === 'teacher' || user.role === 'student') {
        return res.redirect('/publications.html');
    } else {
        return res.redirect('/index.html'); 
    }
});
const getRole = catchAsync(async (req, res, next) => {
    if (!req.session.user) {
        return next(new AppError('Unauthorized. Please log in.', 401));
    }
    res.status(200).json({ role: req.session.user.role });
});

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to log out' });
        }
        res.redirect('/login.html');
    });
};

const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new AppError('Email is required.', 400));
    }

    const user = await userModel.findUserByEmail(email);
    if (!user) {
        return next(new AppError('No user found with that email address.', 404));
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); 

    await userModel.updateResetToken(email, resetToken, resetTokenExpiry);

    const resetUrl = `${process.env.APP_URL}/reset-password.html?token=${resetToken}`;
    const message = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.`;

    try {
        await sendEmail({
            email: email,
            subject: 'Password Reset Request - ResearchHub',
            message: message,
        });
        res.status(200).json({ message: 'Password reset email sent successfully.' });
    } catch (error) {
        await userModel.updateResetToken(email, null, null);
        return next(new AppError('Error sending the email. Please try again later.', 500));
    }
});

const resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        return next(new AppError('Password and confirm password are required.', 400));
    }

    if (password !== confirmPassword) {
        return next(new AppError('Passwords do not match.', 400));
    }

    const user = await userModel.findUserByResetToken(token);
    if (!user) {
        return next(new AppError('Invalid or expired reset token.', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userModel.updatePassword(user.id, hashedPassword);

    res.status(200).json({ message: 'Password reset successfully.' });
});

module.exports = { signup, login, getRole, logout, forgotPassword, resetPassword };