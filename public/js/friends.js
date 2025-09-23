// JavaScript para la página de Amigos con datos mock
class FriendsManager {
  constructor() {
    this.currentSection = 'friends';
    this.friendsList = this.generateMockFriends();
    this.incomingRequests = this.generateMockIncomingRequests();
    this.outgoingRequests = this.generateMockOutgoingRequests();
    this.blockedUsers = this.generateMockBlockedUsers();
    this.suggestedPlayers = this.generateMockSuggestions();
    this.searchResults = [];
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSection(this.currentSection);
    this.updateNavigationCounts();
  }

  generateMockFriends() {
    const friends = [];
    const names = [
      'ProGamer99', 'BlobMaster', 'CellEater', 'NinjaBlob', 'QuantumCell',
      'AlphaGamer', 'BetaDestroyer', 'GammaWin', 'DeltaForce', 'EpsilonPro',
      'ZetaKing', 'EtaChampion'
    ];

    const statuses = ['online', 'playing', 'offline'];
    
    for (let i = 0; i < 12; i++) {
      const friend = {
        id: i + 1,
        name: names[i],
        avatar: this.getRandomAvatar(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        level: Math.floor(Math.random() * 50) + 5,
        maxScore: Math.floor(Math.random() * 100000) + 10000,
        wins: Math.floor(Math.random() * 50) + 5,
        lastSeen: this.getRandomLastSeen(),
        friendSince: this.getRandomFriendDate(),
        isPlaying: Math.random() > 0.7,
        currentGame: Math.random() > 0.5 ? 'Blob.io Clásico' : null
      };
      friends.push(friend);
    }

    return friends;
  }

  generateMockIncomingRequests() {
    return [
      {
        id: 1,
        name: 'NewPlayer123',
        avatar: this.getRandomAvatar(),
        level: 12,
        maxScore: 8547,
        requestDate: '2024-03-20',
        mutualFriends: 2
      },
      {
        id: 2,
        name: 'BlobHunter',
        avatar: this.getRandomAvatar(),
        level: 28,
        maxScore: 45231,
        requestDate: '2024-03-19',
        mutualFriends: 5
      },
      {
        id: 3,
        name: 'CellMaster2024',
        avatar: this.getRandomAvatar(),
        level: 15,
        maxScore: 12893,
        requestDate: '2024-03-18',
        mutualFriends: 1
      }
    ];
  }

  generateMockOutgoingRequests() {
    return [
      {
        id: 1,
        name: 'EliteGamer',
        avatar: this.getRandomAvatar(),
        level: 35,
        maxScore: 87452,
        requestDate: '2024-03-19',
        status: 'pending'
      },
      {
        id: 2,
        name: 'TopPlayer99',
        avatar: this.getRandomAvatar(),
        level: 42,
        maxScore: 125847,
        requestDate: '2024-03-17',
        status: 'pending'
      }
    ];
  }

  generateMockBlockedUsers() {
    return [
      {
        id: 1,
        name: 'ToxicPlayer',
        avatar: 'linear-gradient(45deg, #757575, #9e9e9e)',
        blockedDate: '2024-03-10',
        reason: 'Comportamiento tóxico'
      }
    ];
  }

  generateMockSuggestions() {
    const suggestions = [];
    const names = [
      'FriendlyBlob', 'SkillfulCell', 'ProBlobber', 'CellDivision', 'BlobWizard',
      'QuantumGamer', 'MegaCell', 'UltraBlob'
    ];

    for (let i = 0; i < 8; i++) {
      const suggestion = {
        id: i + 1,
        name: names[i],
        avatar: this.getRandomAvatar(),
        level: Math.floor(Math.random() * 40) + 10,
        maxScore: Math.floor(Math.random() * 80000) + 15000,
        mutualFriends: Math.floor(Math.random() * 8),
        reason: this.getRandomSuggestionReason(),
        isOnline: Math.random() > 0.6
      };
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  getRandomAvatar() {
    const gradients = [
      'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
      'linear-gradient(45deg, #4ecdc4, #45b7d1)',
      'linear-gradient(45deg, #96ceb4, #66bb6a)',
      'linear-gradient(45deg, #ffa726, #ff7043)',
      'linear-gradient(45deg, #ab47bc, #ec407a)',
      'linear-gradient(45deg, #26c6da, #42a5f5)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  }

  getRandomLastSeen() {
    const options = [
      'En línea ahora',
      'Hace 5 minutos',
      'Hace 1 hora',
      'Hace 3 horas',
      'Ayer',
      'Hace 2 días',
      'Hace 1 semana'
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  getRandomFriendDate() {
    const dates = [
      '2024-01-15',
      '2024-02-03',
      '2024-02-20',
      '2024-03-01',
      '2024-03-10'
    ];
    return dates[Math.floor(Math.random() * dates.length)];
  }

  getRandomSuggestionReason() {
    const reasons = [
      'Jugaron en la misma partida',
      'Amigos en común',
      'Nivel similar',
      'Misma región',
      'Juega frecuentemente'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  setupEventListeners() {
    // Navegación entre secciones
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.target.dataset.section || e.target.closest('.nav-btn').dataset.section;
        this.switchSection(section);
      });
    });

    // Búsqueda
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.performSearch();
      });
    }
    
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });
      
      searchInput.addEventListener('input', (e) => {
        if (e.target.value.length === 0) {
          this.clearSearch();
        }
      });
    }

