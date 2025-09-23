// JavaScript para la página de Leaderboards con datos mock
class LeaderboardsManager {
  constructor() {
    this.currentPeriod = 'all';
    this.currentCategory = 'score';
    this.currentPage = 1;
    this.playersPerPage = 10;
    this.searchQuery = '';
    
    this.mockData = this.generateMockData();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateLeaderboard();
    this.updateGlobalStats();
  }

  generateMockData() {
    const names = [
      'BlobMaster', 'ProGamer99', 'CellEater', 'SebasPlayer', 'NinjaBlob',
      'QuantumCell', 'AlphaGamer', 'BetaDestroyer', 'GammaWin', 'DeltaForce',
      'EpsilonPro', 'ZetaKing', 'EtaChampion', 'ThetaLord', 'IotaSlayer',
      'KappaWarrior', 'LambdaAce', 'MuLegend', 'NuMaster', 'XiElite',
      'OmicronGod', 'PiCalculator', 'RhoSpeed', 'SigmaGrind', 'TauTime',
      'UpsilonWave', 'PhiGolden', 'ChiEnergy', 'PsiMind', 'OmegaEnd',
      'BlobZilla', 'CellDivider', 'MicroMaster', 'MacroKing', 'PhotonBlob',
      'NeutronStar', 'ElectronSpin', 'ProtonCharge', 'QuarkTop', 'BosonGod',
      'FermionWave', 'HadronSmash', 'LeptonLight', 'BaryonHeavy', 'MesonFast',
      'GluonBind', 'PhotonSpeed', 'GravitonPull', 'HiggsField', 'TachyonFast',
      'QuantumTunnel', 'WaveFunction', 'Superposition', 'Entanglement', 'Decoherence'
    ];

    const players = [];
    
    for (let i = 0; i < 100; i++) {
      const player = {
        id: i + 1,
        name: names[i % names.length] + (i > names.length - 1 ? Math.floor(i / names.length) : ''),
        maxScore: Math.floor(Math.random() * 150000) + 5000,
        wins: Math.floor(Math.random() * 100) + 1,
        totalTime: Math.floor(Math.random() * 500) + 10, // horas
        lastActive: this.getRandomDate(),
        level: Math.floor(Math.random() * 50) + 1,
        avatar: this.getRandomAvatar(),
        isOnline: Math.random() > 0.7,
        country: this.getRandomCountry()
      };
      
      players.push(player);
    }

    // Ordenar por puntuación máxima
    players.sort((a, b) => b.maxScore - a.maxScore);
    
    return players;
  }

  getRandomAvatar() {
    const gradients = [
      'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
      'linear-gradient(45deg, #4ecdc4, #45b7d1)',
      'linear-gradient(45deg, #96ceb4, #66bb6a)',
      'linear-gradient(45deg, #ffa726, #ff7043)',
      'linear-gradient(45deg, #ab47bc, #ec407a)',
      'linear-gradient(45deg, #26c6da, #42a5f5)',
      'linear-gradient(45deg, #ef5350, #ff5722)',
      'linear-gradient(45deg, #66bb6a, #4caf50)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  }

  getRandomCountry() {
    const countries = ['🇺🇸', '🇬🇧', '🇫🇷', '🇩🇪', '🇯🇵', '🇰🇷', '🇨🇦', '🇧🇷', '🇲🇽', '🇪🇸', '🇮🇹', '🇷🇺', '🇨🇳', '🇮🇳', '🇦🇺', '🇨🇷'];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  getRandomDate() {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    if (daysAgo === 0) return 'En línea ahora';
    if (daysAgo === 1) return 'Ayer';
    if (daysAgo < 7) return `Hace ${daysAgo} días`;
    if (daysAgo < 30) return `Hace ${Math.floor(daysAgo / 7)} semanas`;
    return date.toLocaleDateString();
  }

  setupEventListeners() {
    // Filtros de tiempo
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentPeriod = e.target.dataset.period;
        this.updateLeaderboard();
      });
    });

