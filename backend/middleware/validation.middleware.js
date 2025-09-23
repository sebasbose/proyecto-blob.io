// validation.middleware.js - Request validation and sanitization middleware
const { body, validationResult } = require('express-validator');

// Main validation middleware that processes validation results
const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Authentication validation
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('password')
    .optional()
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters'),
  
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean'),
  
  validationMiddleware
];

// Player validation
const validatePlayer = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Player name must be between 1 and 30 characters')
    .matches(/^[a-zA-Z0-9_\s-]+$/)
    .withMessage('Player name can only contain letters, numbers, spaces, underscores, and hyphens'),
  
  body('color')
    .optional()
    .matches(/^#[0-9a-fA-F]{6}$/)
    .withMessage('Color must be a valid hex color'),
  
  validationMiddleware
];

// Game validation
const validateGame = [
  body('gameMode')
    .optional()
    .isIn(['classic', 'teams', 'ffa'])
    .withMessage('Game mode must be classic, teams, or ffa'),
  
  body('maxPlayers')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Max players must be between 2 and 100'),
  
  validationMiddleware
];

// Update player validation
const validatePlayerUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Player name must be between 1 and 30 characters'),
  
  body('achievements')
    .optional()
    .isArray()
    .withMessage('Achievements must be an array'),
  
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
  
  validationMiddleware
];

// Movement validation
const validateMovement = [
  body('x')
    .isFloat({ min: 0 })
    .withMessage('X coordinate must be a positive number'),
  
  body('y')
    .isFloat({ min: 0 })
    .withMessage('Y coordinate must be a positive number'),
  
  body('targetX')
    .optional()
    .isFloat()
    .withMessage('Target X must be a number'),
  
  body('targetY')
    .optional()
    .isFloat()
    .withMessage('Target Y must be a number'),
  
  validationMiddleware
];

// Chat validation
const validateChat = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Message must be between 1 and 200 characters')
    .customSanitizer(value => {
      // Remove harmful content
      return value.replace(/<[^>]*>/g, ''); // Remove HTML tags
    }),
  
  validationMiddleware
];

// Utility functions
const sanitizePlayerName = (name) => {
  return name.trim().replace(/[^\w\s-]/g, '').substring(0, 30);
};

const isValidHexColor = (color) => {
  return /^#[0-9a-fA-F]{6}$/.test(color);
};

const isValidCoordinate = (value, max = 10000) => {
  return typeof value === 'number' && value >= 0 && value <= max && !isNaN(value);
};

module.exports = {
  validationMiddleware,
  validateLogin,
  validatePlayer,
  validateGame,
  validatePlayerUpdate,
  validateMovement,
  validateChat,
  sanitizePlayerName,
  isValidHexColor,
  isValidCoordinate
};