    // Filtros de búsqueda
    document.querySelectorAll('.filter-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.performSearch();
      });
    });

    // Botones de acción masiva
    this.setupMassActionButtons();

    // Modales
    this.setupModals();
  }

  setupMassActionButtons() {
    const inviteAllBtn = document.getElementById('inviteAllBtn');
    const acceptAllBtn = document.getElementById('acceptAllBtn');
    const rejectAllBtn = document.getElementById('rejectAllBtn');

    if (inviteAllBtn) {
      inviteAllBtn.addEventListener('click', () => {
        this.inviteAllFriends();
      });
    }

    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', () => {
        this.acceptAllRequests();
      });
    }

    if (rejectAllBtn) {
      rejectAllBtn.addEventListener('click', () => {
        this.rejectAllRequests();
      });
    }
  }

  setupModals() {
    // Modal de perfil de jugador
    const playerModal = document.getElementById('playerModal');
    const gameInviteModal = document.getElementById('gameInviteModal');

    // Cerrar modales
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
      closeBtn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    });

    // Cerrar modal al hacer click fuera
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    });

    // Botones del modal de invitación
    const sendInviteBtn = document.getElementById('sendInvite');
    const cancelInviteBtn = document.getElementById('cancelInvite');

    if (sendInviteBtn) {
      sendInviteBtn.addEventListener('click', () => {
        this.sendGameInvite();
      });
    }

    if (cancelInviteBtn) {
      cancelInviteBtn.addEventListener('click', () => {
        gameInviteModal.style.display = 'none';
      });
    }
  }

  switchSection(section) {
    // Actualizar navegación
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-btn[data-section="${section}"]`).classList.add('active');

    // Ocultar todas las secciones
    document.querySelectorAll('.friends-section').forEach(sec => sec.classList.remove('active'));
    
    // Mostrar sección seleccionada
    document.getElementById(`${section}-section`).classList.add('active');
    
    this.currentSection = section;
    this.loadSection(section);
  }

  loadSection(section) {
    switch (section) {
      case 'friends':
        this.loadFriendsList();
        break;
      case 'search':
        this.loadSearchSection();
        break;
      case 'requests':
        this.loadRequestsSection();
        break;
      case 'blocked':
        this.loadBlockedSection();
        break;
    }
  }

  loadFriendsList() {
    const friendsGrid = document.getElementById('friendsList');
    if (!friendsGrid) return;

    friendsGrid.innerHTML = '';

    this.friendsList.forEach(friend => {
      const friendCard = this.createFriendCard(friend);
      friendsGrid.appendChild(friendCard);
    });
  }

  createFriendCard(friend) {
    const card = document.createElement('div');
    card.className = 'friend-card';

    const statusText = this.getStatusText(friend.status, friend.isPlaying, friend.currentGame);
    const statusColor = this.getStatusColor(friend.status);

    card.innerHTML = `
      <div class="friend-header">
        <div class="friend-avatar" style="background: ${friend.avatar};">
          <div class="status-indicator ${friend.status}" style="position: absolute; bottom: 0; right: 0; width: 15px; height: 15px; border: 2px solid #fff;"></div>
        </div>
        <div class="friend-info">
          <h3>${friend.name}</h3>
          <div class="friend-status" style="color: ${statusColor};">
            <div class="status-indicator ${friend.status}"></div>
            <span>${statusText}</span>
          </div>
        </div>
      </div>
      <div class="friend-stats">
        <div class="friend-stat">
          <strong>${friend.level}</strong>
          <span>Nivel</span>
        </div>
        <div class="friend-stat">
          <strong>${friend.maxScore.toLocaleString()}</strong>
          <span>Mejor</span>
        </div>
        <div class="friend-stat">
          <strong>${friend.wins}</strong>
          <span>Victorias</span>
        </div>
      </div>
      <div class="friend-actions">
        <button class="friend-btn primary" onclick="friendsManager.openGameInviteModal('${friend.name}')">
          <i class="fas fa-gamepad"></i> Invitar
        </button>
        <button class="friend-btn secondary" onclick="friendsManager.openPlayerProfile('${friend.name}')">
          <i class="fas fa-eye"></i> Perfil
        </button>
        <button class="friend-btn secondary" onclick="friendsManager.startChat('${friend.name}')">
          <i class="fas fa-comment"></i> Chat
        </button>
        <button class="friend-btn danger" onclick="friendsManager.removeFriend('${friend.name}')">
          <i class="fas fa-user-minus"></i>
        </button>
      </div>
    `;

    return card;
  }

  getStatusText(status, isPlaying, currentGame) {
    if (status === 'online') {
      return isPlaying && currentGame ? `Jugando ${currentGame}` : 'En línea';
    } else if (status === 'playing') {
      return 'En partida';
    } else {
      return 'Desconectado';
    }
  }

  getStatusColor(status) {
    const colors = {
      online: '#4caf50',
      playing: '#ff9800',
      offline: '#757575'
    };
    return colors[status] || colors.offline;
  }

  loadSearchSection() {
    this.loadSuggestedPlayers();
  }

  loadSuggestedPlayers() {
    const suggestionsGrid = document.getElementById('suggestedPlayers');
    if (!suggestionsGrid) return;

    suggestionsGrid.innerHTML = '';

    this.suggestedPlayers.forEach(player => {
      const card = this.createSuggestionCard(player);
      suggestionsGrid.appendChild(card);
    });
  }

  createSuggestionCard(player) {
    const card = document.createElement('div');
    card.className = 'friend-card';

    card.innerHTML = `
      <div class="friend-header">
        <div class="friend-avatar" style="background: ${player.avatar};">
          ${player.isOnline ? '<div class="status-indicator online" style="position: absolute; bottom: 0; right: 0; width: 15px; height: 15px; border: 2px solid #fff;"></div>' : ''}
        </div>
        <div class="friend-info">
          <h3>${player.name}</h3>
          <div class="friend-status">
            <span style="color: #4ecdc4;">${player.reason}</span>
          </div>
        </div>
      </div>
      <div class="friend-stats">
        <div class="friend-stat">
          <strong>${player.level}</strong>
          <span>Nivel</span>
        </div>
        <div class="friend-stat">
          <strong>${player.maxScore.toLocaleString()}</strong>
          <span>Mejor</span>
        </div>
        <div class="friend-stat">
          <strong>${player.mutualFriends}</strong>
          <span>Amigos</span>
        </div>
      </div>
      <div class="friend-actions">
        <button class="friend-btn primary" onclick="friendsManager.sendFriendRequest('${player.name}')">
          <i class="fas fa-user-plus"></i> Agregar
        </button>
        <button class="friend-btn secondary" onclick="friendsManager.openPlayerProfile('${player.name}')">
          <i class="fas fa-eye"></i> Perfil
        </button>
      </div>
    `;

    return card;
  }

  loadRequestsSection() {
    this.loadIncomingRequests();
    this.loadOutgoingRequests();
  }

  loadIncomingRequests() {
    const container = document.getElementById('incomingRequests');
    if (!container) return;

    container.innerHTML = '';

    this.incomingRequests.forEach(request => {
      const item = this.createRequestItem(request, 'incoming');
      container.appendChild(item);
    });
  }

  loadOutgoingRequests() {
    const container = document.getElementById('outgoingRequests');
    if (!container) return;

    container.innerHTML = '';

    this.outgoingRequests.forEach(request => {
      const item = this.createRequestItem(request, 'outgoing');
      container.appendChild(item);
    });
  }

  createRequestItem(request, type) {
    const item = document.createElement('div');
    item.className = 'request-item';

    const actionButtons = type === 'incoming' ? 
      `<button class="request-btn accept" onclick="friendsManager.acceptRequest(${request.id})">
         <i class="fas fa-check"></i> Aceptar
       </button>
       <button class="request-btn reject" onclick="friendsManager.rejectRequest(${request.id})">
         <i class="fas fa-times"></i> Rechazar
       </button>` :
      `<button class="request-btn cancel" onclick="friendsManager.cancelRequest(${request.id})">
         <i class="fas fa-times"></i> Cancelar
       </button>`;

    const additionalInfo = type === 'incoming' && request.mutualFriends ? 
      `<p style="color: #4ecdc4; font-size: 0.8em;">${request.mutualFriends} amigos en común</p>` : '';

    item.innerHTML = `
      <div class="request-avatar" style="background: ${request.avatar};"></div>
      <div class="request-info">
        <h4>${request.name}</h4>
        <div class="request-time">Enviada el ${new Date(request.requestDate).toLocaleDateString()}</div>
        ${additionalInfo}
      </div>
      <div class="request-actions">
        ${actionButtons}
      </div>
    `;

    return item;
  }

  loadBlockedSection() {
    const container = document.getElementById('blockedList');
    if (!container) return;

    container.innerHTML = '';

    this.blockedUsers.forEach(user => {
      const item = this.createBlockedItem(user);
      container.appendChild(item);
    });
  }

  createBlockedItem(user) {
    const item = document.createElement('div');
    item.className = 'blocked-item';

    item.innerHTML = `
      <div class="blocked-avatar" style="background: ${user.avatar};"></div>
      <div class="blocked-info">
        <h4>${user.name}</h4>
        <div class="blocked-date">Bloqueado el ${new Date(user.blockedDate).toLocaleDateString()}</div>
        <p style="color: rgba(255,255,255,0.6); font-size: 0.9em;">${user.reason}</p>
      </div>
      <button class="unblock-btn" onclick="friendsManager.unblockUser(${user.id})">
        <i class="fas fa-unlock"></i> Desbloquear
      </button>
    `;

    return item;
  }

  performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value.trim() : '';
    
    if (searchQuery.length < 2) {
      this.showToast('Ingresa al menos 2 caracteres para buscar', 'warning');
      return;
    }

    // Simular búsqueda
    this.searchResults = this.generateSearchResults(searchQuery);
    this.displaySearchResults();
  }

  generateSearchResults(query) {
    const results = [];
    const names = [
      'SearchResult1', 'SearchResult2', 'PlayerFound', 'BlobSeeker',
      'CellFinder', 'GameMaster', 'ProSearcher', 'FinderPlayer'
    ];

    // Simular resultados basados en la búsqueda
    for (let i = 0; i < Math.min(5, names.length); i++) {
      if (names[i].toLowerCase().includes(query.toLowerCase()) || Math.random() > 0.5) {
        results.push({
          id: i + 1,
          name: names[i],
          avatar: this.getRandomAvatar(),
          level: Math.floor(Math.random() * 50) + 1,
          maxScore: Math.floor(Math.random() * 100000) + 5000,
          isOnline: Math.random() > 0.5,
          mutualFriends: Math.floor(Math.random() * 10)
        });
      }
    }

    return results;
  }

  displaySearchResults() {
    const container = document.getElementById('searchResults');
    if (!container) return;

    container.innerHTML = '';

    if (this.searchResults.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 40px;">No se encontraron jugadores</p>';
      return;
    }

    this.searchResults.forEach(result => {
      const item = this.createSearchResultItem(result);
      container.appendChild(item);
    });
  }

  createSearchResultItem(result) {
    const item = document.createElement('div');
    item.className = 'search-result-item';

    item.innerHTML = `
      <div class="result-avatar" style="background: ${result.avatar};"></div>
      <div class="result-info">
        <h4>${result.name}</h4>
        <p>Nivel ${result.level} • ${result.maxScore.toLocaleString()} puntos máximos</p>
        ${result.mutualFriends > 0 ? `<p style="color: #4ecdc4;">${result.mutualFriends} amigos en común</p>` : ''}
      </div>
      <div class="result-actions">
        <button class="friend-btn primary" onclick="friendsManager.sendFriendRequest('${result.name}')">
          <i class="fas fa-user-plus"></i> Agregar
        </button>
        <button class="friend-btn secondary" onclick="friendsManager.openPlayerProfile('${result.name}')">
          <i class="fas fa-eye"></i> Ver
        </button>
      </div>
    `;

    return item;
  }

  clearSearch() {
    const container = document.getElementById('searchResults');
    if (container) {
      container.innerHTML = '';
    }
    this.searchResults = [];
  }

  updateNavigationCounts() {
    // Actualizar contadores en la navegación
    const friendsCount = document.querySelector('.nav-btn[data-section="friends"] .count-badge');
    const requestsCount = document.querySelector('.nav-btn[data-section="requests"] .count-badge');
    const blockedCount = document.querySelector('.nav-btn[data-section="blocked"] .count-badge');

    if (friendsCount) friendsCount.textContent = this.friendsList.length;
    if (requestsCount) requestsCount.textContent = this.incomingRequests.length;
    if (blockedCount) blockedCount.textContent = this.blockedUsers.length;
  }

  // Acciones de amigos
  sendFriendRequest(playerName) {
    this.showToast(`Solicitud de amistad enviada a ${playerName}`, 'success');
    
    // Simular agregar a solicitudes enviadas
    this.outgoingRequests.push({
      id: Date.now(),
      name: playerName,
      avatar: this.getRandomAvatar(),
      level: Math.floor(Math.random() * 50) + 1,
      maxScore: Math.floor(Math.random() * 100000) + 5000,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    });

    // Remover de sugerencias si existe
    this.suggestedPlayers = this.suggestedPlayers.filter(p => p.name !== playerName);
    
    if (this.currentSection === 'search') {
      this.loadSuggestedPlayers();
    }
  }

  acceptRequest(requestId) {
    const request = this.incomingRequests.find(r => r.id === requestId);
    if (request) {
      // Mover a lista de amigos
      this.friendsList.push({
        id: Date.now(),
        name: request.name,
        avatar: request.avatar,
        status: 'online',
        level: request.level,
        maxScore: request.maxScore,
        wins: Math.floor(Math.random() * 50) + 5,
        lastSeen: 'En línea ahora',
        friendSince: new Date().toISOString().split('T')[0],
        isPlaying: false,
        currentGame: null
      });

      // Remover de solicitudes
      this.incomingRequests = this.incomingRequests.filter(r => r.id !== requestId);
      
      this.showToast(`${request.name} es ahora tu amigo`, 'success');
      this.loadRequestsSection();
      this.updateNavigationCounts();
    }
  }

  rejectRequest(requestId) {
    const request = this.incomingRequests.find(r => r.id === requestId);
    if (request) {
      this.incomingRequests = this.incomingRequests.filter(r => r.id !== requestId);
      this.showToast(`Solicitud de ${request.name} rechazada`, 'info');
      this.loadRequestsSection();
      this.updateNavigationCounts();
    }
  }

  cancelRequest(requestId) {
    const request = this.outgoingRequests.find(r => r.id === requestId);
    if (request) {
      this.outgoingRequests = this.outgoingRequests.filter(r => r.id !== requestId);
      this.showToast(`Solicitud a ${request.name} cancelada`, 'info');
      this.loadRequestsSection();
    }
  }

  removeFriend(friendName) {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${friendName} de tu lista de amigos?`)) {
      this.friendsList = this.friendsList.filter(f => f.name !== friendName);
      this.showToast(`${friendName} eliminado de tus amigos`, 'info');
      this.loadFriendsList();
      this.updateNavigationCounts();
    }
  }

  unblockUser(userId) {
    const user = this.blockedUsers.find(u => u.id === userId);
    if (user) {
      this.blockedUsers = this.blockedUsers.filter(u => u.id !== userId);
      this.showToast(`${user.name} desbloqueado`, 'success');
      this.loadBlockedSection();
      this.updateNavigationCounts();
    }
  }

  acceptAllRequests() {
    if (this.incomingRequests.length === 0) {
      this.showToast('No hay solicitudes pendientes', 'info');
      return;
    }

    if (confirm(`¿Aceptar todas las ${this.incomingRequests.length} solicitudes?`)) {
      this.incomingRequests.forEach(request => {
        this.friendsList.push({
          id: Date.now() + Math.random(),
          name: request.name,
          avatar: request.avatar,
          status: 'online',
          level: request.level,
          maxScore: request.maxScore,
          wins: Math.floor(Math.random() * 50) + 5,
          lastSeen: 'En línea ahora',
          friendSince: new Date().toISOString().split('T')[0],
          isPlaying: false,
          currentGame: null
        });
      });

      const count = this.incomingRequests.length;
      this.incomingRequests = [];
      
      this.showToast(`${count} solicitudes aceptadas`, 'success');
      this.loadRequestsSection();
      this.updateNavigationCounts();
    }
  }

  rejectAllRequests() {
    if (this.incomingRequests.length === 0) {
      this.showToast('No hay solicitudes pendientes', 'info');
      return;
    }

    if (confirm(`¿Rechazar todas las ${this.incomingRequests.length} solicitudes?`)) {
      const count = this.incomingRequests.length;
      this.incomingRequests = [];
      
      this.showToast(`${count} solicitudes rechazadas`, 'info');
      this.loadRequestsSection();
      this.updateNavigationCounts();
    }
  }

  inviteAllFriends() {
    const onlineFriends = this.friendsList.filter(f => f.status === 'online');
    
    if (onlineFriends.length === 0) {
      this.showToast('No hay amigos en línea para invitar', 'info');
      return;
    }

    if (confirm(`¿Enviar invitación de juego a ${onlineFriends.length} amigos en línea?`)) {
      this.showToast(`Invitaciones enviadas a ${onlineFriends.length} amigos`, 'success');
    }
  }

  openPlayerProfile(playerName) {
    const modal = document.getElementById('playerModal');
    const player = this.findPlayerByName(playerName);
    
    if (modal && player) {
      // Actualizar contenido del modal
      document.getElementById('modalPlayerName').textContent = player.name;
      document.getElementById('modalPlayerLevel').textContent = player.level || '??';
      document.getElementById('modalPlayerScore').textContent = player.maxScore?.toLocaleString() || '??';
      document.getElementById('modalPlayerWins').textContent = player.wins || '??';
      document.getElementById('modalPlayerLastSeen').textContent = player.lastSeen || 'Desconocido';
      
      const avatar = document.getElementById('modalPlayerAvatar');
      if (avatar) {
        avatar.style.background = player.avatar;
      }

      modal.style.display = 'block';
    }
  }

  openGameInviteModal(playerName) {
    const modal = document.getElementById('gameInviteModal');
    if (modal) {
      modal.dataset.playerName = playerName;
      modal.style.display = 'block';
    }
  }

  sendGameInvite() {
    const modal = document.getElementById('gameInviteModal');
    const playerName = modal.dataset.playerName;
    const gameMode = document.querySelector('input[name="gameMode"]:checked')?.value || 'classic';
    const message = document.getElementById('inviteMessageText')?.value || '';

    this.showToast(`Invitación de ${gameMode} enviada a ${playerName}`, 'success');
    modal.style.display = 'none';
  }

  startChat(friendName) {
    this.showToast(`Chat con ${friendName} próximamente`, 'info');
  }

  findPlayerByName(name) {
    return this.friendsList.find(f => f.name === name) ||
           this.incomingRequests.find(r => r.name === name) ||
           this.outgoingRequests.find(r => r.name === name) ||
           this.suggestedPlayers.find(s => s.name === name) ||
           this.searchResults.find(s => s.name === name);
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  window.friendsManager = new FriendsManager();
  
  // Animaciones de entrada
  setTimeout(() => {
    document.querySelectorAll('.friend-card').forEach((card, index) => {
      setTimeout(() => {
        card.style.animation = 'fadeIn 0.6s ease-out';
      }, index * 100);
    });
  }, 500);
});

// Exportar para debugging
window.FriendsManager = FriendsManager;