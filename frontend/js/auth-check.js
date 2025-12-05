// Sistema de verificación de autenticación
const AuthCheck = {
  // Páginas que requieren autenticación
  protectedPages: [
    'index.html',
    'profile.html',
    'friends.html',
    'leaderboards.html'
  ],

  // Páginas públicas (no requieren autenticación)
  publicPages: [
    'login.html',
    'register.html'
  ],

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    return !!(token && isLoggedIn);
  },

  // Obtener el nombre de la página actual
  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page;
  },

  // Verificar si la página actual requiere autenticación
  requiresAuth() {
    const currentPage = this.getCurrentPage();
    return this.protectedPages.some(page => currentPage.includes(page));
  },

  // Verificar si la página es pública
  isPublicPage() {
    const currentPage = this.getCurrentPage();
    return this.publicPages.some(page => currentPage.includes(page));
  },

  // Redirigir al login
  redirectToLogin() {
    const currentPage = this.getCurrentPage();
    console.log(`🔒 Acceso denegado a ${currentPage} - Redirigiendo a login`);
    
    // Limpiar datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    
    // Guardar la página a la que intentaba acceder
    sessionStorage.setItem('redirectAfterLogin', currentPage);
    
    window.location.href = 'login.html';
  },

  // Redirigir al index si ya está autenticado (para login/register)
  redirectToIndex() {
    console.log('✅ Usuario ya autenticado - Redirigiendo a inicio');
    window.location.href = 'index.html';
  },

  // Verificar token con el servidor
  async verifyTokenWithServer() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        // Actualizar datos del usuario en localStorage
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return true;
      } else {
        console.warn('Token inválido o expirado');
        return false;
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      return false;
    }
  },

  // Verificación principal
  async check() {
    const currentPage = this.getCurrentPage();
    
    // Si es una página pública y el usuario está autenticado, redirigir al index
    if (this.isPublicPage() && this.isAuthenticated()) {
      this.redirectToIndex();
      return false;
    }

    // Si es una página protegida
    if (this.requiresAuth()) {
      // Verificar autenticación básica (localStorage)
      if (!this.isAuthenticated()) {
        this.redirectToLogin();
        return false;
      }

      // Verificar token con el servidor (async)
      const isValid = await this.verifyTokenWithServer();
      if (!isValid) {
        this.redirectToLogin();
        return false;
      }

      console.log(`✅ Acceso autorizado a ${currentPage}`);
      return true;
    }

    // Página pública, acceso permitido
    return true;
  },

  // Verificación rápida sin servidor (para uso inmediato)
  quickCheck() {
    if (this.isPublicPage() && this.isAuthenticated()) {
      this.redirectToIndex();
      return false;
    }

    if (this.requiresAuth() && !this.isAuthenticated()) {
      this.redirectToLogin();
      return false;
    }

    return true;
  },

  // Cerrar sesión
  logout() {
    console.log('👋 Cerrando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
    window.location.href = 'login.html';
  },

  // Obtener información del usuario actual
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  },

  // Inicializar verificación automática
  init() {
    // Verificación rápida inmediata
    if (!this.quickCheck()) {
      return false;
    }

    // Verificación completa con el servidor
    this.check().catch(error => {
      console.error('Error en verificación de autenticación:', error);
    });

    return true;
  }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AuthCheck.init();
  });
} else {
  // DOM ya está listo
  AuthCheck.init();
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.AuthCheck = AuthCheck;
}
