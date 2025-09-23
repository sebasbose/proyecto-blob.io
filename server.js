// server.js - Complete Node.js server with backend integration
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');

// Import middleware
const { corsMiddleware } = require('./backend/middleware/cors.middleware');
const { validateLogin, validatePlayer } = require('./backend/middleware/validation.middleware');
const { 
  handleDatabaseError,
  handleValidationError,
  handleAuthError,
  handleRateLimitError,
  notFoundHandler,
  globalErrorHandler,
  timeoutHandler,
  asyncHandler
} = require('./backend/middleware/error.middleware');
const { 
  authenticate, 
  authenticateGuest, 
  authorize, 
  rateLimitPerUser, 
  refreshSession, 
  securityHeaders,
  loginHandler,
  logoutHandler
} = require('./backend/middleware/auth.middleware');

// Import routes
const playersRoutes = require('./backend/routes/players.routes');
const gamesRoutes = require('./backend/routes/games.routes');
const leaderboardsRoutes = require('./backend/routes/leaderboards.routes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Request timeout middleware (30 seconds)
app.use(timeoutHandler(30000));

// Security headers
app.use(securityHeaders);

// CORS middleware
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Rate limiting for API routes
app.use('/api/', rateLimitPerUser(100, 60 * 1000)); // 100 requests per minute

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    iteration: 2
  });
});

// API Health check
app.get('/api/health', authenticate(false), (req, res) => {
  res.json({
    status: 'healthy',
    authenticated: !!req.user,
    timestamp: new Date().toISOString(),
    services: {
      database: 'operational',
      websocket: 'operational'
    }
  });
});

// Authentication endpoints
app.post('/api/auth/login', validateLogin, asyncHandler(loginHandler));
app.post('/api/auth/logout', authenticate(), logoutHandler);
app.post('/api/auth/guest', authenticateGuest, (req, res) => {
  res.json({
    success: true,
    message: 'Guest session created',
    data: {
      user: req.user,
      token: req.session.token
    },
    timestamp: new Date().toISOString()
  });
});

// Session refresh endpoint
app.post('/api/auth/refresh', authenticate(), refreshSession, (req, res) => {
  res.json({
    success: true,
    message: 'Session refreshed',
    data: {
      expiresAt: req.session.expiresAt
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes with authentication
app.use('/api/players', authenticate(false), refreshSession, playersRoutes);
app.use('/api/games', authenticate(false), refreshSession, gamesRoutes);
app.use('/api/leaderboards', authenticate(false), refreshSession, leaderboardsRoutes);

// Game configuration endpoint
app.get('/api/game/config', authenticate(false), (req, res) => {
  res.json({
    success: true,
    data: {
      worldSize: 4000,
      maxPlayers: 50,
      foodCount: 200,
      leaderboardSize: 10,
      gameMode: 'classic',
      features: {
        achievements: true,
        powerups: true,
        teams: false,
        chat: true
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Game API endpoints (for future use)
app.get('/api/stats', authenticate(false), (req, res) => {
  res.json({
    success: true,
    data: {
      totalGames: gameState.totalGames || 0,
      playersOnline: gameState.players.size,
      averageGameTime: 0,
      topScore: gameState.topScore || 0,
      totalFood: gameState.food.size
    },
    timestamp: new Date().toISOString()
  });
});

// WebSocket server setup
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info) => {
    // Basic verification - can be enhanced with token validation
    return true;
  }
});

// Game state management
const gameState = {
  players: new Map(),
  rooms: new Map(),
  food: new Map(),
  worldSize: { width: 4000, height: 4000 },
  totalGames: 0,
  topScore: 0,
  config: {
    maxPlayers: 50,
    foodCount: 200,
    respawnDelay: 3000
  }
};

// Initialize food items
function initializeFood() {
  gameState.food.clear();
  for (let i = 0; i < gameState.config.foodCount; i++) {
    const food = {
      id: `food_${i}`,
      x: Math.random() * gameState.worldSize.width,
      y: Math.random() * gameState.worldSize.height,
      size: 5 + Math.random() * 10,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      value: Math.floor(Math.random() * 5) + 1,
      type: 'normal'
    };
    gameState.food.set(food.id, food);
  }
  console.log(`🍎 Initialized ${gameState.config.foodCount} food items`);
}

// Initialize game state
initializeFood();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const playerId = uuidv4();
  console.log(`🔌 New WebSocket connection: ${playerId}`);
  
  // Store connection info
  ws.playerId = playerId;
  ws.isAlive = true;
  
  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(ws, data);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log(`❌ WebSocket connection closed: ${playerId}`);
    removePlayer(playerId);
  });
  
  // Handle connection errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${playerId}:`, error);
  });
  
  // Pong handler for keepalive
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  // Send welcome message with current game state
  ws.send(JSON.stringify({
    type: 'welcome',
    playerId: playerId,
    message: 'Connected to Blob.io server',
    gameState: {
      worldSize: gameState.worldSize,
      playersOnline: gameState.players.size,
      foodCount: gameState.food.size
    }
  }));
});

// Handle different types of client messages
function handleClientMessage(ws, data) {
  switch (data.type) {
    case 'join':
      handlePlayerJoin(ws, data);
      break;
    case 'move':
      handlePlayerMove(ws, data);
      break;
    case 'chat':
      handleChatMessage(ws, data);
      break;
    case 'eatFood':
      handleEatFood(ws, data);
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}

function handlePlayerJoin(ws, data) {
  if (gameState.players.size >= gameState.config.maxPlayers) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Server is full'
    }));
    return;
  }

  const player = {
    id: ws.playerId,
    name: data.name || 'Anonymous',
    x: Math.random() * gameState.worldSize.width,
    y: Math.random() * gameState.worldSize.height,
    radius: 20,
    color: data.color || `hsl(${Math.random() * 360}, 70%, 60%)`,
    score: 0,
    joinTime: Date.now(),
    lastUpdate: Date.now()
  };
  
  gameState.players.set(ws.playerId, player);
  
  // Send initial game state to new player
  ws.send(JSON.stringify({
    type: 'gameState',
    player: player,
    worldSize: gameState.worldSize,
    players: Array.from(gameState.players.values()),
    food: Array.from(gameState.food.values())
  }));
  
  // Notify other players
  broadcast({
    type: 'playerJoined',
    player: player
  }, ws.playerId);
  
  console.log(`👤 Player joined: ${player.name} (${ws.playerId})`);
}

