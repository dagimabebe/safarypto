const express = require('express');
const mpesaController = require('../controllers/mpesaController');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');
const rateLimitMiddleware = require('../middleware/rateLimit');

const router = express.Router();

router.post(
  '/stk-push',
  rateLimitMiddleware.mpesa,
  validationMiddleware.sanitizeInput,
  validationMiddleware.validateSTKPush,
  validationMiddleware.handleValidationErrors,
  authMiddleware.verifyToken,
  mpesaController.stkPush
);

router.post(
  '/callback',
  mpesaController.handleCallback
);

router.post(
  '/b2c',
  rateLimitMiddleware.mpesa,
  validationMiddleware.sanitizeInput,
  authMiddleware.verifyToken,
  authMiddleware.requireRole(['admin']),
  mpesaController.b2cPayment
);

router.get(
  '/transaction-status/:id',
  rateLimitMiddleware.general,
  validationMiddleware.sanitizeInput,
  authMiddleware.verifyToken,
  mpesaController.getTransactionStatus
);

module.exports = router;
