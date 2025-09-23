// error.middleware.js - Error handling middleware
const fs = require('fs').promises;
const path = require('path');

class ErrorHandler {
  constructor() {
    this.logPath = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  async logError(error, req, additionalInfo = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip
      },
      ...additionalInfo
    };

    try {
      const logFile = path.join(this.logPath, `error-${new Date().toISOString().split('T')[0]}.log`);
      await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    } catch (logError) {
      console.error('Failed to write error log:', logError);
    }
  }
}

const errorHandler = new ErrorHandler();

// Database error handler
const handleDatabaseError = (error, req, res, next) => {
  if (error.message.includes('ENOENT') || error.message.includes('JSON')) {
    return res.status(503).json({
      success: false,
      error: 'Database temporarily unavailable',
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  next(error);
};

// Validation error handler
const handleValidationError = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details || error.message,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  next(error);
};

// Authentication error handler
const handleAuthError = (error, req, res, next) => {
  if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized access',
      code: 'AUTH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  next(error);
};

// Rate limiting error handler
const handleRateLimitError = (error, req, res, next) => {
  if (error.message.includes('Too many requests')) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_ERROR',
      retryAfter: error.retryAfter || 60,
      timestamp: new Date().toISOString()
    });
  }
  next(error);
};

// Not found handler (404)
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Global error handler (must be last middleware)
const globalErrorHandler = async (error, req, res, next) => {
  // Log the error
  await errorHandler.logError(error, req, {
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error response
  let status = error.status || error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  }

  if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    status = 400;
    message = 'Invalid JSON format';
    code = 'INVALID_JSON';
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'File too large';
    code = 'FILE_TOO_LARGE';
  }

  // Security: Don't leak sensitive information in production
  if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'Internal server error';
  }

  const errorResponse = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString()
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = {
      name: error.name,
      originalMessage: error.message
    };
  }

  // Log error to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:');
    console.error(error);
  }

  res.status(status).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request timeout handler
const timeoutHandler = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          code: 'REQUEST_TIMEOUT',
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

// Health check error handler
const healthCheckError = (req, res, next) => {
  // If this is a health check endpoint, handle errors gracefully
  if (req.path === '/health' || req.path === '/api/health') {
    return (error, req, res, next) => {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Service temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    };
  }
  next();
};

// Custom error classes
class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.status = 409;
  }
}

class DatabaseError extends Error {
  constructor(message = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
    this.status = 503;
  }
}

// Error monitoring (for production)
const errorMonitoring = {
  // Track error rates
  errorCounts: new Map(),
  
  trackError: (error, req) => {
    const key = `${error.name}-${req.path}`;
    const current = errorMonitoring.errorCounts.get(key) || 0;
    errorMonitoring.errorCounts.set(key, current + 1);
    
    // Alert if error rate is high (implement alerting logic here)
    if (current > 10) {
      console.warn(`High error rate detected: ${key} - ${current} errors`);
    }
  },
  
  getErrorStats: () => {
    return Object.fromEntries(errorMonitoring.errorCounts);
  },
  
  resetStats: () => {
    errorMonitoring.errorCounts.clear();
  }
};

module.exports = {
  handleDatabaseError,
  handleValidationError,
  handleAuthError,
  handleRateLimitError,
  notFoundHandler,
  globalErrorHandler,
  asyncHandler,
  timeoutHandler,
  healthCheckError,
  errorMonitoring,
  
  // Custom error classes
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  DatabaseError,
  
  // Error handler instance
  errorHandler
};