const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Match = require('../models/Match');

// @desc    Obtener tabla de clasificación
// @route   GET /api/leaderboard
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { sortBy = 'maxScore', limit = 100, page = 1 } = req.query;
        
        // Mapeo de campos de ordenamiento permitidos
        const sortFields = {
            'maxScore': 'stats.maxScore',
            'score': 'stats.maxScore',
            'wins': 'stats.totalWins',
            'level': 'level'
        };

        const sortField = sortFields[sortBy] || 'stats.maxScore';
        const skip = (page - 1) * limit;

        const users = await User.find({})
            .select('username avatar level stats.maxScore stats.totalWins stats.gamesPlayed lastActive')
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

// @desc    Obtener estadísticas globales
// @route   GET /api/leaderboard/stats
// @access  Public
router.get('/stats', async (req, res) => {
    try {
        const totalPlayers = await User.countDocuments();
        const totalMatches = await Match.countDocuments();
        
        // Calcular tiempo total de todas las partidas (en horas)
        const matches = await Match.aggregate([
            {
                $group: {
                    _id: null,
                    totalTime: { $sum: '$duration' }
                }
            }
        ]);
        
        const totalTimeMinutes = matches.length > 0 ? matches[0].totalTime : 0;
        const totalTimeHours = Math.floor(totalTimeMinutes / 60);
        
        // Calcular puntuación promedio
        const users = await User.aggregate([
            {
                $group: {
                    _id: null,
                    averageScore: { $avg: '$stats.maxScore' }
                }
            }
        ]);
        
        const averageScore = users.length > 0 ? Math.floor(users[0].averageScore) : 0;

        res.json({
            totalPlayers,
            totalMatches,
            totalTime: totalTimeHours,
            averageScore
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Obtener ranking de un usuario específico
// @route   GET /api/leaderboard/rank/:userId
// @access  Public
router.get('/rank/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Contar usuarios con mejor puntuación
        const rank = await User.countDocuments({
            'stats.maxScore': { $gt: user.stats.maxScore }
        }) + 1;

        res.json({
            rank,
            username: user.username,
            maxScore: user.stats.maxScore,
            totalWins: user.stats.totalWins,
            level: user.level
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
