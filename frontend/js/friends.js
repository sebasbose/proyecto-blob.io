// Sistema de Amigos integrado con la base de datos
class FriendsManager {
  constructor() {
    this.currentSection = 'friends';
    this.friendsList = [];
    this.incomingRequests = [];
    this.outgoingRequests = [];
    this.searchResults = [];
    
    this.init();
  }

  async init() {
    // Verificar autenticación
    if (!API_CONFIG.isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }

    this.setupEventListeners();
    await this.loadAllData();
    this.loadSection(this.currentSection);
    this.updateNavigationCounts();
    this.updateUserInfo();
  }

  async updateUserInfo() {
    try {
      const response = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${API_CONFIG.getToken()}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const usernameEl = document.querySelector('.username');
        if (usernameEl) {
          usernameEl.textContent = userData.username;
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }

  async loadAllData() {
    const token = API_CONFIG.getToken();
    if (!token) return;

    try {
      // Cargar amigos
      const friendsRes = await fetch('/api/friends', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      if (friendsRes.ok) {
        const data = await friendsRes.json();
        this.friendsList = data.map(f => ({
          id: f._id,
          name: f.username,
          avatar: f.avatar || this.getRandomAvatar(),
          status: 'offline',
          level: f.level || 1,
          maxScore: f.maxScore || 0,
          wins: 0,
          lastSeen: f.lastActive ? new Date(f.lastActive).toLocaleDateString() : 'Nunca',
          friendSince: f.friendSince ? new Date(f.friendSince).toLocaleDateString() : 'Hoy',
          isPlaying: false
        }));
      }

      // Cargar solicitudes recibidas
      const requestsRes = await fetch('/api/friends/requests', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        this.incomingRequests = data.map(r => ({
          id: r._id,
          userId: r.requester._id,
          name: r.requester.username,
          avatar: r.requester.avatar || this.getRandomAvatar(),
          level: r.requester.level || 1,
          maxScore: r.requester.stats?.maxScore || 0,
          requestDate: r.createdAt,
          mutualFriends: 0
        }));
      }

      // Cargar solicitudes enviadas
      const sentRes = await fetch('/api/friends/requests/sent', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      if (sentRes.ok) {
        const data = await sentRes.json();
        this.outgoingRequests = data.map(r => ({
          id: r._id,
          userId: r.recipient._id,
          name: r.recipient.username,
          avatar: r.recipient.avatar || this.getRandomAvatar(),
          level: r.recipient.level || 1,
          maxScore: r.recipient.stats?.maxScore || 0,
          requestDate: r.createdAt
        }));
      }
    } catch (error) {
      console.error('Error loading friends data:', error);
      this.showToast('Error al cargar datos de amigos', 'error');
    }
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
      searchBtn.addEventListener('click', () => this.performSearch());
    }
    
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.performSearch();
      });
      
      searchInput.addEventListener('input', (e) => {
        if (e.target.value.length === 0) this.clearSearch();
      });
    }

    // Botones de acción masiva
    const acceptAllBtn = document.getElementById('acceptAllBtn');
    const rejectAllBtn = document.getElementById('rejectAllBtn');

    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', () => this.acceptAllRequests());
    }

