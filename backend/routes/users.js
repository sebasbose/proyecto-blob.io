const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Match = require('../models/Match');
const { protect } = require('../middleware/auth');

// @desc    Obtener perfil del usuario actual
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
    }
});

// @desc    Actualizar perfil del usuario
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.bio = req.body.bio || user.bio;
        user.avatar = req.body.avatar || user.avatar;
        
        if (req.body.settings) {
            user.settings = { ...user.settings, ...req.body.settings };
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            bio: updatedUser.bio,
            avatar: updatedUser.avatar,
            settings: updatedUser.settings,
            token: req.headers.authorization.split(' ')[1] // Mantener el mismo token
        });
    } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
    }
});

// @desc    Obtener historial de partidas
// @route   GET /api/users/history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        const matches = await Match.find({ user: req.user._id }).sort({ date: -1 }).limit(50);
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Guardar resultado de partida
// @route   POST /api/users/match
// @access  Private
router.post('/match', protect, async (req, res) => {
    try {
        const { score, position, totalPlayers, duration, result, eliminatedBy, playersEliminated } = req.body;
        
        const match = await Match.create({
            user: req.user._id,
            score,
            position,
            totalPlayers,
            duration,
            result,
            eliminatedBy,
            playersEliminated
        });

        // Actualizar estadísticas del usuario
        const user = await User.findById(req.user._id);
        user.stats.gamesPlayed += 1;
        user.stats.totalScore += score;
        if (score > user.stats.maxScore) user.stats.maxScore = score;
        if (result === 'win') user.stats.totalWins += 1;
        user.stats.eliminatedPlayers += playersEliminated;
        if (result === 'loss') user.stats.timesEliminated += 1;
        
        // Calcular tiempo total (asumiendo que duration viene como string "5m 30s" o similar, simplificado aquí)
        // En una implementación real, duration debería enviarse en segundos
        
        await user.save();

        res.status(201).json(match);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