    // Filtros de categoría
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentCategory = e.target.dataset.category;
        this.updateLeaderboard();
      });
    });

    // Búsqueda
    const searchInput = document.getElementById('playerSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.currentPage = 1;
        this.updateLeaderboard();
      });
    }

    // Paginación
    document.getElementById('prevPage').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.updateLeaderboard();
      }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
      const totalPages = this.getTotalPages();
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.updateLeaderboard();
      }
    });
  }

  updateLeaderboard() {
    const filteredData = this.getFilteredData();
    this.updateRankingsTable(filteredData);
    this.updatePagination(filteredData);
    this.updatePodium();
  }

  getFilteredData() {
    let data = [...this.mockData];

    // Filtrar por búsqueda
    if (this.searchQuery) {
      data = data.filter(player => 
        player.name.toLowerCase().includes(this.searchQuery)
      );
    }

    // Ordenar por categoría
    switch (this.currentCategory) {
      case 'time':
        data.sort((a, b) => b.totalTime - a.totalTime);
        break;
      case 'wins':
        data.sort((a, b) => b.wins - a.wins);
        break;
      default: // score
        data.sort((a, b) => b.maxScore - a.maxScore);
    }

    // Simular filtro de tiempo (en una app real esto vendría del backend)
    if (this.currentPeriod !== 'all') {
      // Para la demo, solo variamos un poco los datos
      data = data.map(player => ({
        ...player,
        maxScore: Math.floor(player.maxScore * (0.7 + Math.random() * 0.6))
      }));
      data.sort((a, b) => b.maxScore - a.maxScore);
    }

    return data;
  }

  updateRankingsTable(data) {
    const tbody = document.getElementById('rankingsTableBody');
    if (!tbody) return;

    const startIndex = (this.currentPage - 1) * this.playersPerPage;
    const endIndex = startIndex + this.playersPerPage;
    const pageData = data.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    pageData.forEach((player, index) => {
      const globalRank = startIndex + index + 1;
      const row = document.createElement('tr');
      
      // Resaltar top 3
      if (globalRank <= 3) {
        row.style.background = 'linear-gradient(45deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))';
      }

      row.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: bold; color: ${globalRank <= 3 ? '#ffd700' : '#4ecdc4'};">
              #${globalRank}
            </span>
            ${globalRank <= 3 ? '<i class="fas fa-crown" style="color: #ffd700;"></i>' : ''}
          </div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 15px;">
            <div class="player-avatar-small" style="width: 40px; height: 40px; border-radius: 50%; background: ${player.avatar};"></div>
            <div>
              <div style="font-weight: bold; color: #fff;">${player.name}</div>
              <div style="font-size: 0.8em; color: rgba(255,255,255,0.6);">
                ${player.country} Nivel ${player.level}
                ${player.isOnline ? '<span style="color: #4caf50;">● En línea</span>' : ''}
              </div>
            </div>
          </div>
        </td>
        <td style="font-weight: bold; color: #4ecdc4;">${player.maxScore.toLocaleString()}</td>
        <td style="color: #ff6b6b; font-weight: bold;">${player.wins}</td>
        <td style="color: rgba(255,255,255,0.8);">${player.totalTime}h</td>
        <td style="color: rgba(255,255,255,0.6); font-size: 0.9em;">${player.lastActive}</td>
      `;

      // Hacer click en fila para ver perfil
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => {
        this.showPlayerProfile(player);
      });

      tbody.appendChild(row);
    });
  }

  updatePagination(data) {
    const totalPages = Math.ceil(data.length / this.playersPerPage);
    
    document.getElementById('currentPage').textContent = this.currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    document.getElementById('prevPage').disabled = this.currentPage === 1;
    document.getElementById('nextPage').disabled = this.currentPage === totalPages;
  }

  getTotalPages() {
    const filteredData = this.getFilteredData();
    return Math.ceil(filteredData.length / this.playersPerPage);
  }

  updatePodium() {
    const topPlayers = this.getFilteredData().slice(0, 3);
    
    // Actualizar podium con los top 3 actuales
    const podiumPlaces = document.querySelectorAll('.podium-place');
    const positions = [1, 0, 2]; // segundo, primero, tercero (orden visual)
    
    positions.forEach((dataIndex, visualIndex) => {
      if (topPlayers[dataIndex] && podiumPlaces[visualIndex]) {
        const player = topPlayers[dataIndex];
        const place = podiumPlaces[visualIndex];
        
        const nameElement = place.querySelector('.player-name');
        const scoreElement = place.querySelector('.player-score');
        const statsElement = place.querySelector('.player-stats span');
        const avatarElement = place.querySelector('.blob-avatar');
        
        if (nameElement) nameElement.textContent = player.name;
        if (scoreElement) scoreElement.textContent = player.maxScore.toLocaleString();
        if (statsElement) statsElement.innerHTML = `<i class="fas fa-trophy"></i> ${player.wins} victorias`;
        if (avatarElement) avatarElement.style.background = player.avatar;
      }
    });
  }

  updateGlobalStats() {
    // Simular estadísticas globales
    const stats = {
      totalPlayers: this.mockData.length * 479, // Simular más jugadores
      totalMatches: Math.floor(Math.random() * 1000000) + 2000000,
      totalTime: Math.floor(Math.random() * 50000) + 90000,
      averageScore: Math.floor(this.mockData.reduce((sum, p) => sum + p.maxScore, 0) / this.mockData.length)
    };

    // Actualizar las tarjetas de estadísticas
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
      statNumbers[0].textContent = stats.totalPlayers.toLocaleString();
      statNumbers[1].textContent = stats.totalMatches.toLocaleString();
      statNumbers[2].textContent = Math.floor(stats.totalTime).toLocaleString() + 'h';
      statNumbers[3].textContent = stats.averageScore.toLocaleString();
    }
  }

  showPlayerProfile(player) {
    // Mostrar modal o redirigir al perfil del jugador
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${player.name}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: ${player.avatar}; margin: 0 auto 15px;"></div>
            <h4 style="color: #4ecdc4; margin: 0;">Nivel ${player.level}</h4>
          </div>
          <div class="player-stats-modal">
            <div class="stat-row">
              <span class="stat-label">Ranking:</span>
              <span class="stat-value">#${this.mockData.indexOf(player) + 1}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Puntuación Máxima:</span>
              <span class="stat-value">${player.maxScore.toLocaleString()}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Victorias:</span>
              <span class="stat-value">${player.wins}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Tiempo Total:</span>
              <span class="stat-value">${player.totalTime}h</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Estado:</span>
              <span class="stat-value">${player.isOnline ? '🟢 En línea' : '🔴 Desconectado'}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Última vez activo:</span>
              <span class="stat-value">${player.lastActive}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn primary" onclick="window.location.href='friends.html'">
            <i class="fas fa-user-plus"></i> Agregar Amigo
          </button>
          <button class="action-btn secondary" onclick="window.location.href='profile.html'">
            <i class="fas fa-eye"></i> Ver Perfil Completo
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners para cerrar modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Método para simular actualizaciones en tiempo real
  startRealTimeUpdates() {
    setInterval(() => {
      // Simular cambios en estado en línea
      this.mockData.forEach(player => {
        if (Math.random() < 0.1) { // 10% de probabilidad de cambio
          player.isOnline = !player.isOnline;
          if (player.isOnline) {
            player.lastActive = 'En línea ahora';
          }
        }
      });
      
      // Actualizar solo si estamos en la página actual
      if (document.querySelector('.leaderboards-container')) {
        this.updateLeaderboard();
      }
    }, 30000); // Actualizar cada 30 segundos
  }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  const leaderboards = new LeaderboardsManager();
  
  // Iniciar actualizaciones en tiempo real
  leaderboards.startRealTimeUpdates();
  
  // Animaciones de entrada
  setTimeout(() => {
    document.querySelectorAll('.stat-card').forEach((card, index) => {
      setTimeout(() => {
        card.style.animation = 'fadeIn 0.6s ease-out';
      }, index * 100);
    });
  }, 500);
});

// Exportar para debugging
window.LeaderboardsManager = LeaderboardsManager;