function handlePlayerMove(ws, data) {
  const player = gameState.players.get(ws.playerId);
  if (player) {
    // Validate movement bounds
    player.x = Math.max(0, Math.min(gameState.worldSize.width, data.x || player.x));
    player.y = Math.max(0, Math.min(gameState.worldSize.height, data.y || player.y));
    player.lastUpdate = Date.now();
    
    // Broadcast to other players
    broadcast({
      type: 'playerMove',
      playerId: ws.playerId,
      x: player.x,
      y: player.y
    }, ws.playerId);
  }
}

function handleChatMessage(ws, data) {
  const player = gameState.players.get(ws.playerId);
  if (player && data.message && data.message.trim().length > 0) {
    const chatMessage = {
      type: 'chat',
      playerId: ws.playerId,
      playerName: player.name,
      message: data.message.trim().slice(0, 200), // Limit message length
      timestamp: Date.now()
    };
    
    // Broadcast chat message to all players
    broadcast(chatMessage);
    
    console.log(`💬 Chat from ${player.name}: ${data.message}`);
  }
}

function handleEatFood(ws, data) {
  const player = gameState.players.get(ws.playerId);
  const food = gameState.food.get(data.foodId);
  
  if (player && food) {
    // Update player stats
    player.radius += food.size * 0.1;
    player.score += food.value;
    
    // Update top score
    if (player.score > gameState.topScore) {
      gameState.topScore = player.score;
    }
    
    // Remove eaten food
    gameState.food.delete(data.foodId);
    
    // Spawn new food
    const newFood = {
      id: `food_${Date.now()}_${Math.random()}`,
      x: Math.random() * gameState.worldSize.width,
      y: Math.random() * gameState.worldSize.height,
      size: 5 + Math.random() * 10,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      value: Math.floor(Math.random() * 5) + 1,
      type: 'normal'
    };
    gameState.food.set(newFood.id, newFood);
    
    // Broadcast updates
    broadcast({
      type: 'foodEaten',
      foodId: data.foodId,
      newFood: newFood,
      player: {
        id: player.id,
        radius: player.radius,
        score: player.score
      }
    });
  }
}

function removePlayer(playerId) {
  if (gameState.players.has(playerId)) {
    const player = gameState.players.get(playerId);
    gameState.players.delete(playerId);
    
    // Notify other players
    broadcast({
      type: 'playerLeft',
      playerId: playerId
    });
    
    console.log(`👋 Player left: ${player.name} (${playerId})`);
  }
}

function broadcast(message, excludeId = null) {
  const messageStr = JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.playerId !== excludeId) {
      client.send(messageStr);
    }
  });
}

// Keepalive mechanism
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log(`💀 Terminating inactive connection: ${ws.playerId}`);
      removePlayer(ws.playerId);
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000); // Check every 30 seconds

// Game loop for server-side updates
setInterval(() => {
  updateGameState();
  
  // Broadcast periodic updates if there are players
  if (gameState.players.size > 0) {
    broadcast({
      type: 'gameUpdate',
      players: Array.from(gameState.players.values()),
      timestamp: Date.now()
    });
  }
}, 1000 / 20); // 20 FPS

function updateGameState() {
  const now = Date.now();
  
  // Clean up inactive players (longer timeout for WebSocket)
  for (const [playerId, player] of gameState.players.entries()) {
    if (now - player.lastUpdate > 60000) { // 60 seconds timeout
      console.log(`⏰ Removing inactive player: ${player.name}`);
      removePlayer(playerId);
    }
  }
  
  // Maintain food count
  while (gameState.food.size < gameState.config.foodCount) {
    const newFood = {
      id: `food_${Date.now()}_${Math.random()}`,
      x: Math.random() * gameState.worldSize.width,
      y: Math.random() * gameState.worldSize.height,
      size: 5 + Math.random() * 10,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      value: Math.floor(Math.random() * 5) + 1,
      type: 'normal'
    };
    gameState.food.set(newFood.id, newFood);
  }
}

// Error handling middleware (must be last)
app.use(handleDatabaseError);
app.use(handleValidationError);
app.use(handleAuthError);
app.use(handleRateLimitError);
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Close WebSocket connections
  wss.clients.forEach(ws => ws.terminate());
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  // Close WebSocket connections
  wss.clients.forEach(ws => ws.terminate());
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Blob.io server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
  console.log(`🌐 Access the game at: http://localhost:${PORT}`);
  console.log(`🎮 Game initialized with ${gameState.food.size} food items`);
  console.log(`📊 API endpoints available at: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server ready for multiplayer connections`);
});

module.exports = app;