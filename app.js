const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit'); 
const helmet = require('helmet');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();


const AppError = require('./utils/appError');
const studentRouter = require('./routes/studentRoutes');
const teacherRouter = require('./routes/teacherRoutes');
const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/adminRoutes');

const app = express();

// validate env variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'SESSION_SECRET', 'PORT'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

// Database Connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database');
        connection.release();
    } catch (err) {
        console.error('Error connecting to MySQL:', err); 
        process.exit(1);
    }
})();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet()); // Security headers
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: process.env.NODE_ENV === 'production' },
    })
);
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100, // Limit requests
    })
);

// Manual CSRF Protection Middleware
app.use((req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
});

// CSRF Validation Middleware for POST requests
const validateCsrfToken = (req, res, next) => {
    const token = req.body._csrf || req.headers['x-csrf-token'];
    if (!token || token !== req.session.csrfToken) {
        return next(new AppError('Invalid CSRF token.', 403));
    }
    next();
};

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.use('/auth', authRouter);
app.use('/students', studentRouter);
app.use('/teachers', teacherRouter);
app.use('/admin', adminRouter);

app.post('/contact', validateCsrfToken, async (req, res, next) => {
    const { name, email, message } = req.body;
    const date = new Date().toISOString().split('T')[0]; 

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.execute(
            'INSERT INTO messages (name, email, message, date) VALUES (?, ?, ?, ?)',
            [name, email, message, date]
        );
        connection.release();
        res.json({ message: 'Message sent successfully!' });
    } catch (err) {
        console.error('Error inserting message:', err);
        connection?.release();
        return next(new AppError('Error sending message.', 500));
    }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.statusCode || 500;
    res.status(status).json({
        message: err.message || 'Something went wrong!',
        status: 'error',
    });
});

// 404 Handler
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = app;