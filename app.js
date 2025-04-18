const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const multer = require('multer');
const cors = require('cors');

dotenv.config();

const AppError = require('./utils/appError');
const studentRouter = require('./routes/studentRoutes');
const teacherRouter = require('./routes/teacherRoutes');
const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/adminRoutes');
const userModel = require('./models/userModel'); 
const { ensureAuthenticated } = require('./middleware/authMiddleware');
const { validateCsrfToken } = require('./middleware/csrfMiddleware');
// const { error } = require('console');

const app = express();

// Validate env variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'SESSION_SECRET', 'PORT'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

app.use('/admin/upload-publications', (req, res, next) => {
    if (req.headers['content-type']?.startsWith('multipart/form-data')) {
      return next();
    }
    express.json()(req, res, next);
  });

//   app.use('/admin/upload-publications', (req, res, next) => {
//     console.log('Request received. Raw headers:', req.rawHeaders);
//     req.on('data', chunk => console.log('Received chunk:', chunk.length));
//     req.on('end', () => console.log('Request ended'));
//     next();
//   });

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true 
}));

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
app.use(fileUpload());
app.use(helmet());
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
        max: 100,
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
app.get('/get-csrf-token', (req, res) => {
    res.json({ csrfToken: req.session.csrfToken });
});

// Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/publications', ensureAuthenticated, async (req, res, next) => {
    try {
        let query;
        let totalQuery;
        const role = req.query.role || req.session.user?.role; 
        const searchTerm = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        if (!role) {
            return next(new AppError('User role not found in session.', 403));
        }

        if (role === 'student') {
            query = `SELECT * FROM publications${searchTerm ? ` WHERE title LIKE ? OR conference_or_journal_name LIKE ? OR publisher_name LIKE ? OR faculty_name LIKE ?` : ''} LIMIT ? OFFSET ?`;
            totalQuery = `SELECT COUNT(*) as total FROM publications${searchTerm ? ` WHERE title LIKE ? OR conference_or_journal_name LIKE ? OR publisher_name LIKE ? OR faculty_name LIKE ?` : ''}`;
            const params = searchTerm ? [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, limit, offset] : [limit, offset];
            var [publications] = await pool.query(query, params);
            var [[{ total }]] = await pool.query(totalQuery, searchTerm ? params.slice(0, 4) : []);
        } else if (role === 'teacher') {
            const teacherId = req.session.user?.id;
            if (!teacherId) {
                return next(new AppError('Teacher ID not found in session.', 403));
            }
            query = `SELECT * FROM publications WHERE teacherId = ?${searchTerm ? ` AND title LIKE ?` : ''} LIMIT ? OFFSET ?`;
            totalQuery = `SELECT COUNT(*) as total FROM publications WHERE teacherId = ?${searchTerm ? ` AND title LIKE ?` : ''}`;
            const params = searchTerm ? [teacherId, `%${searchTerm}%`, limit, offset] : [teacherId, limit, offset];
            var [publications] = await pool.query(query, params);
            var [[{ total }]] = await pool.query(totalQuery, searchTerm ? [teacherId, `%${searchTerm}%`] : [teacherId]);
        } else {
            return next(new AppError('Unauthorized role for this endpoint.', 403));
        }

        res.json({
            status: 'success',
            results: publications.length,
            data: {
                publications
            },
            pagination: {
                page,
                itemsPerPage: limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching publications:', err); 
        return next(new AppError(`Failed to fetch publications: ${err.message}`, 500));
    }
});

app.get('/profile', ensureAuthenticated, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const user = await userModel.findUserById(userId);
        if (!user) {
            return next(new AppError('User not found.', 404));
        }
        res.json(user);
    } catch (err) {
        return next(new AppError('Failed to fetch profile.', 500));
    }
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

app.post('/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
      if (err) {
          return next(new AppError(err.message, 500));
      }
      if (!user) {
          return res.status(401).json({ message: info.message || 'Invalid credentials' });
      }
      req.logIn(user, (err) => {
          if (err) {
              return next(new AppError(err.message, 500));
          }
          return res.status(200).json({ message: 'Login successful', redirect: '/profile.html' });
      });
  })(req, res, next);
});

app.post('/auth/signup', async (req, res, next) => {
  try {
    // 1. Check if passwords match
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // 3. Create new user
    const newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password, 
      role: req.body.role,
      department: req.body.department
    });

    // 4. log in new user
    req.login(newUser, (err) => {
      if (err) {
        return next(new AppError(err.message, 500));
      }
      return res.status(201).json({ 
        message: 'Signup successful', 
        redirect: '/publications.html' 
      });
    });

  } catch (err) {
    return next(new AppError(err.message, 500));
  }
});

// Global Error Handling Middleware

// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     const status = err.statusCode || 500;
//     res.status(status).json({
//         message: err.message || 'Something went wrong!',
//         status: 'error',
//     });
// });

// // 404 Handler
// 1)
// app.use((req, res, next) => {
//     res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
// });

// 2)
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//3)
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong!';
    //website ? HTML : json
    const acceptsHTML = req.accepts(['html', 'json']) === 'html';
    //a. if client acc html
    if (acceptsHTML || !req.path.startsWith('/')) {
        res.status(statusCode).sendFile(path.join(__dirname, 'public', statusCode === 404 ? '404.html' : '500.html'));
    } else {
        // b.if client accepts json 
        res.status(statusCode).json({
            message,
            status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
        });
    }
});

module.exports = app;