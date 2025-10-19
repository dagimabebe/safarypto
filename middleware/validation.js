const { body, validationResult, param } = require('express-validator');

const validationMiddleware = {
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  },

  validateRegistration: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('phone')
      .matches(/^254[17][0-9]{8}$/)
      .withMessage('Please provide a valid Kenyan phone number (254XXXXXXXXX)'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match')
  ],

  validateLogin: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  validateSTKPush: [
    body('phone')
      .matches(/^254[17][0-9]{8}$/)
      .withMessage('Please provide a valid Kenyan phone number'),
    body('amount')
      .isFloat({ min: 1, max: 150000 })
      .withMessage('Amount must be between 1 and 150,000 KES')
  ],

  validateWalletTransfer: [
    body('toAddress')
      .notEmpty()
      .withMessage('Recipient address is required')
      .isLength({ min: 42, max: 42 })
      .withMessage('Invalid Ethereum address'),
    body('amount')
      .isFloat({ min: 0.0001 })
      .withMessage('Amount must be at least 0.0001'),
    body('currency')
      .isIn(['ETH', 'USDT'])
      .withMessage('Currency must be ETH or USDT')
  ],

  validateMpesaSwap: [
    body('amount')
      .isFloat({ min: 100, max: 150000 })
      .withMessage('Amount must be between 100 and 150,000 KES'),
    body('currency')
      .isIn(['ETH', 'USDT'])
      .withMessage('Currency must be ETH or USDT')
  ],

  validateObjectId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ],

  sanitizeInput: (req, res, next) => {
    const sanitize = (obj) => {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);
    
    next();
  }
};

module.exports = validationMiddleware;
