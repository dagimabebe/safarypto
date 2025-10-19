const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');
const rateLimitMiddleware = require('../middleware/rateLimit');

const router = express.Router();

router.get(
  '/profile',
  rateLimitMiddleware.general,
  validationMiddleware.sanitizeInput,
  authMiddleware.verifyToken,
  userController.getProfile
);

router.put(
  '/profile',
  rateLimitMiddleware.general,
  validationMiddleware.sanitizeInput,
  authMiddleware.verifyToken,
  userController.updateProfile
);

router.get(
  '/transactions',
  rateLimitMiddleware.general,
  validationMiddleware.sanitizeInput,
  authMiddleware.verifyToken,
  userController.getTransactions
);

module.exports = router;
