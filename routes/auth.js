const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');
const rateLimitMiddleware = require('../middleware/rateLimit');

const router = express.Router();

router.post(
  '/register',
  rateLimitMiddleware.auth,
  validationMiddleware.sanitizeInput,
  validationMiddleware.validateRegistration,
  validationMiddleware.handleValidationErrors,
  authController.register
);

router.post(
  '/login',
  rateLimitMiddleware.auth,
  validationMiddleware.sanitizeInput,
  validationMiddleware.validateLogin,
  validationMiddleware.handleValidationErrors,
  authController.login
);

router.post(
  '/refresh-token',
  rateLimitMiddleware.general,
  validationMiddleware.sanitizeInput,
  authMiddleware.verifyRefreshToken,
  authController.refreshToken
);

router.post(
  '/logout',
  rateLimitMiddleware.general,
  validationMiddleware.sanitizeInput,
  authMiddleware.verifyToken,
  authController.logout
);

router.post(
  '/verify-phone',
  rateLimitMiddleware.sensitive,
  validationMiddleware.sanitizeInput,
  authMiddleware.verifyToken,
  authController.verifyPhone
);

module.exports = router;
