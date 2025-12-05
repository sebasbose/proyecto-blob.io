// Navegación entre páginas del proyecto Blob.io
class NavigationManager {
  constructor() {
    this.pages = {
      home: 'index.html',
      leaderboards: 'leaderboards.html',
      profile: 'profile.html',
      friends: 'friends.html',
      login: 'login.html'
    };
    
    this.init();
  }

  init() {
    this.checkAuthentication();
    this.setupEventListeners();
  }

  checkAuthentication() {
    // Páginas que no requieren autenticación
    const publicPages = ['login.html', 'register.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Si no está autenticado y no está en una página pública, redirigir al login
    if (!API_CONFIG.isAuthenticated() && !publicPages.includes(currentPage)) {
      window.location.href = 'login.html';
    }
  }

  setupEventListeners() {
    // Toggle móvil
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
      });
    }

    // Cerrar menú móvil al hacer click en un enlace
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (navToggle && navLinks) {
          navToggle.classList.remove('active');
          navLinks.classList.remove('active');
        }
      });
    });

    // Marcar página activa
    this.markActivePage();
  }

  markActivePage() {
    const currentPage = this.getCurrentPage();
    
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      
      if (link.dataset.page === currentPage) {
        link.classList.add('active');
      }
    });
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    // Mapear archivo a página
    if (filename === 'index.html' || filename === '') return 'home';
    if (filename === 'leaderboards.html') return 'leaderboards';
    if (filename === 'profile.html') return 'profile';
    if (filename === 'friends.html') return 'friends';
    
    return 'home';
  }

  // Métodos para navegación programática
  navigateTo(page) {
    if (this.pages[page]) {
      window.location.href = this.pages[page];
    }
  }

  goHome() {
    this.navigateTo('home');
  }

  goToLeaderboards() {
    this.navigateTo('leaderboards');
  }

  goToProfile() {
    this.navigateTo('profile');
  }

  goToFriends() {
    this.navigateTo('friends');
  }

  logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      // Usar AuthCheck si está disponible, sino usar API_CONFIG
      if (window.AuthCheck) {
        AuthCheck.logout();
      } else {
        API_CONFIG.logout();
      }
    }
  }
}

// Inicializar navegación automáticamente
document.addEventListener('DOMContentLoaded', () => {
  window.navigationManager = new NavigationManager();
});

// Funciones de navegación global
window.navigateTo = (page) => {
  if (window.navigationManager) {
    window.navigationManager.navigateTo(page);
  }
};

// Exportar para uso en otros scripts
window.NavigationManager = NavigationManager;