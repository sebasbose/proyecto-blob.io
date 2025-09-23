// JavaScript para la página de Perfil con datos mock
class ProfileManager {
  constructor() {
    this.currentTab = 'overview';
    this.userData = this.generateMockUserData();
    this.achievements = this.generateMockAchievements();
    this.matchHistory = this.generateMockMatchHistory();
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateProfileDisplay();
    this.setupTabNavigation();
    this.initializeCharts();
  }

  generateMockUserData() {
    return {
      username: 'SebasPlayer',
      email: 'sebas@example.com',
      bio: 'Jugador apasionado de Blob.io desde 2024',
      level: 24,
      currentXP: 6750,
      maxXP: 10000,
      maxScore: 15847,
      globalRank: 47,
      totalWins: 23,
      totalScore: 347291,
      gamesPlayed: 156,
      totalTime: '47h 23m',
      winRate: 14.7,
      averageScore: 4237,
      bestStreak: 5,
      averageLifeTime: '3m 45s',
      eliminatedPlayers: 89,
      timesEliminated: 133,
      kdRatio: 0.67,
      avatar: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
      joinDate: '2024-01-15',
      lastActive: 'En línea ahora',
      settings: {
        colorScheme: 'random',
        showGrid: true,
        showNames: true,
        soundEffects: true,
        profilePublic: true,
        showOnline: false,
        allowFriendRequests: true
      }
    };
  }

  generateMockAchievements() {
    return [
      {
        id: 1,
        name: 'Rey del Blob',
        description: 'Alcanza el primer lugar 5 veces',
        icon: 'fas fa-crown',
        rarity: 'gold',
        unlocked: true,
        unlockedDate: '2024-03-15',
        progress: 5,
        maxProgress: 5
      },
      {
        id: 2,
        name: 'Comedor Experto',
        description: 'Come 1000 puntos de comida',
        icon: 'fas fa-target',
        rarity: 'silver',
        unlocked: true,
        unlockedDate: '2024-03-08',
        progress: 1000,
        maxProgress: 1000
      },
      {
        id: 3,
        name: 'Maratonista',
        description: 'Juega por 30 minutos seguidos',
        icon: 'fas fa-hourglass',
        rarity: 'bronze',
        unlocked: true,
        unlockedDate: '2024-03-01',
        progress: 30,
        maxProgress: 30
      },
      {
        id: 4,
        name: 'Gigante',
        description: 'Alcanza un tamaño de 100 o más',
        icon: 'fas fa-expand-arrows-alt',
        rarity: 'gold',
        unlocked: true,
        unlockedDate: '2024-02-28',
        progress: 127,
        maxProgress: 100
      },
      {
        id: 5,
        name: 'Velocista',
        description: 'Elimina 3 jugadores en menos de 10 segundos',
        icon: 'fas fa-bolt',
        rarity: 'silver',
        unlocked: false,
        progress: 2,
        maxProgress: 3
      },
      {
        id: 6,
        name: 'Superviviente',
        description: 'Sobrevive 15 minutos en una partida',
        icon: 'fas fa-shield-alt',
        rarity: 'gold',
        unlocked: false,
        progress: 847,
        maxProgress: 900
      },
      {
        id: 7,
        name: 'Depredador',
        description: 'Elimina 50 jugadores',
        icon: 'fas fa-skull',
        rarity: 'silver',
        unlocked: false,
        progress: 34,
        maxProgress: 50
      },
      {
        id: 8,
        name: 'Novato',
        description: 'Completa tu primera partida',
        icon: 'fas fa-baby',
        rarity: 'bronze',
        unlocked: true,
        unlockedDate: '2024-01-15',
        progress: 1,
        maxProgress: 1
      }
    ];
  }

