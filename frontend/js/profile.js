// Profile Manager - Integrado con la base de datos real
class ProfileManager {
  constructor() {
    this.currentTab = 'overview';
    this.userData = null;
    this.achievements = [];
    this.matchHistory = [];
    this.init();
  }

  async init() {
    // Mostrar loader
    if (window.PageLoader) {
      PageLoader.show('Cargando tu perfil...', 'Obteniendo tus estadísticas');
    }

    try {
      await this.fetchUserData();
      this.setupEventListeners();
      if (this.userData) {
        this.updateProfileDisplay();
        this.setupTabNavigation();
        this.initializeCharts();
      }
      
      // Ocultar loader
      if (window.PageLoader) {
        PageLoader.hide();
      }
    } catch (error) {
      console.error('Error initializing profile:', error);
      if (window.PageLoader) {
        PageLoader.hide(0);
      }
    }
  }

  async fetchUserData() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            this.userData = {
                ...data,
                maxScore: data.stats?.maxScore || 0,
                totalScore: data.stats?.totalScore || 0,
                totalWins: data.stats?.totalWins || 0,
                gamesPlayed: data.stats?.gamesPlayed || 0,
                totalTime: data.stats?.totalTime || 0,
                eliminatedPlayers: data.stats?.eliminatedPlayers || 0,
                timesEliminated: data.stats?.timesEliminated || 0,
                bestStreak: data.stats?.bestStreak || 0,
                currentStreak: data.stats?.currentStreak || 0,
                globalRank: 0,
                winRate: data.stats?.gamesPlayed ? Math.round((data.stats.totalWins / data.stats.gamesPlayed) * 100) : 0,
                averageScore: data.stats?.gamesPlayed ? Math.round(data.stats.totalScore / data.stats.gamesPlayed) : 0,
                kdRatio: data.stats?.timesEliminated ? (data.stats.eliminatedPlayers / data.stats.timesEliminated).toFixed(2) : data.stats?.eliminatedPlayers || 0,
                averageLifeTime: this.formatTime(data.stats?.gamesPlayed ? Math.floor(data.stats.totalTime / data.stats.gamesPlayed) : 0),
                totalTimeFormatted: this.formatTime(data.stats?.totalTime || 0),
                joinDate: new Date(data.createdAt).toLocaleDateString(),
                lastActive: this.getTimeAgo(new Date(data.lastActive))
            };
            await this.loadGlobalRank();
            await this.loadHistoryFromAPI();
        } else {
            if (response.status === 401) window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error:', error);
    }
  }

  async loadGlobalRank() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/leaderboard/rank/${this.userData._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const leaderboard = await response.json();
            const userRank = leaderboard['rank'];
            this.userData.globalRank = userRank;
        }
    } catch (error) {
        console.error('Error loading rank:', error);
    }
  }

  formatTime(minutes) {
    if (!minutes) return '0m 0s';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m 0s`;
  }

  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Hace un momento';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  async loadHistoryFromAPI() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/users/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            this.matchHistory = await response.json();
            this.matchHistory = this.matchHistory.map(match => ({
                ...match,
                date: new Date(match.date).toLocaleDateString(),
                timeAgo: this.getTimeAgo(new Date(match.date)),
                durationFormatted: this.formatMatchDuration(match.duration)
            }));
        }
    } catch (error) {
        console.error('Error loading history:', error);
        this.matchHistory = [];
    }
  }

  formatMatchDuration(minutes) {
    if (!minutes) return '0m 0s';
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}m ${secs}s`;
  }

  setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab || e.target.closest('.tab-btn').dataset.tab;
        this.switchTab(tabName);
      });
    });
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) editBtn.addEventListener('click', () => this.switchTab('settings'));
    const shareBtn = document.getElementById('shareProfileBtn');
    if (shareBtn) shareBtn.addEventListener('click', () => this.shareProfile());
    const avatarBtn = document.querySelector('.edit-avatar-btn');
    if (avatarBtn) avatarBtn.addEventListener('click', () => this.openAvatarModal());
    this.setupSettingsListeners();
    this.setupHistoryFilters();
  }

  setupTabNavigation() {
    this.switchTab('overview');
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const selectedBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(tabName);
    if (selectedBtn && selectedContent) {
      selectedBtn.classList.add('active');
      selectedContent.classList.add('active');
      this.currentTab = tabName;
      if (tabName === 'achievements') this.loadAchievements();
      else if (tabName === 'history') this.loadMatchHistory();
      else if (tabName === 'statistics') this.updateStatistics();
    }
  }

  updateProfileDisplay() {
    document.querySelectorAll('.username, .display-username').forEach(el => el.textContent = this.userData.username);
    document.querySelectorAll('#userBlob, .avatar-blob').forEach(el => {
      el.style.background = this.userData.avatar || 'linear-gradient(45deg, #ff6b6b, #4ecdc4)';
    });
    const quickStats = document.querySelectorAll('.quick-stat .stat-value');
    if (quickStats.length >= 3) {
      quickStats[0].textContent = this.userData.maxScore.toLocaleString();
      quickStats[1].textContent = this.userData.globalRank ? `#${this.userData.globalRank}` : 'N/A';
      quickStats[2].textContent = this.userData.totalWins;
    }
    this.updateLevelProgress();
    this.updateGeneralStats();
  }

  updateLevelProgress() {
    const levelEl = document.querySelector('.current-level');
    const progressFill = document.querySelector('.level-progress .progress-fill');
    const progressText = document.querySelector('.progress-text');
    const nextLevel = document.querySelector('.next-level');
    if (levelEl) levelEl.textContent = this.userData.level;
    if (progressFill) progressFill.style.width = `${(this.userData.currentXP / this.userData.maxXP) * 100}%`;
    if (progressText) {
      const spans = progressText.querySelectorAll('span');
      if (spans.length >= 2) {
        spans[0].textContent = `${this.userData.currentXP.toLocaleString()} / ${this.userData.maxXP.toLocaleString()} XP`;
        spans[1].textContent = `${Math.round((this.userData.currentXP / this.userData.maxXP) * 100)}%`;
      }
    }
    if (nextLevel) {
      const remaining = this.userData.maxXP - this.userData.currentXP;
      nextLevel.textContent = `${remaining.toLocaleString()} XP para el siguiente nivel`;
    }
  }

  updateGeneralStats() {
    const statValues = document.querySelectorAll('.stats-list .stat-item .stat-value');
    if (statValues.length >= 5) {
      statValues[0].textContent = this.userData.totalScore.toLocaleString();
      statValues[1].textContent = this.userData.gamesPlayed;
      statValues[2].textContent = this.userData.totalTimeFormatted;
      statValues[3].textContent = this.userData.totalWins;
      statValues[4].textContent = `${this.userData.winRate}%`;
    }
  }

  loadAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    this.achievements[0].progress = Math.min(this.userData.totalWins, 5);
    this.achievements[0].unlocked = this.userData.totalWins >= 5;
    this.achievements[2].progress = this.userData.gamesPlayed >= 1 ? 1 : 0;
    this.achievements[2].unlocked = this.userData.gamesPlayed >= 1;
    this.achievements[3].progress = Math.min(this.userData.totalWins, 10);
    this.achievements[3].unlocked = this.userData.totalWins >= 10;
    this.achievements.forEach(ach => {
      const card = document.createElement('div');
      card.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
      const pct = Math.round((ach.progress / ach.maxProgress) * 100);
      card.innerHTML = `<div class="achievement-icon ${ach.rarity}"><i class="${ach.icon}"></i></div><div class="achievement-content"><h4>${ach.name}</h4><p>${ach.description}</p><div class="achievement-progress"><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><span>${ach.progress}/${ach.maxProgress}</span></div><div class="unlock-date">${ach.unlocked ? '✓ Desbloqueado' : `${pct}% completado`}</div></div>`;
      card.style.cssText = `background:rgba(255,255,255,0.1);border-radius:15px;padding:20px;backdrop-filter:blur(10px);transition:all 0.3s;border:2px solid ${ach.unlocked ? 'rgba(76,175,80,0.5)' : 'transparent'};opacity:${ach.unlocked ? '1' : '0.7'};`;
      if (!ach.unlocked) card.style.filter = 'grayscale(50%)';
      grid.appendChild(card);
    });
  }

  loadMatchHistory() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (this.matchHistory.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:rgba(255,255,255,0.6);padding:20px;">No hay partidas registradas aún</td></tr>';
      return;
    }
    this.matchHistory.slice(0, 20).forEach(match => {
      const row = document.createElement('tr');
      const icon = match.result === 'win' ? '<i class="fas fa-trophy" style="color:#4caf50;"></i>' : '<i class="fas fa-skull" style="color:#f44336;"></i>';
      const color = match.result === 'win' ? '#4caf50' : '#f44336';
      row.innerHTML = `<td style="color:rgba(255,255,255,0.8);">${match.date}</td><td style="font-weight:bold;color:#4ecdc4;">${match.score.toLocaleString()}</td><td><span style="color:${match.position <= 3 ? '#ffd700' : '#fff'};font-weight:bold;">#${match.position}</span><span style="color:rgba(255,255,255,0.6);font-size:0.9em;"> / ${match.totalPlayers}</span></td><td style="color:rgba(255,255,255,0.8);">${match.durationFormatted}</td><td style="color:rgba(255,255,255,0.6);">${match.totalPlayers}</td><td><div style="display:flex;align-items:center;gap:8px;color:${color};">${icon}<span style="font-weight:bold;">${match.result === 'win' ? 'Victoria' : 'Derrota'}</span></div></td>`;
      if (match.result === 'win' || match.position <= 3) row.style.background = `linear-gradient(45deg,${color}20,${color}10)`;
      tbody.appendChild(row);
    });
  }

  setupHistoryFilters() {
    const filter = document.getElementById('historyFilter');
    const date = document.getElementById('dateFilter');
    if (filter) filter.addEventListener('change', () => this.loadMatchHistory());
    if (date) date.addEventListener('change', () => this.loadMatchHistory());
  }

  updateStatistics() {
    const rows = document.querySelectorAll('.stat-category .stat-row');
    if (rows.length >= 6) {
      rows[0].children[1].textContent = this.userData.averageScore.toLocaleString();
      rows[1].children[1].textContent = `${this.userData.bestStreak} victorias`;
      rows[2].children[1].textContent = this.userData.averageLifeTime;
      rows[3].children[1].textContent = this.userData.eliminatedPlayers;
      rows[4].children[1].textContent = this.userData.timesEliminated;
      rows[5].children[1].textContent = this.userData.kdRatio;
    }
  }

  initializeCharts() {
    const canvas = document.getElementById('scoreChart');
    if (canvas) this.drawScoreChart(canvas.getContext('2d'), canvas.width, canvas.height);
  }

  drawScoreChart(ctx, w, h) {
    const data = this.matchHistory.slice(0, 30).reverse().map(m => m.score);
    if (data.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No hay datos suficientes', w / 2, h / 2);
      return;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const stepX = w / (data.length - 1);
    const maxY = Math.max(...data);
    const minY = Math.min(...data);
    const rangeY = maxY - minY || 1;
    data.forEach((val, i) => {
      const x = i * stepX;
      const y = h - ((val - minY) / rangeY) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = 'rgba(78,205,196,0.2)';
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }

  setupSettingsListeners() {
    const save = document.getElementById('saveSettings');
    const reset = document.getElementById('resetSettings');
    if (save) save.addEventListener('click', () => this.saveSettings());
    if (reset) reset.addEventListener('click', () => this.resetSettings());
    this.loadCurrentSettings();
  }

  loadCurrentSettings() {
    const user = document.getElementById('usernameInput');
    const email = document.getElementById('emailInput');
    const bio = document.getElementById('bioInput');
    if (user) user.value = this.userData.username;
    if (email) email.value = this.userData.email;
    if (bio) bio.value = this.userData.bio;
    if (this.userData.settings) {
      Object.keys(this.userData.settings).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.type === 'checkbox' ? (el.checked = this.userData.settings[key]) : (el.value = this.userData.settings[key]);
      });
    }
  }

  async saveSettings() {
    const user = document.getElementById('usernameInput');
    const email = document.getElementById('emailInput');
    const bio = document.getElementById('bioInput');
    const data = {};
    if (user && user.value !== this.userData.username) data.username = user.value;
    if (email && email.value !== this.userData.email) data.email = email.value;
    if (bio && bio.value !== this.userData.bio) data.bio = bio.value;
    const settings = {};
    let changed = false;
    if (this.userData.settings) {
      Object.keys(this.userData.settings).forEach(key => {
        const el = document.getElementById(key);
        if (el) {
          const val = el.type === 'checkbox' ? el.checked : el.value;
          if (val !== this.userData.settings[key]) {
            settings[key] = val;
            changed = true;
          }
        }
      });
    }
    if (changed) data.settings = { ...this.userData.settings, ...settings };
    if (Object.keys(data).length > 0) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          const updated = await res.json();
          this.userData = { ...this.userData, ...updated };
          this.updateProfileDisplay();
          this.showToast('Configuración guardada exitosamente', 'success');
        } else {
          const err = await res.json();
          this.showToast(err.message || 'Error al guardar', 'error');
        }
      } catch (error) {
        console.error('Error saving:', error);
        this.showToast('Error de conexión', 'error');
      }
    } else {
      this.showToast('No hay cambios para guardar', 'info');
    }
  }

  resetSettings() {
    if (confirm('¿Estás seguro de restablecer toda la configuración?')) {
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
    const colors = document.querySelectorAll('.color-option');
    const preview = document.getElementById('previewBlob');
    const save = document.getElementById('saveAvatar');
    const cancel = document.getElementById('cancelAvatar');
    const modal = document.getElementById('avatarModal');
    let selected = this.userData.avatar;
    if (preview) preview.style.background = selected;
    colors.forEach(opt => {
      opt.addEventListener('click', () => {
        colors.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        selected = this.getColorGradient(opt.dataset.color);
        if (preview) preview.style.background = selected;
      });
    });
    if (save) {
      save.addEventListener('click', async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ avatar: selected })
          });
          if (res.ok) {
            this.userData.avatar = selected;
            this.updateProfileDisplay();
            modal.style.display = 'none';
            this.showToast('Avatar actualizado', 'success');
          } else {
            this.showToast('Error al actualizar avatar', 'error');
          }
        } catch (error) {
          console.error('Error:', error);
          this.showToast('Error de conexión', 'error');
        }
      });
    }
    if (cancel) cancel.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
  }

  getColorGradient(color) {
    const grads = {
      red: 'linear-gradient(45deg, #ff6b6b, #ff5722)',
      blue: 'linear-gradient(45deg, #4ecdc4, #45b7d1)',
      green: 'linear-gradient(45deg, #96ceb4, #66bb6a)',
      purple: 'linear-gradient(45deg, #ab47bc, #ec407a)',
      orange: 'linear-gradient(45deg, #ffa726, #ff7043)',
      pink: 'linear-gradient(45deg, #ec407a, #e91e63)'
    };
    return grads[color] || grads.red;
  }

  shareProfile() {
    const url = `${window.location.origin}/profile.html?user=${this.userData.username}`;
    if (navigator.share) {
      navigator.share({ title: `Perfil de ${this.userData.username} - Blob.io`, text: `¡Mira mi perfil! Nivel ${this.userData.level} con ${this.userData.totalWins} victorias.`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => this.showToast('Enlace copiado', 'success'));
    }
  }

  showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `position:fixed;top:100px;right:20px;background:rgba(0,0,0,0.9);color:#fff;padding:15px 20px;border-radius:10px;z-index:3000;animation:slideIn 0.3s;border-left:4px solid ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#4ecdc4'}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => new ProfileManager());

const style = document.createElement('style');
style.textContent = `@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}.achievement-card:hover{transform:translateY(-5px);box-shadow:0 10px 30px rgba(0,0,0,0.3)}.achievement-card .achievement-icon{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5em;color:#fff;margin-bottom:15px}.achievement-card .achievement-icon.gold{background:linear-gradient(45deg,#ffd700,#ffed4e)}.achievement-card .achievement-icon.silver{background:linear-gradient(45deg,#c0c0c0,#e8e8e8)}.achievement-card .achievement-icon.bronze{background:linear-gradient(45deg,#cd7f32,#d4a574)}.achievement-card .achievement-content h4{color:#fff;margin-bottom:10px}.achievement-card .achievement-content p{color:rgba(255,255,255,0.7);margin-bottom:15px;font-size:0.9em}.achievement-card .unlock-date{font-size:0.8em;color:#4ecdc4;margin-top:10px}.achievement-progress{margin-top:10px}.achievement-progress .progress-bar{background:rgba(255,255,255,0.1);border-radius:10px;height:8px;overflow:hidden;margin-bottom:5px}.achievement-progress .progress-fill{background:linear-gradient(90deg,#4ecdc4,#45b7d1);height:100%;transition:width 0.3s}#achievementsGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;margin-top:20px}`;
document.head.appendChild(style);
