// API Configuration
const API_CONFIG = {
    BASE_URL: window.location.origin,
    API_PATH: '/api',
    WS_PATH: '/ws',
    
    // API Endpoints
    endpoints: {
        // Auth
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        
        // Users
        PROFILE: '/api/users/profile',
        HISTORY: '/api/users/history',
        UPDATE_PROFILE: '/api/users/profile',
        UPDATE_AVATAR: '/api/users/avatar',
        UPDATE_STATS: '/api/users/stats',
        
        // Friends
        FRIENDS_LIST: '/api/friends',
        SEND_REQUEST: '/api/friends/request',
        ACCEPT_REQUEST: '/api/friends/accept',
        REJECT_REQUEST: '/api/friends/reject',
        REMOVE_FRIEND: '/api/friends',
        PENDING_REQUESTS: '/api/friends/requests',
        
        // Leaderboard
        LEADERBOARD: '/api/leaderboard',
        
        // Health
        HEALTH: '/health'
    },
    
    // Request timeout
    TIMEOUT: 10000,
    
    // Token management
    getToken: () => localStorage.getItem('token'),
    setToken: (token) => localStorage.setItem('token', token),
    removeToken: () => localStorage.removeItem('token'),
    
    // Auth headers
    getAuthHeaders: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.getToken()}`
    }),
    
    // Standard headers
    getHeaders: () => ({
        'Content-Type': 'application/json'
    }),
    
    // Check if user is logged in
    isAuthenticated: () => !!API_CONFIG.getToken(),
    
    // Logout
    logout: () => {
        API_CONFIG.removeToken();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
};

// API Helper functions
const API = {
    // GET request
    get: async (endpoint, requireAuth = true) => {
        try {
            const headers = requireAuth ? API_CONFIG.getAuthHeaders() : API_CONFIG.getHeaders();
            const response = await fetch(endpoint, {
                method: 'GET',
                headers
            });
            
            if (response.status === 401 && requireAuth) {
                API_CONFIG.logout();
                return null;
            }
            
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },
    
    // POST request
    post: async (endpoint, data, requireAuth = true) => {
        try {
            const headers = requireAuth ? API_CONFIG.getAuthHeaders() : API_CONFIG.getHeaders();
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
            
            if (response.status === 401 && requireAuth) {
                API_CONFIG.logout();
                return null;
            }
            
            return { 
                ok: response.ok, 
                status: response.status,
                data: await response.json() 
            };
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },
    
    // PUT request
    put: async (endpoint, data, requireAuth = true) => {
        try {
            const headers = requireAuth ? API_CONFIG.getAuthHeaders() : API_CONFIG.getHeaders();
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data)
            });
            
            if (response.status === 401 && requireAuth) {
                API_CONFIG.logout();
                return null;
            }
            
            return { 
                ok: response.ok, 
                status: response.status,
                data: await response.json() 
            };
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    },
    
    // DELETE request
    delete: async (endpoint, requireAuth = true) => {
        try {
            const headers = requireAuth ? API_CONFIG.getAuthHeaders() : API_CONFIG.getHeaders();
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers
            });
            
            if (response.status === 401 && requireAuth) {
                API_CONFIG.logout();
                return null;
            }
            
            return { 
                ok: response.ok, 
                status: response.status,
                data: await response.json() 
            };
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }
};

// WebSocket Configuration
const WS_CONFIG = {
    url: null,
    socket: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    
    connect: () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        WS_CONFIG.url = `${protocol}//${window.location.host}`;
        
        try {
            WS_CONFIG.socket = new WebSocket(WS_CONFIG.url);
            
            WS_CONFIG.socket.onopen = () => {
                console.log('WebSocket connected');
                WS_CONFIG.reconnectAttempts = 0;
            };
            
            WS_CONFIG.socket.onclose = () => {
                console.log('WebSocket disconnected');
                WS_CONFIG.handleReconnect();
            };
            
            WS_CONFIG.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            return WS_CONFIG.socket;
        } catch (error) {
            console.error('WebSocket connection error:', error);
            return null;
        }
    },
    
    handleReconnect: () => {
        if (WS_CONFIG.reconnectAttempts < WS_CONFIG.maxReconnectAttempts) {
            WS_CONFIG.reconnectAttempts++;
            console.log(`Attempting to reconnect (${WS_CONFIG.reconnectAttempts}/${WS_CONFIG.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                WS_CONFIG.connect();
            }, WS_CONFIG.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    },
    
    send: (data) => {
        if (WS_CONFIG.socket && WS_CONFIG.socket.readyState === WebSocket.OPEN) {
            WS_CONFIG.socket.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected');
        }
    },
    
    close: () => {
        if (WS_CONFIG.socket) {
            WS_CONFIG.socket.close();
        }
    }
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
    window.API = API;
    window.WS_CONFIG = WS_CONFIG;
}
