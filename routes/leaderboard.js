const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @desc    Obtener tabla de clasificación
// @route   GET /api/leaderboard
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { sortBy = 'maxScore', limit = 10, page = 1 } = req.query;
        
        // Mapeo de campos de ordenamiento permitidos
        const sortFields = {
            'maxScore': 'stats.maxScore',
            'wins': 'stats.totalWins',
            'level': 'level'
        };

        const sortField = sortFields[sortBy] || 'stats.maxScore';
        const skip = (page - 1) * limit;

        const users = await User.find({})
            .select('username avatar level stats.maxScore stats.totalWins lastActive')
            .sort({ [sortField]: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await User.countDocuments();

        res.json({
            users,
            page: Number(page),
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
