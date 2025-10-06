// auth.js - Manejo de autenticación para login y registro

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Funcionalidad para Login
    if (loginForm) {
        initLoginForm();
    }
    
    // Funcionalidad para Registro
    if (registerForm) {
        initRegisterForm();
    }
    
    // Inicializar botones sociales
    initSocialButtons();
});

function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const rememberMe = document.getElementById('rememberMe');
    
    // Cargar datos guardados si existe "recordarme"
    if (localStorage.getItem('rememberUser') === 'true') {
        const savedUsername = localStorage.getItem('savedUsername');
        if (savedUsername) {
            usernameInput.value = savedUsername;
            rememberMe.checked = true;
        }
    }
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Validaciones básicas
        if (!username || !password) {
            showMessage('Por favor completa todos los campos', 'error');
            return;
        }
        
        // Mostrar estado de carga
        const submitBtn = loginForm.querySelector('.auth-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'INICIANDO SESIÓN...';
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        // Simular proceso de login (aquí irían las llamadas al servidor)
        setTimeout(() => {
            // Ejemplo de validación simple (en producción esto sería del servidor)
            if (validateLogin(username, password)) {
                // Guardar datos si "recordarme" está activado
                if (rememberMe.checked) {
                    localStorage.setItem('rememberUser', 'true');
                    localStorage.setItem('savedUsername', username);
                } else {
                    localStorage.removeItem('rememberUser');
                    localStorage.removeItem('savedUsername');
                }
                
                // Guardar sesión del usuario
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', username);
                
                showMessage('¡Inicio de sesión exitoso!', 'success');
                
                // Redirigir al juego después de un breve delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showMessage('Usuario o contraseña incorrectos', 'error');
                submitBtn.textContent = originalText;
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }, 1500);
    });
}

function initRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('registerUsername');
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const acceptTerms = document.getElementById('acceptTerms');
    
    // Validación en tiempo real de la contraseña
    passwordInput.addEventListener('input', function() {
        validatePasswordRequirements(passwordInput.value);
    });
    
    // Validación de confirmación de contraseña
    confirmPasswordInput.addEventListener('input', function() {
        validatePasswordMatch();
    });
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validaciones
        if (!validateRegistration(username, email, password, confirmPassword)) {
            return;
        }
        
        if (!acceptTerms.checked) {
            showMessage('Debes aceptar los términos y condiciones', 'error');
            return;
        }
        
        // Mostrar estado de carga
        const submitBtn = registerForm.querySelector('.auth-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'CREANDO CUENTA...';
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        // Simular proceso de registro
        setTimeout(() => {
            if (createAccount(username, email, password)) {
                showMessage('¡Cuenta creada exitosamente!', 'success');
                
                // Redirigir al login después de un breve delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                showMessage('Error al crear la cuenta. El usuario ya existe.', 'error');
                submitBtn.textContent = originalText;
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }, 2000);
    });
}

function validatePasswordRequirements(password) {
    const minLength = document.getElementById('minLength');
    const hasLetter = document.getElementById('hasLetter');
    const hasNumber = document.getElementById('hasNumber');
    
    // Validar longitud mínima
    if (password.length >= 6) {
        minLength.classList.add('valid');
        minLength.classList.remove('invalid');
    } else {
        minLength.classList.add('invalid');
        minLength.classList.remove('valid');
    }
    
    // Validar que tenga al menos una letra
    if (/[a-zA-Z]/.test(password)) {
        hasLetter.classList.add('valid');
        hasLetter.classList.remove('invalid');
    } else {
        hasLetter.classList.add('invalid');
        hasLetter.classList.remove('valid');
    }
    
    // Validar que tenga al menos un número
    if (/\d/.test(password)) {
        hasNumber.classList.add('valid');
        hasNumber.classList.remove('invalid');
    } else {
        hasNumber.classList.add('invalid');
        hasNumber.classList.remove('valid');
    }
}

function validatePasswordMatch() {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    if (confirmPassword.length > 0) {
        if (password === confirmPassword) {
            confirmInput.style.borderColor = '#4ecdc4';
            confirmInput.style.boxShadow = '0 0 10px rgba(78, 205, 196, 0.3)';
        } else {
            confirmInput.style.borderColor = '#ff6b6b';
            confirmInput.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.3)';
        }
    } else {
        confirmInput.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        confirmInput.style.boxShadow = 'none';
    }
}

function validateLogin(username, password) {
    // Simulación de validación (en producción esto sería una llamada al servidor)
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    return users.some(user => 
        (user.username === username || user.email === username) && user.password === password
    );
}

function validateRegistration(username, email, password, confirmPassword) {
    // Validar nombre de usuario
    if (username.length < 3 || username.length > 15) {
        showMessage('El nombre de usuario debe tener entre 3 y 15 caracteres', 'error');
        return false;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Por favor ingresa un email válido', 'error');
        return false;
    }
    
    // Validar contraseña
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return false;
    }
    
    if (!/[a-zA-Z]/.test(password)) {
        showMessage('La contraseña debe contener al menos una letra', 'error');
        return false;
    }
    
    if (!/\d/.test(password)) {
        showMessage('La contraseña debe contener al menos un número', 'error');
        return false;
    }
    
    // Validar confirmación de contraseña
    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return false;
    }
    
    return true;
}

function createAccount(username, email, password) {
    // Verificar si el usuario ya existe
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    if (users.some(user => user.username === username || user.email === email)) {
        return false; // Usuario ya existe
    }
    
    // Crear nuevo usuario
    const newUser = {
        username: username,
        email: email,
        password: password, // En producción esto debería estar hasheado
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
    
    return true;
}

function initSocialButtons() {
    // Botones de Google
    const googleBtns = document.querySelectorAll('.google-btn');
    googleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            showMessage('Funcionalidad de Google en desarrollo', 'info');
        });
    });
    
    // Botones de Facebook
    const facebookBtns = document.querySelectorAll('.facebook-btn');
    facebookBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            showMessage('Funcionalidad de Facebook en desarrollo', 'info');
        });
    });
}

function showMessage(message, type = 'info') {
    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message ${type}`;
    messageDiv.textContent = message;
    
    // Estilos del mensaje
    Object.assign(messageDiv.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '10px',
        color: '#fff',
        fontWeight: 'bold',
        zIndex: '10000',
        animation: 'slideIn 0.3s ease-out',
        maxWidth: '300px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
    });
    
    // Colores según el tipo
    switch(type) {
        case 'success':
            messageDiv.style.background = 'linear-gradient(45deg, #4ecdc4, #44a08d)';
            break;
        case 'error':
            messageDiv.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
            break;
        case 'info':
            messageDiv.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
            break;
    }
    
    // Agregar al DOM
    document.body.appendChild(messageDiv);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 4000);
}

// Agregar animaciones CSS para los mensajes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);