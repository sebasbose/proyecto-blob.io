// main.js - Main application entry point and initialization
let game;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Blob.io - Inicializando aplicación...');
  
  try {
    // Create game instance
    game = new Game();
    
    // Initialize game systems
    game.init();
    
    // Setup global error handling
    setupErrorHandling();
    
    // Setup development tools
    setupDevelopmentTools();
    
    // Focus on name input
    const nameInput = document.getElementById('playerName');
    if (nameInput) {
      nameInput.focus();
    }
    
    console.log('Blob.io - Aplicación inicializada correctamente');
    
  } catch (error) {
    console.error('Error inicializando la aplicación:', error);
    showCriticalError('Error al inicializar el juego. Por favor, recarga la página.');
  }
});

// Global error handling
function setupErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
    
    if (game && game.isRunning) {
      // Try to pause the game on error
      try {
        game.pause();
      } catch (e) {
        console.error('Error pausando el juego:', e);
      }
    }
    
    // Show user-friendly error message
    showError('Se produjo un error inesperado. El juego ha sido pausado.');
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rechazada:', event.reason);
    event.preventDefault();
  });
}

// Development tools and debugging
function setupDevelopmentTools() {
  // Only enable in development
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';

  if (isDevelopment) {
    // Add development keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey) {
        switch (e.code) {
          case 'KeyD':
            e.preventDefault();
            toggleDebugMode();
            break;
          case 'KeyG':
            e.preventDefault();
            toggleGodMode();
            break;
          case 'KeyF':
            e.preventDefault();
            spawnFood();
            break;
          case 'KeyR':
            e.preventDefault();
            if (confirm('¿Recargar la página?')) {
              window.location.reload();
            }
            break;
        }
      }
    });

    // Expose game object for debugging
    window.game = game;
    window.debugInfo = {
      getGameState: () => ({
        isRunning: game?.isRunning,
        isPaused: game?.isPaused,
        playerCount: game?.players.size,
        foodCount: game?.food.length,
        worldSize: game?.worldSize,
        camera: game?.camera,
        localPlayer: game?.localPlayer?.getStats()
      }),
      addAIPlayer: (name = 'Debug_Bot') => {
        if (game && game.isRunning) {
          const ai = game.createPlayer(name, false);
          ai.isAI = true;
          return ai;
        }
      },
      teleportPlayer: (x, y) => {
        if (game?.localPlayer) {
          game.localPlayer.x = x;
          game.localPlayer.y = y;
        }
      }
    };

    console.log('Modo desarrollo activado. Comandos disponibles:');
    console.log('- Ctrl+Shift+D: Toggle debug mode');
    console.log('- Ctrl+Shift+G: Toggle god mode');
    console.log('- Ctrl+Shift+F: Spawn food');
    console.log('- Ctrl+Shift+R: Reload page');
    console.log('- Ctrl+Shift+P: Toggle performance info');
  }
}

let debugMode = false;
function toggleDebugMode() {
  debugMode = !debugMode;
  console.log('Debug mode:', debugMode ? 'ON' : 'OFF');
  
  if (debugMode) {
    // Add debug overlays
    addDebugOverlay();
  } else {
    // Remove debug overlays
    removeDebugOverlay();
  }
}

let godMode = false;
function toggleGodMode() {
  godMode = !godMode;
  console.log('God mode:', godMode ? 'ON' : 'OFF');
  
  if (godMode && game?.localPlayer) {
    // Make player invulnerable and fast
    game.localPlayer.originalMaxSpeed = game.localPlayer.maxSpeed;
    game.localPlayer.maxSpeed = 10;
    game.localPlayer.invulnerable = true;
  } else if (game?.localPlayer) {
    // Restore normal properties
    game.localPlayer.maxSpeed = game.localPlayer.originalMaxSpeed || 3;
    game.localPlayer.invulnerable = false;
  }
}

function spawnFood() {
  if (game && game.isRunning) {
    for (let i = 0; i < 10; i++) {
      game.spawnFood();
    }
    console.log('Spawned 10 food items');
  }
}

