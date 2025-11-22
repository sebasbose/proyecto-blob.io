// Navegación entre páginas del proyecto Blob.io
class NavigationManager {
  constructor() {
    this.pages = {
      home: 'index.html',
      leaderboards: 'leaderboards.html',
      profile: 'profile.html',
      friends: 'friends.html'
    };
    
    this.init();
  }

  init() {
    this.createNavigationMenu();
    this.addNavigationStyles();
    this.setupEventListeners();
  }

  createNavigationMenu() {
    // Crear menú de navegación si no existe
    let nav = document.querySelector('.main-navigation');
    
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'main-navigation';
      nav.innerHTML = this.getNavigationHTML();
      
      // Insertar después del header si existe, o al inicio del body
      const header = document.querySelector('header');
      if (header) {
        header.appendChild(nav);
      } else {
        document.body.insertBefore(nav, document.body.firstChild);
      }
    }
  }

  getNavigationHTML() {
    return `
      <div class="nav-container">
        <div class="nav-brand">
          <a href="${this.pages.home}" class="brand-link">
            <span class="brand-text">Blob.io</span>
          </a>
        </div>
        <div class="nav-links">
          <a href="${this.pages.home}" class="nav-link" data-page="home">
            <i class="fas fa-home"></i>
            <span>Inicio</span>
          </a>
          <a href="${this.pages.leaderboards}" class="nav-link" data-page="leaderboards">
            <i class="fas fa-trophy"></i>
            <span>Leaderboards</span>
          </a>
          <a href="${this.pages.profile}" class="nav-link" data-page="profile">
            <i class="fas fa-user"></i>
            <span>Perfil</span>
          </a>
          <a href="${this.pages.friends}" class="nav-link" data-page="friends">
            <i class="fas fa-users"></i>
            <span>Amigos</span>
          </a>
        </div>
        <div class="nav-toggle">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
  }

  addNavigationStyles() {
    const existingStyles = document.querySelector('#navigation-styles');
    if (existingStyles) return;

    const style = document.createElement('style');
    style.id = 'navigation-styles';
    style.textContent = `
      .main-navigation {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        background: rgba(102, 75, 162, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0;
        transition: all 0.3s ease;
      }

      .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        height: 60px;
      }

      .nav-brand .brand-link {
        text-decoration: none;
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }

      .nav-links {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .nav-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        text-decoration: none;
        color: rgba(255, 255, 255, 0.8);
        padding: 8px 12px;
        border-radius: 8px;
        transition: all 0.3s ease;
        font-size: 0.9rem;
      }

      .nav-link:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }

      .nav-link.active {
        color: #4ecdc4;
        background: rgba(78, 205, 196, 0.2);
      }

      .nav-link i {
        font-size: 1.2rem;
      }

      .nav-toggle {
        display: none;
        flex-direction: column;
        cursor: pointer;
        gap: 4px;
      }

      .nav-toggle span {
        width: 25px;
        height: 3px;
        background: white;
        border-radius: 3px;
        transition: all 0.3s ease;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .nav-container {
          padding: 0 15px;
        }

        .nav-links {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(102, 75, 162, 0.98);
          flex-direction: column;
          padding: 20px;
          gap: 15px;
          transform: translateY(-100%);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .nav-links.active {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
        }

        .nav-link {
          flex-direction: row;
          gap: 10px;
          width: 100%;
          justify-content: flex-start;
          padding: 15px;
        }

        .nav-toggle {
          display: flex;
        }

        .nav-toggle.active span:nth-child(1) {
          transform: rotate(45deg) translate(6px, 6px);
        }

        .nav-toggle.active span:nth-child(2) {
          opacity: 0;
        }

        .nav-toggle.active span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }
      }

      /* Ajustar contenido principal para la navegación fija */
      body {
        padding-top: 60px;
      }

      .container, .main-container, .game-container {
        margin-top: 20px !important;
      }
    `;

    document.head.appendChild(style);
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