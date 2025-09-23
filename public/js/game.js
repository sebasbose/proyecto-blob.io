// game.js - Core game mechanics and engine
class Game {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.minimap = null;
    this.minimapCtx = null;
    
    // Game world properties
    this.worldSize = { width: 3000, height: 3000 };
    this.camera = { x: 0, y: 0 };
    this.zoom = 1;
    
    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.startTime = null;
    this.gameTime = 0;
    
    // Game objects
    this.players = new Map();
    this.food = [];
    this.localPlayer = null;
    
    // Performance
    this.lastFrameTime = 0;
    this.fps = 60;
    this.deltaTime = 0;
    
    // Game settings
    this.settings = {
      foodCount: 200,
      maxFoodRadius: 5,
      minFoodRadius: 2,
      playerStartSize: 20,
      growthRate: 1.2,
      speedDecay: 0.85,
      viewportPadding: 100,
      minimapScale: 0.1
    };
  }

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.minimap = document.getElementById('minimap');
    this.minimapCtx = this.minimap.getContext('2d');
    
    this.resizeCanvas();
    this.generateFood();
    this.setupEventListeners();
    
    console.log('Game initialized');
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 60; // Account for HUD
    
    // Update minimap size
    const minimapContainer = document.querySelector('.minimap-container');
    this.minimap.width = minimapContainer.clientWidth;
    this.minimap.height = minimapContainer.clientHeight;
  }

  setupEventListeners() {
    // Mouse movement for player control
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.localPlayer && this.isRunning && !this.isPaused) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates
        const worldX = mouseX + this.camera.x;
        const worldY = mouseY + this.camera.y;
        
        this.localPlayer.setTarget(worldX, worldY);
      }
    });

    // Resize handling
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  generateFood() {
    this.food = [];
    for (let i = 0; i < this.settings.foodCount; i++) {
      this.spawnFood();
    }
  }

  spawnFood() {
    const food = {
      x: Math.random() * this.worldSize.width,
      y: Math.random() * this.worldSize.height,
      radius: Math.random() * (this.settings.maxFoodRadius - this.settings.minFoodRadius) + this.settings.minFoodRadius,
      color: this.getRandomColor(),
      value: 1
    };
    this.food.push(food);
  }

  getRandomColor() {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
      '#ffa726', '#ab47bc', '#ef5350', '#66bb6a',
      '#42a5f5', '#ff7043', '#ec407a', '#26c6da'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  createPlayer(name, isLocal = false) {
    const player = new Player(
      name,
      Math.random() * this.worldSize.width,
      Math.random() * this.worldSize.height,
      this.settings.playerStartSize,
      isLocal
    );
    
    const id = isLocal ? 'local' : Date.now().toString();
    this.players.set(id, player);
    
    if (isLocal) {
      this.localPlayer = player;
      this.updateCamera();
    }
    
    return player;
  }

  start(playerName) {
    this.createPlayer(playerName, true);
    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.gameLoop();
    
    // Add some AI players for demo
    this.addAIPlayers();
    
    console.log('Game started for player:', playerName);
  }

  addAIPlayers() {
    const aiNames = ['Bot_Alpha', 'Bot_Beta', 'Bot_Gamma', 'Bot_Delta', 'Bot_Omega'];
    aiNames.forEach(name => {
      const aiPlayer = this.createPlayer(name, false);
      aiPlayer.isAI = true;
      // Give AI players some initial size variation
      aiPlayer.radius = this.settings.playerStartSize + Math.random() * 20;
      aiPlayer.score = Math.floor(aiPlayer.radius * aiPlayer.radius / 10);
    });
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.lastFrameTime = performance.now();
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.players.clear();
    this.localPlayer = null;
  }

  gameLoop(currentTime = 0) {
    if (!this.isRunning) return;

    this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    if (!this.isPaused) {
      this.update();
    }
    
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update() {
    this.gameTime = Date.now() - this.startTime;
    
    // Update players
    this.players.forEach(player => {
      if (player.isAI) {
        this.updateAI(player);
      }
      player.update(this.deltaTime);
      this.keepPlayerInBounds(player);
    });

    // Check collisions
    this.checkCollisions();
    
    // Update camera
    if (this.localPlayer) {
      this.updateCamera();
      this.updateZoom();
    }

    // Maintain food count
    while (this.food.length < this.settings.foodCount) {
      this.spawnFood();
    }
  }

  updateAI(aiPlayer) {
    // Simple AI behavior: move towards nearest food or away from larger players
    const nearestFood = this.findNearestFood(aiPlayer);
    const nearestThreat = this.findNearestThreat(aiPlayer);

    if (nearestThreat && this.getDistance(aiPlayer, nearestThreat) < 100) {
      // Run away from larger players
      const avoidX = aiPlayer.x - (nearestThreat.x - aiPlayer.x);
      const avoidY = aiPlayer.y - (nearestThreat.y - aiPlayer.y);
      aiPlayer.setTarget(avoidX, avoidY);
    } else if (nearestFood) {
      // Move towards food
      aiPlayer.setTarget(nearestFood.x, nearestFood.y);
    } else {
      // Wander randomly
      if (Math.random() < 0.01) { // Change direction occasionally
        aiPlayer.setTarget(
          Math.random() * this.worldSize.width,
          Math.random() * this.worldSize.height
        );
      }
    }
  }

  findNearestFood(player) {
    let nearest = null;
    let minDistance = Infinity;

    this.food.forEach(food => {
      const distance = this.getDistance(player, food);
      if (distance < minDistance && distance < 150) {
        minDistance = distance;
        nearest = food;
      }
    });

    return nearest;
  }

  findNearestThreat(player) {
    let nearest = null;
    let minDistance = Infinity;

    this.players.forEach(otherPlayer => {
      if (otherPlayer !== player && otherPlayer.radius > player.radius * 1.1) {
        const distance = this.getDistance(player, otherPlayer);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = otherPlayer;
        }
      }
    });

    return nearest;
  }

  getDistance(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  keepPlayerInBounds(player) {
    const margin = 50;
    player.x = Math.max(margin, Math.min(this.worldSize.width - margin, player.x));
    player.y = Math.max(margin, Math.min(this.worldSize.height - margin, player.y));
  }

  checkCollisions() {
    // Player-food collisions
    this.players.forEach(player => {
      for (let i = this.food.length - 1; i >= 0; i--) {
        const food = this.food[i];
        if (this.isColliding(player, food)) {
          player.eat(food.value);
          this.food.splice(i, 1);
        }
      }
    });

    // Player-player collisions
    const playerArray = Array.from(this.players.values());
    for (let i = 0; i < playerArray.length; i++) {
      for (let j = i + 1; j < playerArray.length; j++) {
        const player1 = playerArray[i];
        const player2 = playerArray[j];
        
        if (this.isColliding(player1, player2)) {
          const larger = player1.radius > player2.radius ? player1 : player2;
          const smaller = player1.radius < player2.radius ? player1 : player2;
          
          // Only eat if significantly larger
          if (larger.radius > smaller.radius * 1.1) {
            larger.eat(smaller.score);
            
            if (smaller === this.localPlayer) {
              this.gameOver();
            } else {
              // Remove eaten player and respawn if AI
              this.players.forEach((player, id) => {
                if (player === smaller) {
                  this.players.delete(id);
                  if (player.isAI) {
                    // Respawn AI player after delay
                    setTimeout(() => {
                      if (this.isRunning) {
                        this.createPlayer(player.name, false).isAI = true;
                      }
                    }, 3000);
                  }
                }
              });
            }
          }
        }
      }
    }
  }

  isColliding(obj1, obj2) {
    const distance = this.getDistance(obj1, obj2);
    return distance < (obj1.radius + obj2.radius) * 0.8; // Slightly less for better gameplay
  }

  updateCamera() {
    if (!this.localPlayer) return;
    
    const targetX = this.localPlayer.x - this.canvas.width / 2;
    const targetY = this.localPlayer.y - this.canvas.height / 2;
    
    // Smooth camera movement
    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;
    
    // Keep camera within world bounds
    this.camera.x = Math.max(0, Math.min(this.worldSize.width - this.canvas.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.worldSize.height - this.canvas.height, this.camera.y));
  }

  updateZoom() {
    if (!this.localPlayer) return;
    
    // Zoom out as player gets bigger
    const baseZoom = 1;
    const maxZoom = 0.5;
    const zoomFactor = Math.max(maxZoom, baseZoom - (this.localPlayer.radius - this.settings.playerStartSize) / 200);
    
    this.zoom += (zoomFactor - this.zoom) * 0.05;
  }

  render() {
    this.clearCanvas();
    this.drawBackground();
    this.drawFood();
    this.drawPlayers();
    this.drawUI();
    this.drawMinimap();
  }

  clearCanvas() {
    this.ctx.fillStyle = '#0a0e27';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackground() {
    // Draw grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    
    const gridSize = 50;
    const startX = Math.floor(this.camera.x / gridSize) * gridSize;
    const startY = Math.floor(this.camera.y / gridSize) * gridSize;
    
    this.ctx.beginPath();
    for (let x = startX; x < this.camera.x + this.canvas.width; x += gridSize) {
      this.ctx.moveTo(x - this.camera.x, 0);
      this.ctx.lineTo(x - this.camera.x, this.canvas.height);
    }
    for (let y = startY; y < this.camera.y + this.canvas.height; y += gridSize) {
      this.ctx.moveTo(0, y - this.camera.y);
      this.ctx.lineTo(this.canvas.width, y - this.camera.y);
    }
    this.ctx.stroke();
  }

  drawFood() {
    this.food.forEach(food => {
      const screenX = food.x - this.camera.x;
      const screenY = food.y - this.camera.y;
      
      // Only draw if on screen
      if (screenX > -10 && screenX < this.canvas.width + 10 &&
          screenY > -10 && screenY < this.canvas.height + 10) {
        
        this.ctx.fillStyle = food.color;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, food.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.shadowColor = food.color;
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, food.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    });
  }

  drawPlayers() {
    // Sort players by size (smaller first) for proper rendering order
    const sortedPlayers = Array.from(this.players.values()).sort((a, b) => a.radius - b.radius);
    
    sortedPlayers.forEach(player => {
      const screenX = player.x - this.camera.x;
      const screenY = player.y - this.camera.y;
      
      // Only draw if on screen (with margin for large players)
      const margin = player.radius + 50;
      if (screenX > -margin && screenX < this.canvas.width + margin &&
          screenY > -margin && screenY < this.canvas.height + margin) {
        
        player.draw(this.ctx, screenX, screenY);
      }
    });
  }

  drawUI() {
    // Draw player position indicator (for debugging)
    if (this.localPlayer) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(
        `Position: ${Math.floor(this.localPlayer.x)}, ${Math.floor(this.localPlayer.y)}`,
        10, this.canvas.height - 10
      );
    }
  }

  drawMinimap() {
    if (!this.minimapCtx) return;
    
    const scale = this.settings.minimapScale;
    
    // Clear minimap
    this.minimapCtx.fillStyle = '#0a0e27';
    this.minimapCtx.fillRect(0, 0, this.minimap.width, this.minimap.height);
    
    // Draw world border
    this.minimapCtx.strokeStyle = '#4ecdc4';
    this.minimapCtx.lineWidth = 2;
    this.minimapCtx.strokeRect(0, 0, 
      this.worldSize.width * scale, 
      this.worldSize.height * scale
    );
    
    // Draw players
    this.players.forEach(player => {
      const x = player.x * scale;
      const y = player.y * scale;
      const radius = Math.max(1, player.radius * scale);
      
      if (player === this.localPlayer) {
        this.minimapCtx.fillStyle = '#ff6b6b';
      } else {
        this.minimapCtx.fillStyle = player.color;
      }
      
      this.minimapCtx.beginPath();
      this.minimapCtx.arc(x, y, radius, 0, Math.PI * 2);
      this.minimapCtx.fill();
    });
    
    // Draw camera view area
    this.minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.minimapCtx.lineWidth = 1;
    this.minimapCtx.strokeRect(
      this.camera.x * scale,
      this.camera.y * scale,
      this.canvas.width * scale,
      this.canvas.height * scale
    );
  }

  gameOver() {
    this.stop();
    UI.showGameOver(this.localPlayer.score, this.getPlayerRank(), this.gameTime);
  }

  getPlayerRank() {
    const sortedPlayers = Array.from(this.players.values()).sort((a, b) => b.score - a.score);
    return sortedPlayers.findIndex(player => player === this.localPlayer) + 1;
  }

  getLeaderboard() {
    return Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(player => ({
        name: player.name,
        score: player.score
      }));
  }
}