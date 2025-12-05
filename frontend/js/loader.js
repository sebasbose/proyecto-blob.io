// Sistema de carga global
const PageLoader = {
  show(message = 'Cargando...', subtext = '') {
    const existingLoader = document.getElementById('pageLoader');
    if (existingLoader) {
      existingLoader.classList.remove('hidden');
      return;
    }

    const loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.className = 'page-loader';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-blob"></div>
        <div class="loader-text">${message}</div>
        ${subtext ? `<div class="loader-subtext">${subtext}</div>` : ''}
      </div>
    `;
    document.body.appendChild(loader);
  },

  hide(delay = 300) {
    setTimeout(() => {
      const loader = document.getElementById('pageLoader');
      if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => {
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        }, 300);
      }
    }, delay);
  },

  updateMessage(message, subtext = '') {
    const loader = document.getElementById('pageLoader');
    if (loader) {
      const textEl = loader.querySelector('.loader-text');
      const subtextEl = loader.querySelector('.loader-subtext');
      if (textEl) textEl.textContent = message;
      if (subtextEl) subtextEl.textContent = subtext;
    }
  }
};

// Loader para secciones específicas
const SectionLoader = {
  create(container, message = 'Cargando datos...') {
    if (!container) return null;
    
    const loader = document.createElement('div');
    loader.className = 'section-loader';
    loader.innerHTML = `
      <div class="loader-spinner"></div>
      <div class="section-loader-text">${message}</div>
    `;
    return loader;
  },

  show(container, message = 'Cargando datos...') {
    if (!container) return;
    const loader = this.create(container, message);
    container.innerHTML = '';
    container.appendChild(loader);
  },

  remove(container) {
    if (!container) return;
    const loader = container.querySelector('.section-loader');
    if (loader) {
      loader.remove();
    }
  }
};

// Skeleton loader para listas
const SkeletonLoader = {
  createCard() {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton skeleton-card';
    return skeleton;
  },

  showCards(container, count = 3) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      container.appendChild(this.createCard());
    }
  }
};

// Auto-inicializar loader al cargar página
if (document.readyState === 'loading') {
  PageLoader.show('Cargando Blob.io...', 'Preparando la experiencia de juego');
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.PageLoader = PageLoader;
  window.SectionLoader = SectionLoader;
  window.SkeletonLoader = SkeletonLoader;
}
