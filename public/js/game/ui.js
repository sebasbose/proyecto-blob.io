// ui.js - User Interface management
class UI {
  constructor() {
    this.elements = {};
    this.initializeElements();
    this.setupEventListeners();
    this.leaderboardUpdateInterval = null;
    this.currentScreen = 'mainMenu';
  }

  initializeElements() {
    // Main menu elements
    this.elements.mainMenu = document.getElementById('mainMenu');
    this.elements.playerNameInput = document.getElementById('playerName');
    this.elements.playButton = document.getElementById('playButton');
    
    // Game container and HUD
    this.elements.gameContainer = document.getElementById('gameContainer');
    this.elements.playerScore = document.getElementById('playerScore');
    this.elements.playerNameDisplay = document.getElementById('playerNameDisplay');
    this.elements.pauseButton = document.getElementById('pauseButton');
    this.elements.profileButton = document.getElementById('profileButton');
    this.elements.exitButton = document.getElementById('exitButton');
    
    // Leaderboard
    this.elements.leaderboardList = document.getElementById('leaderboardList');
    
    // Pause menu
    this.elements.pauseMenu = document.getElementById('pauseMenu');
    this.elements.resumeButton = document.getElementById('resumeButton');
    this.elements.restartButton = document.getElementById('restartButton');
    this.elements.homeButton = document.getElementById('homeButton');
    
    // Game over menu
    this.elements.gameOverMenu = document.getElementById('gameOverMenu');
    this.elements.finalScore = document.getElementById('finalScore');
    this.elements.finalPosition = document.getElementById('finalPosition');
    this.elements.gameTime = document.getElementById('gameTime');
    this.elements.playAgainButton = document.getElementById('playAgainButton');
    this.elements.backToMenuButton = document.getElementById('backToMenuButton');
  }

