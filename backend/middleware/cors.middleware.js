// cors.middleware.js - CORS configuration and security middleware
const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:8080',
      'http://127.0.0.1:8080'
    ];
    
    // In production, add your production domains
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(
        'https://your-production-domain.com',
        'https://www.your-production-domain.com'
      );
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Auth-Token',
    'X-API-Key',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'X-Auth-Token',
    'X-Session-Expires',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Create the CORS middleware
const corsMiddleware = cors(corsOptions);

module.exports = {
  corsMiddleware,
  corsOptions
};