// server.js - Basic Node.js server setup for future iterations
const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    iteration: 2
  });
});

// Game API endpoints (for future use)
app.get('/api/stats', (req, res) => {
  res.json({
    totalGames: 0,
    playersOnline: 0,
    averageGameTime: 0,
    topScore: 0
  });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🎮 Blob.io server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
  console.log(`🌐 Access the game at: http://localhost:${PORT}`);
});

// WebSocket server setup (for future multiplayer functionality)
const wss = new WebSocket.Server({ server });

// Game state management (prepared for future iterations)
const gameState = {
  players: new Map(),
  rooms: new Map(),
  food: [],
  worldSize: { width: 3000, height: 3000 }
};

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const playerId = uuidv4();
  console.log(`🔌 New WebSocket connection: ${playerId}`);
  
  // Store connection info
  ws.playerId = playerId;
  ws.isAlive = true;
  
  // Handle client messages (prepared for future use)
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
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    playerId: playerId,
    message: 'Connected to Blob.io server'
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
    default:
      console.log('Unknown message type:', data.type);
  }
}

function handlePlayerJoin(ws, data) {
  const player = {
    id: ws.playerId,
    name: data.name || 'Anonymous',
    x: Math.random() * gameState.worldSize.width,
    y: Math.random() * gameState.worldSize.height,
    radius: 20,
    score: 0,
    joinTime: Date.now()
  };
  
  gameState.players.set(ws.playerId, player);
  
  // Send current game state to new player
  ws.send(JSON.stringify({
    type: 'gameState',
    worldSize: gameState.worldSize,
    players: Array.from(gameState.players.values()),
    food: gameState.food
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
    player.x = data.x;
    player.y = data.y;
    player.targetX = data.targetX;
    player.targetY = data.targetY;
    
    // Broadcast position update
    broadcast({
      type: 'playerMove',
      playerId: ws.playerId,
      x: data.x,
      y: data.y,
      targetX: data.targetX,
      targetY: data.targetY
    }, ws.playerId);
  }
}

function handleChatMessage(ws, data) {
  const player = gameState.players.get(ws.playerId);
  if (player) {
    const chatMessage = {
      type: 'chat',
      playerId: ws.playerId,
      playerName: player.name,
      message: data.message,
      timestamp: Date.now()
    };
    
    // Broadcast chat message to all players
    broadcast(chatMessage);
    
    console.log(`💬 Chat from ${player.name}: ${data.message}`);
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
}, 30000);

// Game loop (for future server-side game logic)
setInterval(() => {
  // Update game state
  updateGameState();
  
  // Broadcast updates to all clients
  if (gameState.players.size > 0) {
    broadcast({
      type: 'gameUpdate',
      players: Array.from(gameState.players.values()),
      food: gameState.food
    });
  }
}, 1000 / 20); // 20 FPS

function updateGameState() {
  // Future: Implement server-side game logic
  // - Collision detection
  // - Food spawning
  // - Player scoring
  // - Game rules enforcement
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;