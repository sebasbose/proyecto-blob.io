// leaderboards.routes.js - Leaderboard and statistics API routes
const express = require('express');
const router = express.Router();
const databaseService = require('../services/database.service');

// GET /api/leaderboards - Get leaderboards
router.get('/', async (req, res) => {
  try {
    const type = req.query.type || 'allTime'; // allTime, weekly, daily
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await databaseService.getLeaderboard(type, limit);

    res.json({
      success: true,
      data: {
        type,
        leaderboard,
        count: leaderboard.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/leaderboards/all - Get all leaderboard types
router.get('/all', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [allTime, weekly, daily] = await Promise.all([
      databaseService.getLeaderboard('allTime', limit),
      databaseService.getLeaderboard('weekly', limit),
      databaseService.getLeaderboard('daily', limit)
    ]);

    res.json({
      success: true,
      data: {
        allTime,
        weekly,
        daily,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching all leaderboards:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/leaderboards/player/:playerId - Get player's position in leaderboards
router.get('/player/:playerId', async (req, res) => {
  try {
    const playerId = req.params.playerId;

    // Check if player exists
    const player = await databaseService.getPlayerById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Get all leaderboards
    const [allTime, weekly, daily] = await Promise.all([
      databaseService.getLeaderboard('allTime', 1000),
      databaseService.getLeaderboard('weekly', 1000),
      databaseService.getLeaderboard('daily', 1000)
    ]);

    // Find player position in each leaderboard
    const findPlayerPosition = (leaderboard) => {
      const position = leaderboard.findIndex(entry => entry.playerId === playerId);
      return position !== -1 ? {
        rank: position + 1,
        score: leaderboard[position].score,
        achievedAt: leaderboard[position].achievedAt
      } : null;
    };

    const playerPositions = {
      allTime: findPlayerPosition(allTime),
      weekly: findPlayerPosition(weekly),
      daily: findPlayerPosition(daily)
    };

    res.json({
      success: true,
      data: {
        playerId,
        playerName: player.username,
        positions: playerPositions,
        personalBest: player.stats.bestScore
      }
    });
  } catch (error) {
    console.error('Error fetching player leaderboard position:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/statistics - Get global game statistics
router.get('/statistics', async (req, res) => {
  try {
    const globalStats = await databaseService.getGlobalStats();

    res.json({
      success: true,
      data: globalStats
    });
  } catch (error) {
    console.error('Error fetching global statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/statistics/detailed - Get detailed statistics
router.get('/statistics/detailed', async (req, res) => {
  try {
    const globalStats = await databaseService.getGlobalStats();
    const allPlayers = await databaseService.getAllPlayers();
    const allGames = await databaseService.getAllGames();

    // Calculate additional statistics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Games by time period
    const gamesThisWeek = allGames.filter(game => 
      new Date(game.startTime) >= thisWeek
    ).length;

    const gamesThisMonth = allGames.filter(game => 
      new Date(game.startTime) >= thisMonth
    ).length;

    // Player activity
    const activePlayersThisWeek = allPlayers.filter(player => 
      new Date(player.lastLogin) >= thisWeek
    ).length;

    // Average scores and durations
    const completedGames = allGames.filter(game => game.status === 'completed');
    const averageScore = completedGames.length > 0 
      ? completedGames.reduce((sum, game) => sum + game.finalScore, 0) / completedGames.length
      : 0;

    const averageDuration = completedGames.length > 0
      ? completedGames.reduce((sum, game) => sum + game.duration, 0) / completedGames.length
      : 0;

    // Player level distribution
    const levelDistribution = {};
    allPlayers.forEach(player => {
      const level = player.stats.level;
      levelDistribution[level] = (levelDistribution[level] || 0) + 1;
    });

    const detailedStats = {
      ...globalStats,
      periods: {
        thisWeek: {
          gamesPlayed: gamesThisWeek,
          activePlayers: activePlayersThisWeek
        },
        thisMonth: {
          gamesPlayed: gamesThisMonth
        }
      },
      averages: {
        score: Math.round(averageScore),
        duration: Math.round(averageDuration)
      },
      distributions: {
        playerLevels: levelDistribution
      },
      growth: {
        newPlayersThisWeek: allPlayers.filter(player => 
          new Date(player.createdAt) >= thisWeek
        ).length,
        newPlayersThisMonth: allPlayers.filter(player => 
          new Date(player.createdAt) >= thisMonth
        ).length
      }
    };

    res.json({
      success: true,
      data: detailedStats
    });
  } catch (error) {
    console.error('Error fetching detailed statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/achievements - Get all achievement definitions
router.get('/achievements', async (req, res) => {
  try {
    const statistics = await databaseService.statistics;
    const achievements = statistics.achievements.definitions;

    res.json({
      success: true,
      data: achievements,
      count: achievements.length
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/achievements/stats - Get achievement statistics
router.get('/achievements/stats', async (req, res) => {
  try {
    const statistics = await databaseService.statistics;
    const achievements = statistics.achievements.definitions;
    const playerProgress = statistics.achievements.playerProgress;

    // Calculate completion rates for each achievement
    const totalPlayers = Object.keys(playerProgress).length;
    const achievementStats = achievements.map(achievement => {
      const completedCount = Object.values(playerProgress).filter(progress =>
        progress.some(p => p.achievementId === achievement.id)
      ).length;

      return {
        ...achievement,
        completedBy: completedCount,
        completionRate: totalPlayers > 0 ? completedCount / totalPlayers : 0
      };
    });

    // Sort by rarity (least completed first)
    achievementStats.sort((a, b) => a.completionRate - b.completionRate);

    res.json({
      success: true,
      data: {
        achievements: achievementStats,
        totalPlayers,
        summary: {
          totalAchievements: achievements.length,
          averageCompletion: achievementStats.reduce((sum, ach) => sum + ach.completionRate, 0) / achievements.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching achievement statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/leaderboards/update - Manually update leaderboard (for testing)
router.post('/update', async (req, res) => {
  try {
    const { playerId, playerName, score } = req.body;

    if (!playerId || !playerName || !score) {
      return res.status(400).json({
        success: false,
        error: 'Player ID, name, and score are required'
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

    await databaseService.updateLeaderboard(playerId, playerName, score);

    res.json({
      success: true,
      message: 'Leaderboard updated successfully'
    });
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/leaderboards/history/:playerId - Get player's score history
router.get('/history/:playerId', async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const limit = parseInt(req.query.limit) || 20;

    const player = await databaseService.getPlayerById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    const games = await databaseService.getPlayerGames(playerId, limit);
    
    // Extract score history with timestamps
    const scoreHistory = games.map(game => ({
      gameId: game.id,
      score: game.finalScore,
      rank: game.finalRank,
      date: game.endTime,
      duration: game.duration
    })).reverse(); // Show oldest first for trend analysis

    res.json({
      success: true,
      data: {
        playerId,
        playerName: player.username,
        scoreHistory,
        stats: {
          gamesPlayed: scoreHistory.length,
          bestScore: Math.max(...scoreHistory.map(g => g.score)),
          averageScore: Math.round(scoreHistory.reduce((sum, g) => sum + g.score, 0) / scoreHistory.length),
          averageRank: Math.round(scoreHistory.reduce((sum, g) => sum + g.rank, 0) / scoreHistory.length)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching player score history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;