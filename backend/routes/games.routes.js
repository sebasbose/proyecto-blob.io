// games.routes.js - Game session management API routes
const express = require('express');
const router = express.Router();
const databaseService = require('../services/database.service');

// GET /api/games - Get all games (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // 'active', 'completed', or 'all'

    let games = await databaseService.getAllGames();
    
    // Filter by status if specified
    if (status === 'active') {
      const gamesData = await databaseService.games;
      games = gamesData.activeGames;
    } else if (status === 'completed') {
      // games already contains only completed games
    } else if (status === 'all') {
      const gamesData = await databaseService.games;
      games = [...games, ...gamesData.activeGames];
    }

    // Sort by start time (newest first)
    games.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedGames = games.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedGames,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(games.length / limit),
        totalGames: games.length,
        hasNext: endIndex < games.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/games/:id - Get game by ID
router.get('/:id', async (req, res) => {
  try {
    const game = await databaseService.getGameById(req.params.id);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/games - Create new game session
router.post('/', async (req, res) => {
  try {
    const { playerId, playerName, gameMode, worldSize, playerCount } = req.body;

    // Validation
    if (!playerId || !playerName) {
      return res.status(400).json({
        success: false,
        error: 'Player ID and name are required'
      });
    }

    // Check if player exists
    const player = await databaseService.getPlayerById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Create new game session
    const newGame = await databaseService.createGame({
      playerId,
      playerName,
      gameMode: gameMode || 'classic',
      worldSize: worldSize || { width: 3000, height: 3000 },
      playerCount: playerCount || 1
    });

    res.status(201).json({
      success: true,
      data: newGame,
      message: 'Game session created successfully'
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/games/:id - Update active game session
router.put('/:id', async (req, res) => {
  try {
    const gameId = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.playerId;
    delete updateData.startTime;

    const updatedGame = await databaseService.updateActiveGame(gameId, updateData);

    res.json({
      success: true,
      data: updatedGame,
      message: 'Game session updated successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Active game not found'
      });
    }

    console.error('Error updating game:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/games/:id/finish - Finish game session
router.post('/:id/finish', async (req, res) => {
  try {
    const gameId = req.params.id;
    const gameResult = req.body;

    // Validation
    if (!gameResult.score || !gameResult.rank || !gameResult.duration) {
      return res.status(400).json({
        success: false,
        error: 'Score, rank, and duration are required'
      });
    }

    const finishedGame = await databaseService.finishGame(gameId, gameResult);

    // Update leaderboard if score is high enough
    await databaseService.updateLeaderboard(
      finishedGame.playerId,
      finishedGame.playerName,
      finishedGame.finalScore
    );

    res.json({
      success: true,
      data: finishedGame,
      message: 'Game finished successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Active game not found'
      });
    }

    console.error('Error finishing game:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/games/active/count - Get count of active games
router.get('/active/count', async (req, res) => {
  try {
    const gamesData = await databaseService.games;
    const activeCount = gamesData.activeGames.length;

    res.json({
      success: true,
      data: {
        activeGames: activeCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching active games count:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/games/player/:playerId - Get games for specific player
router.get('/player/:playerId', async (req, res) => {
  try {
    const playerId = req.params.playerId;
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

// GET /api/games/statistics/summary - Get game statistics summary
router.get('/statistics/summary', async (req, res) => {
  try {
    const allGames = await databaseService.getAllGames();
    const gamesData = await databaseService.games;
    
    const totalGames = allGames.length;
    const activeGames = gamesData.activeGames.length;
    
    // Calculate average game duration
    const completedGames = allGames.filter(game => game.status === 'completed');
    const avgDuration = completedGames.length > 0 
      ? completedGames.reduce((sum, game) => sum + game.duration, 0) / completedGames.length
      : 0;

    // Find highest score
    const highestScore = completedGames.length > 0
      ? Math.max(...completedGames.map(game => game.finalScore))
      : 0;

    // Games played today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const gamesToday = completedGames.filter(game => 
      new Date(game.startTime) >= today
    ).length;

    res.json({
      success: true,
      data: {
        totalGames,
        activeGames,
        averageDuration: Math.round(avgDuration),
        highestScore,
        gamesToday,
        completionRate: totalGames > 0 ? completedGames.length / totalGames : 0
      }
    });
  } catch (error) {
    console.error('Error fetching game statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/games/:id - Delete game (admin only - for testing)
router.delete('/:id', async (req, res) => {
  try {
    // This would typically require admin authentication
    // For now, it's available for testing purposes
    
    const gameId = req.params.id;
    const game = await databaseService.getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    // Remove from appropriate array
    if (game.status === 'active') {
      const gamesData = await databaseService.games;
      const index = gamesData.activeGames.findIndex(g => g.id === gameId);
      if (index !== -1) {
        gamesData.activeGames.splice(index, 1);
      }
    } else {
      const gamesData = await databaseService.games;
      const index = gamesData.games.findIndex(g => g.id === gameId);
      if (index !== -1) {
        gamesData.games.splice(index, 1);
      }
    }

    await databaseService.saveData();

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;