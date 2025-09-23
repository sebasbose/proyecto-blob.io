// auth.middleware.js - Authentication and authorization middleware
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class AuthService {
  constructor() {
    this.sessions = new Map();
    this.tokens = new Map();
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.tokenTimeout = 2 * 60 * 60 * 1000; // 2 hours
    this.maxSessionsPerUser = 3;
    this.secretKey = process.env.JWT_SECRET || 'blob-game-secret-key-2024';
    
    // Cleanup expired sessions every hour
    setInterval(() => this.cleanupExpired(), 60 * 60 * 1000);
  }

  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
  }

  hashPassword(password, salt = null) {
    if (!salt) {
      salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  verifyPassword(password, hash, salt) {
    const { hash: newHash } = this.hashPassword(password, salt);
    return hash === newHash;
  }

  createSession(playerId, playerData = {}) {
    const sessionId = this.generateSessionId();
    const token = this.generateToken();
    const expiresAt = Date.now() + this.sessionTimeout;

    // Clean up old sessions for this user
    this.cleanupUserSessions(playerId);

    const session = {
      sessionId,
      playerId,
      playerData: {
        username: playerData.username || 'Guest',
        level: playerData.level || 1,
        achievements: playerData.achievements || [],
        preferences: playerData.preferences || {}
      },
      token,
      createdAt: Date.now(),
      expiresAt,
      lastActivity: Date.now(),
      isActive: true
    };

    this.sessions.set(sessionId, session);
    this.tokens.set(token, sessionId);

    return {
      sessionId,
      token,
      expiresAt,
      playerData: session.playerData
    };
  }

  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive || Date.now() > session.expiresAt) {
      if (session) {
        this.destroySession(sessionId);
      }
      return null;
    }

    // Update last activity
    session.lastActivity = Date.now();
    return session;
  }

  validateToken(token) {
    const sessionId = this.tokens.get(token);
    return sessionId ? this.validateSession(sessionId) : null;
  }

  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.tokens.delete(session.token);
      this.sessions.delete(sessionId);
    }
  }

  cleanupUserSessions(playerId) {
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.playerId === playerId)
      .sort((a, b) => b.lastActivity - a.lastActivity);

    // Keep only the most recent sessions
    if (userSessions.length >= this.maxSessionsPerUser) {
      const sessionsToRemove = userSessions.slice(this.maxSessionsPerUser - 1);
      sessionsToRemove.forEach(session => {
        this.destroySession(session.sessionId);
      });
    }
  }

  cleanupExpired() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt || !session.isActive) {
        this.destroySession(sessionId);
      }
    }
  }

  getSessionStats() {
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => session.isActive && Date.now() <= session.expiresAt);
    
    return {
      totalSessions: this.sessions.size,
      activeSessions: activeSessions.length,
      totalTokens: this.tokens.size,
      uniqueUsers: new Set(activeSessions.map(s => s.playerId)).size
    };
  }

  extendSession(sessionId, additionalTime = this.sessionTimeout) {
    const session = this.sessions.get(sessionId);
    if (session && session.isActive) {
      session.expiresAt = Math.max(session.expiresAt, Date.now() + additionalTime);
      session.lastActivity = Date.now();
      return true;
    }
    return false;
  }
}

// Global auth service instance
const authService = new AuthService();

// Authentication middleware
const authenticate = (required = true) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-auth-token'] || 
                  req.query.token ||
                  req.cookies?.authToken;

    if (!token) {
      if (required) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_TOKEN',
          timestamp: new Date().toISOString()
        });
      }
      // Optional authentication - continue without user
      req.user = null;
      req.session = null;
      return next();
    }

    const session = authService.validateToken(token);
    
    if (!session) {
      if (required) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
          timestamp: new Date().toISOString()
        });
      }
      // Optional authentication - continue without user
      req.user = null;
      req.session = null;
      return next();
    }

    // Attach user and session to request
    req.user = {
      id: session.playerId,
      ...session.playerData
    };
    req.session = session;
    req.sessionId = session.sessionId;

    next();
  };
};

