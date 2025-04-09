const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/publications', isAuthenticated, async (req, res) => {
    try {
        const [publications] = await pool.query(`
            SELECT 
                p.*,
                u.first_name,
                u.last_name
            FROM publications p
            JOIN users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
        `);
        
        res.json({ 
            success: true,
            publications 
        });
    } catch (error) {
        console.error('Error fetching publications:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch publications' 
        });
    }
});

module.exports = router;