  generateMockMatchHistory() {
    const history = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      const match = {
        id: i + 1,
        date: date.toLocaleDateString(),
        score: Math.floor(Math.random() * 20000) + 1000,
        position: Math.floor(Math.random() * 20) + 1,
        totalPlayers: Math.floor(Math.random() * 10) + 15,
        duration: this.getRandomDuration(),
        result: Math.random() > 0.85 ? 'win' : 'loss',
        eliminatedBy: Math.random() > 0.5 ? 'ProGamer99' : 'BlobMaster',
        playersEliminated: Math.floor(Math.random() * 8)
      };
      
      history.push(match);
    }
    
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  getRandomDuration() {
    const minutes = Math.floor(Math.random() * 15) + 1;
    const seconds = Math.floor(Math.random() * 60);
    return `${minutes}m ${seconds}s`;
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab || e.target.closest('.tab-btn').dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        this.switchTab('settings');
      });
    }

    // Share profile button
    const shareProfileBtn = document.getElementById('shareProfileBtn');
    if (shareProfileBtn) {
      shareProfileBtn.addEventListener('click', () => {
        this.shareProfile();
      });
    }

    // Edit avatar button
    const editAvatarBtn = document.querySelector('.edit-avatar-btn');
    if (editAvatarBtn) {
      editAvatarBtn.addEventListener('click', () => {
        this.openAvatarModal();
      });
    }

    // Settings form
    this.setupSettingsListeners();

    // History filters
    this.setupHistoryFilters();
  }

  setupTabNavigation() {
    // Activar el primer tab por defecto
    this.switchTab('overview');
  }

  switchTab(tabName) {
    // Remover clase active de todos los tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activar el tab seleccionado
    const selectedBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(tabName);

    if (selectedBtn && selectedContent) {
      selectedBtn.classList.add('active');
      selectedContent.classList.add('active');
      this.currentTab = tabName;

      // Cargar contenido específico del tab
      switch (tabName) {
        case 'achievements':
          this.loadAchievements();
          break;
        case 'history':
          this.loadMatchHistory();
          break;
        case 'statistics':
          this.updateStatistics();
          break;
      }
    }
  }

  updateProfileDisplay() {
    // Actualizar información básica del perfil
    const usernameElements = document.querySelectorAll('.username');
    usernameElements.forEach(el => el.textContent = this.userData.username);

    // Actualizar avatar
    const avatarElements = document.querySelectorAll('#userBlob, .avatar-blob');
    avatarElements.forEach(el => {
      el.style.background = this.userData.avatar;
    });

    // Actualizar estadísticas rápidas
    const quickStats = document.querySelectorAll('.quick-stat .stat-value');
    if (quickStats.length >= 3) {
      quickStats[0].textContent = this.userData.maxScore.toLocaleString();
      quickStats[1].textContent = `#${this.userData.globalRank}`;
      quickStats[2].textContent = this.userData.totalWins;
    }

    // Actualizar nivel y progreso
    this.updateLevelProgress();

    // Actualizar estadísticas generales
    this.updateGeneralStats();
  }

  updateLevelProgress() {
    const levelElement = document.querySelector('.current-level');
    const progressFill = document.querySelector('.level-progress .progress-fill');
    const progressText = document.querySelector('.progress-text');
    const nextLevelText = document.querySelector('.next-level');

    if (levelElement) levelElement.textContent = this.userData.level;
    
    if (progressFill) {
      const percentage = (this.userData.currentXP / this.userData.maxXP) * 100;
      progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
      const spans = progressText.querySelectorAll('span');
      if (spans.length >= 2) {
        spans[0].textContent = `${this.userData.currentXP.toLocaleString()} / ${this.userData.maxXP.toLocaleString()} XP`;
        spans[1].textContent = `${Math.round((this.userData.currentXP / this.userData.maxXP) * 100)}%`;
      }
    }

    if (nextLevelText) {
      const remaining = this.userData.maxXP - this.userData.currentXP;
      nextLevelText.textContent = `${remaining.toLocaleString()} XP para el siguiente nivel`;
    }
  }

  updateGeneralStats() {
    const statValues = document.querySelectorAll('.stats-list .stat-item .stat-value');
    if (statValues.length >= 5) {
      statValues[0].textContent = this.userData.totalScore.toLocaleString();
      statValues[1].textContent = this.userData.gamesPlayed;
      statValues[2].textContent = this.userData.totalTime;
      statValues[3].textContent = this.userData.totalWins;
      statValues[4].textContent = `${this.userData.winRate}%`;
    }
  }

  loadAchievements() {
    const achievementsGrid = document.getElementById('achievementsGrid');
    if (!achievementsGrid) return;

    achievementsGrid.innerHTML = '';

    this.achievements.forEach(achievement => {
      const achievementCard = document.createElement('div');
      achievementCard.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
      
      const progressPercentage = Math.round((achievement.progress / achievement.maxProgress) * 100);
      
      achievementCard.innerHTML = `
        <div class="achievement-icon ${achievement.rarity}">
          <i class="${achievement.icon}"></i>
        </div>
        <div class="achievement-content">
          <h4>${achievement.name}</h4>
          <p>${achievement.description}</p>
          <div class="achievement-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <span>${achievement.progress}/${achievement.maxProgress}</span>
          </div>
          ${achievement.unlocked ? 
            `<div class="unlock-date">Desbloqueado el ${new Date(achievement.unlockedDate).toLocaleDateString()}</div>` :
            `<div class="unlock-date">${progressPercentage}% completado</div>`
          }
        </div>
      `;

      achievementCard.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 20px;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        border: 2px solid ${achievement.unlocked ? 'rgba(76, 175, 80, 0.5)' : 'transparent'};
        opacity: ${achievement.unlocked ? '1' : '0.7'};
      `;

      if (!achievement.unlocked) {
        achievementCard.style.filter = 'grayscale(50%)';
      }

      achievementsGrid.appendChild(achievementCard);
    });

    // Agregar estilos para las tarjetas de logros
    const style = document.createElement('style');
    style.textContent = `
      .achievement-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
      .achievement-card .achievement-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5em;
        color: #fff;
        margin-bottom: 15px;
      }
      .achievement-card .achievement-content h4 {
        color: #fff;
        margin-bottom: 10px;
      }
      .achievement-card .achievement-content p {
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 15px;
        font-size: 0.9em;
      }
      .achievement-card .unlock-date {
        font-size: 0.8em;
        color: #4ecdc4;
        margin-top: 10px;
      }
    `;
    document.head.appendChild(style);
  }

  loadMatchHistory() {
    const historyTableBody = document.getElementById('historyTableBody');
    if (!historyTableBody) return;

    historyTableBody.innerHTML = '';

    this.matchHistory.slice(0, 20).forEach(match => {
      const row = document.createElement('tr');
      
      const resultIcon = match.result === 'win' ? 
        '<i class="fas fa-trophy" style="color: #4caf50;"></i>' :
        '<i class="fas fa-skull" style="color: #f44336;"></i>';
      
      const resultText = match.result === 'win' ? 'Victoria' : 'Derrota';
      const resultColor = match.result === 'win' ? '#4caf50' : '#f44336';

      row.innerHTML = `
        <td style="color: rgba(255,255,255,0.8);">${match.date}</td>
        <td style="font-weight: bold; color: #4ecdc4;">${match.score.toLocaleString()}</td>
        <td>
          <span style="color: ${match.position <= 3 ? '#ffd700' : '#fff'}; font-weight: bold;">
            #${match.position}
          </span>
          <span style="color: rgba(255,255,255,0.6); font-size: 0.9em;">
            / ${match.totalPlayers}
          </span>
        </td>
        <td style="color: rgba(255,255,255,0.8);">${match.duration}</td>
        <td style="color: rgba(255,255,255,0.6);">${match.totalPlayers}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px; color: ${resultColor};">
            ${resultIcon}
            <span style="font-weight: bold;">${resultText}</span>
          </div>
        </td>
      `;

      // Resaltar victorias y top 3
      if (match.result === 'win' || match.position <= 3) {
        row.style.background = `linear-gradient(45deg, ${resultColor}20, ${resultColor}10)`;
      }

      historyTableBody.appendChild(row);
    });
  }

  setupHistoryFilters() {
    const historyFilter = document.getElementById('historyFilter');
    const dateFilter = document.getElementById('dateFilter');

    if (historyFilter) {
      historyFilter.addEventListener('change', () => {
        this.filterMatchHistory();
      });
    }

    if (dateFilter) {
      dateFilter.addEventListener('change', () => {
        this.filterMatchHistory();
      });
    }
  }

  filterMatchHistory() {
    // En una aplicación real, esto filtraría los datos del servidor
    this.loadMatchHistory();
  }

  updateStatistics() {
    // Actualizar estadísticas detalladas
    const statRows = document.querySelectorAll('.stat-category .stat-row');
    
    if (statRows.length >= 6) {
      // Rendimiento
      statRows[0].children[1].textContent = this.userData.averageScore.toLocaleString();
      statRows[1].children[1].textContent = `${this.userData.bestStreak} victorias`;
      statRows[2].children[1].textContent = this.userData.averageLifeTime;
      
      // Combate
      statRows[3].children[1].textContent = this.userData.eliminatedPlayers;
      statRows[4].children[1].textContent = this.userData.timesEliminated;
      statRows[5].children[1].textContent = this.userData.kdRatio;
    }
  }

  initializeCharts() {
    // Simular gráfico de progreso (en una app real usarías Chart.js o similar)
    const canvas = document.getElementById('scoreChart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      this.drawScoreChart(ctx, canvas.width, canvas.height);
    }
  }

  drawScoreChart(ctx, width, height) {
    // Datos simulados para el gráfico
    const data = [];
    for (let i = 0; i < 30; i++) {
      data.push(Math.floor(Math.random() * 5000) + 2000);
    }

    // Limpiar canvas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Configurar estilo
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(78, 205, 196, 0.2)';

    // Dibujar línea
    ctx.beginPath();
    const stepX = width / (data.length - 1);
    const maxY = Math.max(...data);
    const minY = Math.min(...data);
    const rangeY = maxY - minY;

    data.forEach((value, index) => {
      const x = index * stepX;
      const y = height - ((value - minY) / rangeY) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Rellenar área bajo la curva
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  }

  setupSettingsListeners() {
    // Save settings button
    const saveBtn = document.getElementById('saveSettings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    // Reset settings button
    const resetBtn = document.getElementById('resetSettings');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetSettings();
      });
    }

    // Load current settings
    this.loadCurrentSettings();
  }

  loadCurrentSettings() {
    // Cargar configuración actual en el formulario
    const usernameInput = document.getElementById('usernameInput');
    const emailInput = document.getElementById('emailInput');
    const bioInput = document.getElementById('bioInput');

    if (usernameInput) usernameInput.value = this.userData.username;
    if (emailInput) emailInput.value = this.userData.email;
    if (bioInput) bioInput.value = this.userData.bio;

    // Configuración de juego
    Object.keys(this.userData.settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = this.userData.settings[key];
        } else {
          element.value = this.userData.settings[key];
        }
      }
    });
  }

  saveSettings() {
    // Obtener valores del formulario
    const usernameInput = document.getElementById('usernameInput');
    const emailInput = document.getElementById('emailInput');
    const bioInput = document.getElementById('bioInput');

    if (usernameInput) this.userData.username = usernameInput.value;
    if (emailInput) this.userData.email = emailInput.value;
    if (bioInput) this.userData.bio = bioInput.value;

    // Guardar configuración de juego
    Object.keys(this.userData.settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          this.userData.settings[key] = element.checked;
        } else {
          this.userData.settings[key] = element.value;
        }
      }
    });

    // Actualizar display
    this.updateProfileDisplay();

    // Mostrar confirmación
    this.showToast('Configuración guardada exitosamente', 'success');
  }

  resetSettings() {
    if (confirm('¿Estás seguro de que quieres restablecer toda la configuración?')) {
      this.userData.settings = {
        colorScheme: 'random',
        showGrid: true,
        showNames: true,
        soundEffects: true,
        profilePublic: true,
        showOnline: false,
        allowFriendRequests: true
      };
      
      this.loadCurrentSettings();
      this.showToast('Configuración restablecida', 'info');
    }
  }

  openAvatarModal() {
    const modal = document.getElementById('avatarModal');
    if (modal) {
      modal.style.display = 'block';
      this.setupAvatarCustomizer();
    }
  }

  setupAvatarCustomizer() {
    const colorOptions = document.querySelectorAll('.color-option');
    const previewBlob = document.getElementById('previewBlob');
    const saveAvatarBtn = document.getElementById('saveAvatar');
    const cancelAvatarBtn = document.getElementById('cancelAvatar');
    const modal = document.getElementById('avatarModal');

    let selectedColor = this.userData.avatar;

    // Preview inicial
    if (previewBlob) {
      previewBlob.style.background = selectedColor;
    }

    // Color selection
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        colorOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        const color = option.dataset.color;
        selectedColor = this.getColorGradient(color);
        
        if (previewBlob) {
          previewBlob.style.background = selectedColor;
        }
      });
    });

    // Save avatar
    if (saveAvatarBtn) {
      saveAvatarBtn.addEventListener('click', () => {
        this.userData.avatar = selectedColor;
        this.updateProfileDisplay();
        modal.style.display = 'none';
        this.showToast('Avatar actualizado', 'success');
      });
    }

    // Cancel
    if (cancelAvatarBtn) {
      cancelAvatarBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    // Close modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  getColorGradient(color) {
    const gradients = {
      red: 'linear-gradient(45deg, #ff6b6b, #ff5722)',
      blue: 'linear-gradient(45deg, #4ecdc4, #45b7d1)',
      green: 'linear-gradient(45deg, #96ceb4, #66bb6a)',
      purple: 'linear-gradient(45deg, #ab47bc, #ec407a)',
      orange: 'linear-gradient(45deg, #ffa726, #ff7043)',
      pink: 'linear-gradient(45deg, #ec407a, #e91e63)'
    };
    return gradients[color] || gradients.red;
  }

  shareProfile() {
    // Simular compartir perfil
    const profileURL = `${window.location.origin}/profile.html?user=${this.userData.username}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${this.userData.username} - Blob.io`,
        text: `¡Mira mi perfil en Blob.io! Nivel ${this.userData.level} con ${this.userData.totalWins} victorias.`,
        url: profileURL
      });
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(profileURL).then(() => {
        this.showToast('Enlace del perfil copiado al portapapeles', 'success');
      });
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 15px 20px;
      border-radius: 10px;
      backdrop-filter: blur(10px);
      z-index: 3000;
      animation: slideIn 0.3s ease;
    `;

    if (type === 'success') {
      toast.style.borderLeft = '4px solid #4caf50';
    } else if (type === 'error') {
      toast.style.borderLeft = '4px solid #f44336';
    } else {
      toast.style.borderLeft = '4px solid #4ecdc4';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  const profileManager = new ProfileManager();
  
  // Animaciones de entrada
  setTimeout(() => {
    document.querySelectorAll('.stats-card, .level-card, .recent-achievements, .recent-matches').forEach((card, index) => {
      setTimeout(() => {
        card.style.animation = 'fadeIn 0.6s ease-out';
      }, index * 100);
    });
  }, 500);
});

// Agregar estilos para animaciones
const animationStyles = document.createElement('style');
animationStyles.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(animationStyles);

// Exportar para debugging
window.ProfileManager = ProfileManager;