  setupEventListeners() {
    // Main menu
    this.elements.playButton.addEventListener('click', () => {
      this.startGame();
    });

    this.elements.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.startGame();
      }
    });

    // Game controls
    this.elements.pauseButton.addEventListener('click', () => {
      this.togglePause();
    });

    this.elements.profileButton.addEventListener('click', () => {
      this.showConfirmExit('profile');
    });

    this.elements.exitButton.addEventListener('click', () => {
      this.showConfirmExit();
    });

    // Pause menu
    this.elements.resumeButton.addEventListener('click', () => {
      this.resumeGame();
    });

    this.elements.restartButton.addEventListener('click', () => {
      this.restartGame();
    });

    this.elements.homeButton.addEventListener('click', () => {
      this.goToMainMenu();
    });

    // Game over menu
    this.elements.playAgainButton.addEventListener('click', () => {
      this.restartGame();
    });

    this.elements.backToMenuButton.addEventListener('click', () => {
      this.goToMainMenu();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyPress(e);
    });

    // Prevent zoom on mobile
    document.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    }, { passive: false });

    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && game.isRunning && !game.isPaused) {
        this.pauseGame();
      }
    });
  }

  handleKeyPress(e) {
    switch (e.code) {
      case 'Space':
        if (this.currentScreen === 'game') {
          e.preventDefault();
          this.togglePause();
        }
        break;
      case 'Escape':
        if (this.currentScreen === 'game' && !game.isPaused) {
          this.pauseGame();
        } else if (this.currentScreen === 'pause') {
          this.resumeGame();
        }
        break;
      case 'Enter':
        if (this.currentScreen === 'mainMenu') {
          this.startGame();
        }
        break;
      case 'KeyR':
        if (this.currentScreen === 'gameOver') {
          this.restartGame();
        }
        break;
    }
  }

  startGame() {
    const playerName = this.elements.playerNameInput.value.trim();
    
    if (!playerName) {
      this.showError('Por favor, ingresa tu nombre');
      this.elements.playerNameInput.focus();
      return;
    }

    if (playerName.length > 15) {
      this.showError('El nombre debe tener máximo 15 caracteres');
      return;
    }

    // Sanitize player name
    const sanitizedName = this.sanitizeName(playerName);
    
    this.hideAllScreens();
    this.elements.gameContainer.classList.remove('hidden');
    this.elements.playerNameDisplay.textContent = sanitizedName;
    this.currentScreen = 'game';
    
    // Start the game
    game.start(sanitizedName);
    
    // Start UI updates
    this.startLeaderboardUpdates();
    
    console.log('Starting game for:', sanitizedName);
  }

  sanitizeName(name) {
    // Remove special characters and limit length
    return name.replace(/[<>\"'&]/g, '').substring(0, 15);
  }

  showError(message) {
    // Create temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 107, 107, 0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-weight: bold;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  pauseGame() {
    game.pause();
    this.elements.pauseMenu.classList.remove('hidden');
    this.elements.pauseButton.textContent = '▶';
    this.currentScreen = 'pause';
    this.stopLeaderboardUpdates();
  }

  resumeGame() {
    game.resume();
    this.elements.pauseMenu.classList.add('hidden');
    this.elements.pauseButton.textContent = '⏸';
    this.currentScreen = 'game';
    this.startLeaderboardUpdates();
  }

  togglePause() {
    if (game.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  restartGame() {
    const playerName = this.elements.playerNameDisplay.textContent;
    this.hideAllScreens();
    this.elements.gameContainer.classList.remove('hidden');
    this.currentScreen = 'game';
    
    game.stop();
    game.start(playerName);
    
    this.elements.pauseButton.textContent = '⏸';
    this.startLeaderboardUpdates();
  }

  exitGame(popToView) {
    game.stop();
    this.hideAllScreens();
    this.elements.mainMenu.classList.remove('hidden');
    this.currentScreen = 'mainMenu';
    this.stopLeaderboardUpdates();
    
    // Clear the name input for fresh start
    this.elements.playerNameInput.value = '';
    this.elements.playerNameInput.focus();

    if (popToView === 'profile') {
      window.location.href = '/profile.html';
    }
  }

  showConfirmExit(popToView = null) {
    if (confirm('¿Estás seguro de que quieres salir del juego?')) {
      this.exitGame(popToView);
    }
  }

  showGameOver(score, position, gameTime) {
    this.stopLeaderboardUpdates();
    
    this.elements.finalScore.textContent = score;
    this.elements.finalPosition.textContent = position;
    this.elements.gameTime.textContent = this.formatTime(gameTime);
    
    this.elements.gameOverMenu.classList.remove('hidden');
    this.currentScreen = 'gameOver';
    
    // Add some celebration effect for good performance
    if (position <= 3) {
      this.showCelebration();
    }
  }

  showCelebration() {
    // Add confetti or celebration animation
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.innerHTML = '🎉🎊🏆';
    celebration.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 3em;
      z-index: 10001;
      animation: celebration 2s ease-out;
      pointer-events: none;
    `;
    
    // Add CSS animation
    if (!document.querySelector('#celebration-style')) {
      const style = document.createElement('style');
      style.id = 'celebration-style';
      style.textContent = `
        @keyframes celebration {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(celebration);
    
    setTimeout(() => {
      if (celebration.parentNode) {
        celebration.parentNode.removeChild(celebration);
      }
    }, 2000);
  }

  hideAllScreens() {
    this.elements.mainMenu.classList.add('hidden');
    this.elements.gameContainer.classList.add('hidden');
    this.elements.pauseMenu.classList.add('hidden');
    this.elements.gameOverMenu.classList.add('hidden');
  }

  updateScore(score) {
    this.elements.playerScore.textContent = score;
  }

  startLeaderboardUpdates() {
    this.stopLeaderboardUpdates();
    this.leaderboardUpdateInterval = setInterval(() => {
      this.updateLeaderboard();
    }, 1000);
  }

  stopLeaderboardUpdates() {
    if (this.leaderboardUpdateInterval) {
      clearInterval(this.leaderboardUpdateInterval);
      this.leaderboardUpdateInterval = null;
    }
  }

  updateLeaderboard() {
    if (!game.isRunning) return;
    
    const leaderboard = game.getLeaderboard();
    this.elements.leaderboardList.innerHTML = '';
    
    leaderboard.forEach((player, index) => {
      const li = document.createElement('li');
      
      const playerName = document.createElement('span');
      playerName.textContent = player.name;
      playerName.className = 'player-name';
      
      const playerScore = document.createElement('span');
      playerScore.textContent = player.score;
      playerScore.className = 'player-score';
      
      li.appendChild(playerName);
      li.appendChild(playerScore);
      
      // Highlight local player
      if (game.localPlayer && player.name === game.localPlayer.name) {
        li.classList.add('local-player');
        li.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4)';
      }
      
      this.elements.leaderboardList.appendChild(li);
    });
    
    // Update local player score in HUD
    if (game.localPlayer) {
      this.updateScore(game.localPlayer.score);
    }
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Responsive UI adjustments
  handleResize() {
    // Adjust UI elements based on screen size
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // Hide leaderboard and minimap on very small screens
      const leaderboard = document.querySelector('.leaderboard');
      const minimap = document.querySelector('.minimap-container');
      
      if (window.innerWidth < 480) {
        leaderboard.style.display = 'none';
        minimap.style.display = 'none';
      } else {
        leaderboard.style.display = 'block';
        minimap.style.display = 'block';
      }
    }
  }

  // Touch controls for mobile
  setupTouchControls() {
    let touchStartX, touchStartY;
    
    this.elements.gameContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    });

    this.elements.gameContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (game.localPlayer && game.isRunning && !game.isPaused) {
        const touch = e.touches[0];
        const rect = game.canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Convert to world coordinates
        const worldX = touchX + game.camera.x;
        const worldY = touchY + game.camera.y;
        
        game.localPlayer.setTarget(worldX, worldY);
      }
    });
  }

  // Performance monitoring
  showPerformanceInfo() {
    if (!this.performanceDisplay) {
      this.performanceDisplay = document.createElement('div');
      this.performanceDisplay.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px;
        font-family: monospace;
        font-size: 12px;
        border-radius: 5px;
        z-index: 1000;
      `;
      document.body.appendChild(this.performanceDisplay);
    }
    
    if (game.isRunning) {
      const fps = Math.round(1 / game.deltaTime);
      const playerCount = game.players.size;
      const foodCount = game.food.length;
      
      this.performanceDisplay.innerHTML = `
        FPS: ${fps}<br>
        Players: ${playerCount}<br>
        Food: ${foodCount}<br>
        Camera: ${Math.round(game.camera.x)}, ${Math.round(game.camera.y)}
      `;
    }
  }

  hidePerformanceInfo() {
    if (this.performanceDisplay) {
      this.performanceDisplay.remove();
      this.performanceDisplay = null;
    }
  }
}

// Initialize UI when DOM is loaded
let ui;
document.addEventListener('DOMContentLoaded', () => {
  ui = new UI();
  
  // Setup resize handler
  window.addEventListener('resize', () => {
    ui.handleResize();
  });
  
  // Setup touch controls for mobile
  if ('ontouchstart' in window) {
    ui.setupTouchControls();
  }
  
  // Development: Show performance info with Ctrl+Shift+P
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyP') {
      if (ui.performanceDisplay) {
        ui.hidePerformanceInfo();
      } else {
        ui.showPerformanceInfo();
        setInterval(() => ui.showPerformanceInfo(), 1000);
      }
    }
  });
});