    if (rejectAllBtn) {
      rejectAllBtn.addEventListener('click', () => this.rejectAllRequests());
    }
  }

  switchSection(section) {
    // Actualizar navegación
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const navBtn = document.querySelector(`.nav-btn[data-section="${section}"]`);
    if (navBtn) navBtn.classList.add('active');

    // Ocultar todas las secciones
    document.querySelectorAll('.friends-section').forEach(sec => sec.classList.remove('active'));
    
    // Mostrar sección seleccionada
    const sectionEl = document.getElementById(`${section}-section`);
    if (sectionEl) sectionEl.classList.add('active');
    
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

    if (this.friendsList.length === 0) {
      friendsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.6);">
          <i class="fas fa-users" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
          <h3>No tienes amigos todavía</h3>
          <p style="margin-bottom: 20px;">¡Busca jugadores y agrega amigos para competir juntos!</p>
          <button class="friend-btn primary" onclick="friendsManager.switchSection('search')">
            <i class="fas fa-search"></i> Buscar Amigos
          </button>
        </div>
      `;
      return;
    }

    // Actualizar contador en el título
    const headerTitle = document.querySelector('#friends-section .section-header h2');
    if (headerTitle) {
      headerTitle.textContent = `Mis Amigos (${this.friendsList.length})`;
    }

    this.friendsList.forEach(friend => {
      const friendCard = this.createFriendCard(friend);
      friendsGrid.appendChild(friendCard);
    });
  }

  createFriendCard(friend) {
    const card = document.createElement('div');
    card.className = 'friend-card';

    const statusText = friend.status === 'online' ? 'En línea' : 'Desconectado';
    const statusColor = friend.status === 'online' ? '#4caf50' : '#b11010';

    card.innerHTML = `
      <div class="friend-header">
        <div class="friend-avatar" style="background: ${friend.avatar};">
          <div class="status-indicator ${friend.status}" style="position: absolute; bottom: 0; right: 0; width: 15px; height: 15px; border: 2px solid #fff; border-radius: 50%;"></div>
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
        <button class="friend-btn danger" onclick="friendsManager.removeFriend('${friend.id}', '${friend.name}')">
          <i class="fas fa-user-minus"></i> Eliminar
        </button>
      </div>
    `;

    return card;
  }

  loadSearchSection() {
    // Limpiar resultados previos
    this.clearSearch();
  }

  async performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value.trim() : '';
    
    if (searchQuery.length < 2) {
      this.showToast('Ingresa al menos 2 caracteres para buscar', 'warning');
      return;
    }

    try {
      const token = API_CONFIG.getToken();
      const response = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        this.searchResults = await response.json();
        this.displaySearchResults();
      } else {
        this.showToast('Error en la búsqueda', 'error');
      }
    } catch (error) {
      console.error('Error searching:', error);
      this.showToast('Error al buscar usuarios', 'error');
    }
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

    let actionButton = '';
    
    if (result.friendshipStatus === 'friends') {
      actionButton = `<button class="friend-btn secondary" disabled>
        <i class="fas fa-check"></i> Ya son amigos
      </button>`;
    } else if (result.friendshipStatus === 'requested') {
      actionButton = `<button class="friend-btn secondary" disabled>
        <i class="fas fa-clock"></i> Solicitud enviada
      </button>`;
    } else if (result.friendshipStatus === 'pending') {
      actionButton = `<button class="friend-btn secondary" disabled>
        <i class="fas fa-envelope"></i> Solicitud pendiente
      </button>`;
    } else {
      actionButton = `<button class="friend-btn primary" onclick="friendsManager.sendFriendRequest('${result.username}', '${result._id}')">
        <i class="fas fa-user-plus"></i> Agregar
      </button>`;
    }

    item.innerHTML = `
      <div class="result-avatar" style="background: ${result.avatar || this.getRandomAvatar()};"></div>
      <div class="result-info">
        <h4>${result.username}</h4>
        <p>Nivel ${result.level || 1} • ${(result.stats?.maxScore || 0).toLocaleString()} puntos máximos</p>
      </div>
      <div class="result-actions">
        ${actionButton}
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

  loadRequestsSection() {
    this.loadIncomingRequests();
    this.loadOutgoingRequests();
  }

  loadIncomingRequests() {
    const container = document.getElementById('incomingRequests');
    if (!container) return;

    container.innerHTML = '';

    // Actualizar título
    const subsectionTitle = container.previousElementSibling;
    if (subsectionTitle && subsectionTitle.tagName === 'H3') {
      subsectionTitle.textContent = `Solicitudes Recibidas (${this.incomingRequests.length})`;
    }

    if (this.incomingRequests.length === 0) {
      container.innerHTML = '<p style="color: rgba(255,255,255,0.6); padding: 20px;">No tienes solicitudes pendientes</p>';
      return;
    }

    this.incomingRequests.forEach(request => {
      const item = this.createRequestItem(request, 'incoming');
      container.appendChild(item);
    });
  }

  loadOutgoingRequests() {
    const container = document.getElementById('outgoingRequests');
    if (!container) return;

    container.innerHTML = '';

    // Actualizar título
    const subsectionTitle = container.previousElementSibling;
    if (subsectionTitle && subsectionTitle.tagName === 'H3') {
      subsectionTitle.textContent = `Solicitudes Enviadas (${this.outgoingRequests.length})`;
    }

    if (this.outgoingRequests.length === 0) {
      container.innerHTML = '<p style="color: rgba(255,255,255,0.6); padding: 20px;">No has enviado solicitudes</p>';
      return;
    }

    this.outgoingRequests.forEach(request => {
      const item = this.createRequestItem(request, 'outgoing');
      container.appendChild(item);
    });
  }

  createRequestItem(request, type) {
    const item = document.createElement('div');
    item.className = 'request-item';

    const actionButtons = type === 'incoming' ? 
      `<button class="request-btn accept" onclick="friendsManager.acceptRequest('${request.id}')">
         <i class="fas fa-check"></i> Aceptar
       </button>
       <button class="request-btn reject" onclick="friendsManager.rejectRequest('${request.id}')">
         <i class="fas fa-times"></i> Rechazar
       </button>` :
      `<button class="request-btn cancel" onclick="friendsManager.cancelRequest('${request.id}')">
         <i class="fas fa-times"></i> Cancelar
       </button>`;

    item.innerHTML = `
      <div class="request-avatar" style="background: ${request.avatar};"></div>
      <div class="request-info">
        <h4>${request.name}</h4>
        <div class="request-time">Enviada el ${new Date(request.requestDate).toLocaleDateString()}</div>
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

    container.innerHTML = '<p style="color: rgba(255,255,255,0.6); padding: 40px; text-align: center;">No hay usuarios bloqueados</p>';
  }

  updateNavigationCounts() {
    // Actualizar contadores en la navegación
    const friendsCount = document.querySelector('.nav-btn[data-section="friends"] .count-badge');
    const requestsCount = document.querySelector('.nav-btn[data-section="requests"] .count-badge');

    if (friendsCount) friendsCount.textContent = this.friendsList.length;
    if (requestsCount) {
      requestsCount.textContent = this.incomingRequests.length;
      if (this.incomingRequests.length > 0) {
        requestsCount.classList.add('notification');
      } else {
        requestsCount.classList.remove('notification');
      }
    }
  }

  // Acciones de amigos
  async sendFriendRequest(username, userId) {
    const token = API_CONFIG.getToken();
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (response.ok) {
        this.showToast(`Solicitud enviada a ${username}`, 'success');
        // Recargar datos y actualizar vista
        await this.loadAllData();
        this.performSearch(); // Actualizar resultados de búsqueda
      } else {
        this.showToast(data.message || 'Error al enviar solicitud', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      this.showToast('Error al enviar solicitud', 'error');
    }
  }

  async acceptRequest(requestId) {
    const token = API_CONFIG.getToken();
    try {
      const response = await fetch(`/api/friends/accept/${requestId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        this.showToast('Solicitud aceptada', 'success');
        await this.loadAllData();
        this.loadRequestsSection();
        this.updateNavigationCounts();
      } else {
        const data = await response.json();
        this.showToast(data.message || 'Error al aceptar solicitud', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      this.showToast('Error al aceptar solicitud', 'error');
    }
  }

  async rejectRequest(requestId) {
    const token = API_CONFIG.getToken();
    try {
      const response = await fetch(`/api/friends/reject/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        this.showToast('Solicitud rechazada', 'info');
        await this.loadAllData();
        this.loadRequestsSection();
        this.updateNavigationCounts();
      } else {
        const data = await response.json();
        this.showToast(data.message || 'Error al rechazar solicitud', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      this.showToast('Error al rechazar solicitud', 'error');
    }
  }

  async cancelRequest(requestId) {
    const token = API_CONFIG.getToken();
    try {
      const response = await fetch(`/api/friends/requests/cancel/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        this.showToast('Solicitud cancelada', 'info');
        await this.loadAllData();
        this.loadRequestsSection();
      } else {
        const data = await response.json();
        this.showToast(data.message || 'Error al cancelar solicitud', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      this.showToast('Error al cancelar solicitud', 'error');
    }
  }

  async removeFriend(friendId, friendName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${friendName} de tu lista de amigos?`)) {
      return;
    }

    const token = API_CONFIG.getToken();
    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        this.showToast(`${friendName} eliminado de tus amigos`, 'success');
        await this.loadAllData();
        this.loadFriendsList();
        this.updateNavigationCounts();
      } else {
        const data = await response.json();
        this.showToast(data.message || 'Error al eliminar amigo', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      this.showToast('Error al eliminar amigo', 'error');
    }
  }

  async acceptAllRequests() {
    if (this.incomingRequests.length === 0) {
      this.showToast('No hay solicitudes pendientes', 'info');
      return;
    }

    if (!confirm(`¿Aceptar todas las ${this.incomingRequests.length} solicitudes?`)) {
      return;
    }

    let accepted = 0;
    for (const request of this.incomingRequests) {
      try {
        const token = API_CONFIG.getToken();
        const response = await fetch(`/api/friends/accept/${request.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) accepted++;
      } catch (error) {
        console.error('Error accepting request:', error);
      }
    }

    this.showToast(`${accepted} solicitudes aceptadas`, 'success');
    await this.loadAllData();
    this.loadRequestsSection();
    this.updateNavigationCounts();
  }

  async rejectAllRequests() {
    if (this.incomingRequests.length === 0) {
      this.showToast('No hay solicitudes pendientes', 'info');
      return;
    }

    if (!confirm(`¿Rechazar todas las ${this.incomingRequests.length} solicitudes?`)) {
      return;
    }

    let rejected = 0;
    for (const request of this.incomingRequests) {
      try {
        const token = API_CONFIG.getToken();
        const response = await fetch(`/api/friends/reject/${request.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) rejected++;
      } catch (error) {
        console.error('Error rejecting request:', error);
      }
    }

    this.showToast(`${rejected} solicitudes rechazadas`, 'info');
    await this.loadAllData();
    this.loadRequestsSection();
    this.updateNavigationCounts();
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    }[type] || 'fa-info-circle';

    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  window.friendsManager = new FriendsManager();
});
