const pool = require('../config/db');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.Console(),
    ],
});

exports.getProfile = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const [user] = await pool.query(
            'SELECT id, firstName, lastName, email, role, department FROM users WHERE id = ?',
            [userId]
        );
        if (user.length === 0) {
            logger.warn('User not found', { userId });
            if (req.get('Accept').includes('application/json')) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(404).render('error', { message: 'User not found' });
        }
        // JSON - 1
        if (req.get('Accept').includes('application/json')) {
            return res.json(user[0]);
        }
        // HTML - 2
        res.render('profile', { user: user[0] });
    } catch (error) {
        logger.error('Failed to fetch profile', { error: error.message, stack: error.stack, userId });
        // 1
        if (req.get('Accept').includes('application/json')) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        // 2
        res.status(500).render('error', { message: 'Server error' });
    }
};