// players.routes.js - Player management API routes
const express = require('express');
const router = express.Router();
const databaseService = require('../services/database.service');

// GET /api/players - Get all players
router.get('/', async (req, res) => {
  try {
    const players = await databaseService.getAllPlayers();
    
    // Remove sensitive information
    const publicPlayers = players.map(player => ({
      id: player.id,
      username: player.username,
      stats: player.stats,
      achievements: player.achievements,
      createdAt: player.createdAt,
      lastLogin: player.lastLogin,
      isActive: player.isActive
    }));

    res.json({
      success: true,
      data: publicPlayers,
      count: publicPlayers.length
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/players/:id - Get player by ID
router.get('/:id', async (req, res) => {
  try {
    const player = await databaseService.getPlayerById(req.params.id);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Remove sensitive information for public access
    const publicPlayer = {
      id: player.id,
      username: player.username,
      stats: player.stats,
      achievements: player.achievements,
      createdAt: player.createdAt,
      lastLogin: player.lastLogin,
      isActive: player.isActive,
      preferences: req.query.include_preferences === 'true' ? player.preferences : undefined
    };

    res.json({
      success: true,
      data: publicPlayer
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/players - Create new player
router.post('/', async (req, res) => {
  try {
    const { username, email } = req.body;

    // Validation
    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters long'
      });
    }

    if (username.length > 15) {
      return res.status(400).json({
        success: false,
        error: 'Username must be maximum 15 characters long'
      });
    }

    // Check if username already exists
    const existingPlayer = await databaseService.getPlayerByUsername(username);
    if (existingPlayer) {
      return res.status(409).json({
        success: false,
        error: 'Username already taken'
      });
    }

    // Create new player
    const newPlayer = await databaseService.createPlayer({
      username: username.trim(),
      email: email?.trim()
    });

    // Return public player data
    const publicPlayer = {
      id: newPlayer.id,
      username: newPlayer.username,
      stats: newPlayer.stats,
      achievements: newPlayer.achievements,
      createdAt: newPlayer.createdAt,
      preferences: newPlayer.preferences
    };

    res.status(201).json({
      success: true,
      data: publicPlayer,
      message: 'Player created successfully'
    });
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/players/:id - Update player
router.put('/:id', async (req, res) => {
  try {
    const playerId = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.stats; // Stats are updated through game results

    const updatedPlayer = await databaseService.updatePlayer(playerId, updateData);

    // Return public player data
    const publicPlayer = {
      id: updatedPlayer.id,
      username: updatedPlayer.username,
      achievements: updatedPlayer.achievements,
      preferences: updatedPlayer.preferences,
      lastLogin: updatedPlayer.lastLogin
    };

    res.json({
      success: true,
      data: publicPlayer,
      message: 'Player updated successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    console.error('Error updating player:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/players/:id/games - Get player's game history
router.get('/:id/games', async (req, res) => {
  try {
    const playerId = req.params.id;
    const limit = parseInt(req.query.limit) || 10;

    const player = await databaseService.getPlayerById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    const games = await databaseService.getPlayerGames(playerId, limit);

    res.json({
      success: true,
      data: games,
      count: games.length
    });
  } catch (error) {
    console.error('Error fetching player games:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/players/:id/achievements - Get player achievements
router.get('/:id/achievements', async (req, res) => {
  try {
    const playerId = req.params.id;

    const player = await databaseService.getPlayerById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    const achievements = await databaseService.getPlayerAchievements(playerId);

    res.json({
      success: true,
      data: achievements,
      count: achievements.length
    });
  } catch (error) {
    console.error('Error fetching player achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/players/:id/achievements - Unlock achievement for player
router.post('/:id/achievements', async (req, res) => {
  try {
    const playerId = req.params.id;
    const { achievementId } = req.body;

    if (!achievementId) {
      return res.status(400).json({
        success: false,
        error: 'Achievement ID is required'
      });
    }

    const player = await databaseService.getPlayerById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    const unlocked = await databaseService.unlockAchievement(playerId, achievementId);

    if (unlocked) {
      res.json({
        success: true,
        message: 'Achievement unlocked successfully',
        data: { achievementId, unlockedAt: new Date().toISOString() }
      });
    } else {
      res.status(409).json({
        success: false,
        error: 'Achievement already unlocked'
      });
    }
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/players/search/:username - Search player by username
router.get('/search/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const player = await databaseService.getPlayerByUsername(username);

    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Return minimal public data for search
    const publicPlayer = {
      id: player.id,
      username: player.username,
      stats: {
        level: player.stats.level,
        bestScore: player.stats.bestScore,
        totalGames: player.stats.totalGames
      },
      isActive: player.isActive
    };

    res.json({
      success: true,
      data: publicPlayer
    });
  } catch (error) {
    console.error('Error searching player:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;