function addDebugOverlay() {
  if (document.getElementById('debug-overlay')) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'debug-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 100px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    border-radius: 5px;
    z-index: 10000;
    max-width: 300px;
  `;
  
  document.body.appendChild(overlay);
  
  // Update debug info periodically
  const updateDebugInfo = () => {
    if (overlay && debugMode && game) {
      const player = game.localPlayer;
      overlay.innerHTML = `
        <strong>DEBUG INFO</strong><br>
        FPS: ${Math.round(1 / (game.deltaTime || 0.016))}<br>
        Player: ${player ? `${Math.round(player.x)}, ${Math.round(player.y)}` : 'None'}<br>
        Radius: ${player ? Math.round(player.radius) : 'None'}<br>
        Score: ${player ? player.score : 'None'}<br>
        Speed: ${player ? Math.round(Math.sqrt(player.velocityX**2 + player.velocityY**2) * 100) / 100 : 'None'}<br>
        Players: ${game.players.size}<br>
        Food: ${game.food.length}<br>
        Camera: ${Math.round(game.camera.x)}, ${Math.round(game.camera.y)}<br>
        Zoom: ${Math.round(game.zoom * 100) / 100}<br>
        God Mode: ${godMode ? 'ON' : 'OFF'}
      `;
    }
  };
  
  overlay.updateInterval = setInterval(updateDebugInfo, 100);
}

function removeDebugOverlay() {
  const overlay = document.getElementById('debug-overlay');
  if (overlay) {
    if (overlay.updateInterval) {
      clearInterval(overlay.updateInterval);
    }
    overlay.remove();
  }
}

// Utility functions
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 10px;
    z-index: 10000;
    text-align: center;
    max-width: 80%;
    font-weight: bold;
  `;
  errorDiv.textContent = message;
  
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

function showCriticalError(message) {
  // Remove any existing game elements
  const gameContainer = document.getElementById('gameContainer');
  if (gameContainer) {
    gameContainer.style.display = 'none';
  }
  
  // Show critical error overlay
  const errorOverlay = document.createElement('div');
  errorOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    text-align: center;
    padding: 20px;
  `;
  
  errorOverlay.innerHTML = `
    <h1 style="font-size: 3em; margin-bottom: 20px;">⚠️</h1>
    <h2 style="margin-bottom: 20px;">Error Crítico</h2>
    <p style="font-size: 1.2em; margin-bottom: 30px;">${message}</p>
    <button onclick="window.location.reload()" style="
      padding: 15px 30px;
      font-size: 1.1em;
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-weight: bold;
    ">Recargar Página</button>
  `;
  
  document.body.appendChild(errorOverlay);
}

// Performance monitoring
let performanceMonitor = {
  frameCount: 0,
  lastTime: performance.now(),
  fps: 0,
  
  update() {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
      
      // Log performance warnings
      if (this.fps < 30) {
        console.warn(`Low FPS detected: ${this.fps}`);
      }
    }
  },
  
  getFPS() {
    return this.fps;
  }
};

// Auto-save user preferences
function saveUserPreferences() {
  const prefs = {
    lastPlayerName: document.getElementById('playerName')?.value || '',
    volume: 1.0,
    graphics: 'high'
  };
  
  try {
    localStorage.setItem('blobio_preferences', JSON.stringify(prefs));
  } catch (e) {
    console.warn('Could not save preferences:', e);
  }
}

function loadUserPreferences() {
  try {
    const prefs = JSON.parse(localStorage.getItem('blobio_preferences') || '{}');
    
    const nameInput = document.getElementById('playerName');
    if (nameInput && prefs.lastPlayerName) {
      nameInput.value = prefs.lastPlayerName;
    }
    
    return prefs;
  } catch (e) {
    console.warn('Could not load preferences:', e);
    return {};
  }
}

// Load preferences on startup
document.addEventListener('DOMContentLoaded', () => {
  loadUserPreferences();
});

// Save preferences before page unload
window.addEventListener('beforeunload', () => {
  saveUserPreferences();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden, pause game if running
    if (game && game.isRunning && !game.isPaused) {
      game.pause();
      if (ui) {
        ui.pauseGame();
      }
    }
  }
});

// Prevent accidental page reload during game
window.addEventListener('beforeunload', (e) => {
  if (game && game.isRunning && !game.isPaused) {
    e.preventDefault();
    e.returnValue = '¿Estás seguro de que quieres salir? Tu progreso se perderá.';
    return e.returnValue;
  }
});

// Handle online/offline status
window.addEventListener('online', () => {
  console.log('Connection restored');
  // Future: Handle reconnection logic
});

window.addEventListener('offline', () => {
  console.log('Connection lost');
  // Future: Handle offline mode
  if (game && game.isRunning) {
    showError('Conexión perdida. El juego continuará en modo offline.');
  }
});

// Mobile device detection and optimization
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

if (isMobileDevice()) {
  // Add mobile-specific optimizations
  document.body.classList.add('mobile-device');
  
  // Prevent zoom on input focus
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  }
  
  // Add touch feedback
  document.body.style.touchAction = 'manipulation';
}

console.log('Blob.io - Main script loaded');

// Export for debugging
if (typeof window !== 'undefined') {
  window.BlobIO = {
    game: () => game,
    ui: () => ui,
    debug: {
      toggleDebugMode,
      toggleGodMode,
      spawnFood,
      performanceMonitor
    }
  };
}