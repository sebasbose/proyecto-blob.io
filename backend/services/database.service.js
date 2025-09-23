// database.service.js - Mock database service layer
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, '../database');
    this.players = null;
    this.games = null;
    this.statistics = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.loadData();
      this.isInitialized = true;
      console.log('🗄️ Database service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database service:', error);
      throw error;
    }
  }

  async loadData() {
    try {
      const [playersData, gamesData, statisticsData] = await Promise.all([
        this.readJsonFile('players.json'),
        this.readJsonFile('games.json'),
        this.readJsonFile('statistics.json')
      ]);

      this.players = playersData;
      this.games = gamesData;
      this.statistics = statisticsData;
    } catch (error) {
      console.error('Error loading database files:', error);
      throw error;
    }
  }

  async readJsonFile(filename) {
    const filePath = path.join(this.dbPath, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  }

  async writeJsonFile(filename, data) {
    const filePath = path.join(this.dbPath, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async saveData() {
    try {
      await Promise.all([
        this.writeJsonFile('players.json', this.players),
        this.writeJsonFile('games.json', this.games),
        this.writeJsonFile('statistics.json', this.statistics)
      ]);
    } catch (error) {
      console.error('Error saving database files:', error);
      throw error;
    }
  }

  // Player operations
  async getAllPlayers() {
    await this.ensureInitialized();
    return this.players.players;
  }

  async getPlayerById(playerId) {
    await this.ensureInitialized();
    return this.players.players.find(player => player.id === playerId);
  }

  async getPlayerByUsername(username) {
    await this.ensureInitialized();
    return this.players.players.find(player => 
      player.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createPlayer(playerData) {
    await this.ensureInitialized();
    
    const newPlayer = {
      id: uuidv4(),
      username: playerData.username,
      email: playerData.email || null,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      stats: {
        totalGames: 0,
        totalWins: 0,
        bestScore: 0,
        totalPlayTime: 0,
        averageScore: 0,
        level: 1,
        experience: 0
      },
      preferences: {
        soundEnabled: true,
        musicVolume: 0.7,
        sfxVolume: 0.8,
        theme: 'dark',
        language: 'es'
      },
      achievements: ['first_registration'],
      isActive: true,
      profilePicture: null,
      ...playerData
    };

    this.players.players.push(newPlayer);
    this.players.metadata.totalPlayers = this.players.players.length;
    this.players.metadata.lastUpdated = new Date().toISOString();

    await this.saveData();
    return newPlayer;
  }

  async updatePlayer(playerId, updateData) {
    await this.ensureInitialized();
    
    const playerIndex = this.players.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      throw new Error(`Player with ID ${playerId} not found`);
    }

    // Deep merge the update data
    this.players.players[playerIndex] = {
      ...this.players.players[playerIndex],
      ...updateData,
      stats: {
        ...this.players.players[playerIndex].stats,
        ...(updateData.stats || {})
      },
      preferences: {
        ...this.players.players[playerIndex].preferences,
        ...(updateData.preferences || {})
      }
    };

    this.players.metadata.lastUpdated = new Date().toISOString();
    await this.saveData();
    
    return this.players.players[playerIndex];
  }

  async updatePlayerStats(playerId, gameResult) {
    await this.ensureInitialized();
    
    const player = await this.getPlayerById(playerId);
    if (!player) {
      throw new Error(`Player with ID ${playerId} not found`);
    }

    const stats = player.stats;
    stats.totalGames += 1;
    if (gameResult.rank === 1) stats.totalWins += 1;
    if (gameResult.score > stats.bestScore) stats.bestScore = gameResult.score;
    stats.totalPlayTime += gameResult.duration;
    stats.averageScore = Math.round(
      (stats.averageScore * (stats.totalGames - 1) + gameResult.score) / stats.totalGames
    );
    
    // Level and experience calculation
    const experienceGained = Math.floor(gameResult.score / 10) + (gameResult.rank === 1 ? 100 : 0);
    stats.experience += experienceGained;
    stats.level = Math.floor(stats.experience / 100) + 1;

    await this.updatePlayer(playerId, { stats, lastLogin: new Date().toISOString() });
    return experienceGained;
  }

  // Game operations
  async getAllGames() {
    await this.ensureInitialized();
    return this.games.games;
  }

  async getGameById(gameId) {
    await this.ensureInitialized();
    return this.games.games.find(game => game.id === gameId) ||
           this.games.activeGames.find(game => game.id === gameId);
  }

  async getPlayerGames(playerId, limit = 10) {
    await this.ensureInitialized();
    return this.games.games
      .filter(game => game.playerId === playerId)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, limit);
  }

  async createGame(gameData) {
    await this.ensureInitialized();
    
    const newGame = {
      id: uuidv4(),
      playerId: gameData.playerId,
      playerName: gameData.playerName,
      startTime: new Date().toISOString(),
      gameMode: gameData.gameMode || 'classic',
      worldSize: gameData.worldSize || { width: 3000, height: 3000 },
      playerCount: gameData.playerCount || 1,
      status: 'active',
      currentScore: 0,
      currentRank: gameData.playerCount || 1,
      currentRadius: 20,
      ...gameData
    };

    this.games.activeGames.push(newGame);
    this.games.metadata.totalActiveGames = this.games.activeGames.length;
    this.games.metadata.lastUpdated = new Date().toISOString();

    await this.saveData();
    return newGame;
  }

  async finishGame(gameId, gameResult) {
    await this.ensureInitialized();
    
    const activeGameIndex = this.games.activeGames.findIndex(g => g.id === gameId);
    if (activeGameIndex === -1) {
      throw new Error(`Active game with ID ${gameId} not found`);
    }

    const activeGame = this.games.activeGames[activeGameIndex];
    const finishedGame = {
      ...activeGame,
      endTime: new Date().toISOString(),
      duration: gameResult.duration,
      finalScore: gameResult.score,
      finalRank: gameResult.rank,
      maxRadius: gameResult.maxRadius || activeGame.currentRadius,
      foodEaten: gameResult.foodEaten || 0,
      playersEaten: gameResult.playersEaten || 0,
      timesEaten: gameResult.timesEaten || 0,
      gameEvents: gameResult.events || [],
      status: 'completed'
    };

    // Move from active to completed games
    this.games.games.push(finishedGame);
    this.games.activeGames.splice(activeGameIndex, 1);

    // Update metadata
    this.games.metadata.totalGames = this.games.games.length;
    this.games.metadata.totalActiveGames = this.games.activeGames.length;
    this.games.metadata.lastUpdated = new Date().toISOString();

    await this.saveData();
    
    // Update player stats
    await this.updatePlayerStats(activeGame.playerId, gameResult);
    
    return finishedGame;
  }

  async updateActiveGame(gameId, updateData) {
    await this.ensureInitialized();
    
    const gameIndex = this.games.activeGames.findIndex(g => g.id === gameId);
    if (gameIndex === -1) {
      throw new Error(`Active game with ID ${gameId} not found`);
    }

    this.games.activeGames[gameIndex] = {
      ...this.games.activeGames[gameIndex],
      ...updateData
    };

    await this.saveData();
    return this.games.activeGames[gameIndex];
  }

  // Statistics operations
  async getGlobalStats() {
    await this.ensureInitialized();
    return this.statistics.globalStats;
  }

  async getLeaderboard(type = 'allTime', limit = 10) {
    await this.ensureInitialized();
    
    const leaderboard = this.statistics.leaderboards[type] || this.statistics.leaderboards.allTime;
    return leaderboard.slice(0, limit);
  }

  async updateLeaderboard(playerId, playerName, score) {
    await this.ensureInitialized();
    
    const now = new Date().toISOString();
    const entry = { playerId, playerName, score, achievedAt: now };

    // Update all-time leaderboard
    this.updateLeaderboardType('allTime', entry);
    this.updateLeaderboardType('weekly', entry);
    this.updateLeaderboardType('daily', entry);

    await this.saveData();
  }

  updateLeaderboardType(type, entry) {
    let leaderboard = this.statistics.leaderboards[type];
    
    // Check if player already exists in leaderboard
    const existingIndex = leaderboard.findIndex(l => l.playerId === entry.playerId);
    
    if (existingIndex !== -1) {
      // Update if new score is higher
      if (entry.score > leaderboard[existingIndex].score) {
        leaderboard[existingIndex] = entry;
      }
    } else {
      // Add new entry
      leaderboard.push(entry);
    }

    // Sort by score and re-rank
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Keep only top 100 for performance
    if (leaderboard.length > 100) {
      leaderboard.splice(100);
    }

    this.statistics.leaderboards[type] = leaderboard;
  }

  async getPlayerAchievements(playerId) {
    await this.ensureInitialized();
    
    const playerAchievements = this.statistics.achievements.playerProgress[playerId] || [];
    const achievementDefinitions = this.statistics.achievements.definitions;
    
    return playerAchievements.map(pa => ({
      ...achievementDefinitions.find(def => def.id === pa.achievementId),
      unlockedAt: pa.unlockedAt
    }));
  }

  async unlockAchievement(playerId, achievementId) {
    await this.ensureInitialized();
    
    if (!this.statistics.achievements.playerProgress[playerId]) {
      this.statistics.achievements.playerProgress[playerId] = [];
    }

    const playerAchievements = this.statistics.achievements.playerProgress[playerId];
    const alreadyUnlocked = playerAchievements.some(a => a.achievementId === achievementId);
    
    if (!alreadyUnlocked) {
      playerAchievements.push({
        achievementId,
        unlockedAt: new Date().toISOString()
      });
      
      await this.saveData();
      return true;
    }
    
    return false;
  }

  // Utility methods
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  async cleanup() {
    // Clean up old completed games (keep last 1000)
    if (this.games.games.length > 1000) {
      this.games.games = this.games.games
        .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
        .slice(0, 1000);
      
      await this.saveData();
    }
  }

  async getHealthCheck() {
    return {
      status: 'healthy',
      initialized: this.isInitialized,
      playersCount: this.players?.players?.length || 0,
      gamesCount: this.games?.games?.length || 0,
      activeGamesCount: this.games?.activeGames?.length || 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;