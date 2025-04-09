const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const pool = require('../config/db');

router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user || user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.render('profile', { user: user[0] });
        // res.json(user[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

module.exports = router;