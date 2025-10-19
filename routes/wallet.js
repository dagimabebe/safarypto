const express = require('express');
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');
const rateLimitMiddleware = require('../middleware/rateLimit');

const router = express.Router();

router.post(
  '/create',
  rateLimitMiddleware.sensitive,
  validationMiddleware.sanitizeInput,
  authMiddleware.verifyToken,
  walletController.createWallet
);

router.get(
  '/balance',
  rateLimitMiddleware.wallet,
  validationMiddleware.sanitizeInput,
  authMiddleware.verifyToken,
  walletController.getBalance
);

router.post(
  '/transfer',
  rateLimitMiddleware.wallet,
  validationMiddleware.sanitizeInput,
  validationMiddleware.validateWalletTransfer,
  validationMiddleware.handleValidationErrors,
  authMiddleware.verifyToken,
  walletController.transfer
);

router.post(
  '/swap-mpesa',
  rateLimitMiddleware.wallet,
  validationMiddleware.sanitizeInput,
  validationMiddleware.validateMpesaSwap,
  validationMiddleware.handleValidationErrors,
  authMiddleware.verifyToken,
  walletController.swapMpesaToCrypto
);

module.exports = router;