// Guest authentication (creates temporary session)
const authenticateGuest = (req, res, next) => {
  // Check if already authenticated
  if (req.user) {
    return next();
  }

  // Create guest session
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const session = authService.createSession(guestId, {
    username: `Guest_${guestId.slice(-8)}`,
    level: 1,
    isGuest: true
  });

  req.user = {
    id: guestId,
    ...session.playerData,
    isGuest: true
  };
  req.session = authService.validateSession(session.sessionId);
  req.sessionId = session.sessionId;

  // Send token in response headers
  res.setHeader('X-Auth-Token', session.token);
  
  next();
};

// Authorization middleware
const authorize = (permissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_AUTH',
        timestamp: new Date().toISOString()
      });
    }

    // Guest users have limited permissions
    if (req.user.isGuest && permissions.includes('registered_only')) {
      return res.status(403).json({
        success: false,
        error: 'Registration required for this action',
        code: 'GUEST_NOT_ALLOWED',
        timestamp: new Date().toISOString()
      });
    }

    // Admin permissions
    if (permissions.includes('admin') && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED',
        timestamp: new Date().toISOString()
      });
    }

    // Level-based permissions
    const requiredLevel = permissions.find(p => p.startsWith('level_'));
    if (requiredLevel) {
      const level = parseInt(requiredLevel.split('_')[1]);
      if (req.user.level < level) {
        return res.status(403).json({
          success: false,
          error: `Level ${level} required`,
          code: 'INSUFFICIENT_LEVEL',
          requiredLevel: level,
          currentLevel: req.user.level,
          timestamp: new Date().toISOString()
        });
      }
    }

    next();
  };
};

// Rate limiting per user
const rateLimitPerUser = (maxRequests = 100, windowMs = 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request log for user
    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }

    const requests = userRequests.get(userId);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    userRequests.set(userId, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: maxRequests,
        window: windowMs,
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
        timestamp: new Date().toISOString()
      });
    }

    // Log this request
    recentRequests.push(now);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - recentRequests.length);
    res.setHeader('X-RateLimit-Reset', new Date(windowStart + windowMs).toISOString());

    next();
  };
};

// Session refresh middleware
const refreshSession = (req, res, next) => {
  if (req.session && req.sessionId) {
    // Extend session if it's close to expiring
    const timeUntilExpiry = req.session.expiresAt - Date.now();
    const refreshThreshold = 30 * 60 * 1000; // 30 minutes

    if (timeUntilExpiry < refreshThreshold) {
      authService.extendSession(req.sessionId);
      
      // Send new expiry time in response headers
      res.setHeader('X-Session-Expires', new Date(req.session.expiresAt).toISOString());
    }
  }
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent XSS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

// Login endpoint helper
const loginHandler = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required',
        code: 'MISSING_USERNAME',
        timestamp: new Date().toISOString()
      });
    }

    // For this mock implementation, we'll create a session for any username
    // In a real implementation, you'd validate against a database
    const playerId = `player_${username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    
    const sessionDuration = rememberMe ? 7 * 24 * 60 * 60 * 1000 : authService.sessionTimeout;
    const session = authService.createSession(playerId, {
      username,
      level: 1,
      achievements: [],
      preferences: {},
      lastLogin: new Date().toISOString()
    });

    if (rememberMe) {
      authService.extendSession(session.sessionId, sessionDuration);
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: session.token,
        expiresAt: session.expiresAt,
        user: session.playerData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed',
      code: 'LOGIN_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Logout endpoint helper
const logoutHandler = (req, res) => {
  if (req.sessionId) {
    authService.destroySession(req.sessionId);
  }

  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  authService,
  authenticate,
  authenticateGuest,
  authorize,
  rateLimitPerUser,
  refreshSession,
  securityHeaders,
  loginHandler,
  logoutHandler
};