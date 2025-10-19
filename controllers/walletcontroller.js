const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const blockchainConfig = require('../config/blockchain');
const encryptionUtils = require('../utils/encryption');
const blockchainHelpers = require('../utils/blockchainHelpers');

const walletController = {
  createWallet: async (req, res) => {
    try {
      const userId = req.user._id;

      const existingWallet = await Wallet.findOne({ userId });
      if (existingWallet) {
        return res.status(409).json({
          status: 'error',
          message: 'Wallet already exists for this user'
        });
      }

      const account = blockchainConfig.createAccount();
      const encryptedPrivateKey = encryptionUtils.encryptData(account.privateKey);

      const wallet = new Wallet({
        userId,
        publicKey: account.address,
        privateKeyEncrypted: encryptedPrivateKey,
        balance: 0
      });

      await wallet.save();

      await User.findByIdAndUpdate(userId, {
        walletAddress: account.address
      });

      res.status(201).json({
        status: 'success',
        message: 'Wallet created successfully',
        data: {
          wallet: wallet.toJSON()
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Wallet creation failed'
      });
    }
  },

  getBalance: async (req, res) => {
    try {
      const userId = req.user._id;

      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return res.status(404).json({
          status: 'error',
          message: 'Wallet not found'
        });
      }

      const balance = await blockchainConfig.getBalance(wallet.publicKey);

      await wallet.updateBalance(parseFloat(balance));

      res.json({
        status: 'success',
        data: {
          balance: parseFloat(balance),
          currency: wallet.currency,
          address: wallet.publicKey,
          lastSynced: wallet.lastSynced
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch balance'
      });
    }
  },

  transfer: async (req, res) => {
    try {
      const { toAddress, amount, currency } = req.body;
      const userId = req.user._id;

      if (!blockchainConfig.validateAddress(toAddress)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid recipient address'
        });
      }

      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return res.status(404).json({
          status: 'error',
          message: 'Wallet not found'
        });
      }

      const currentBalance = await blockchainConfig.getBalance(wallet.publicKey);
      if (parseFloat(currentBalance) < parseFloat(amount)) {
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient balance'
        });
      }

      const privateKey = encryptionUtils.decryptData(wallet.privateKeyEncrypted);

      const transactionRef = Transaction.generateReference();

      const txHash = await blockchainHelpers.sendTransaction(
        privateKey,
        toAddress,
        amount,
        currency
      );

      const transaction = new Transaction({
        userId,
        type: 'crypto_transfer',
        amount: parseFloat(amount),
        currency,
        status: 'completed',
        reference: transactionRef,
        fromAddress: wallet.publicKey,
        toAddress,
        blockchainHash: txHash,
        description: `${currency} transfer to ${toAddress}`
      });

      await transaction.save();

      await wallet.updateBalance(parseFloat(currentBalance) - parseFloat(amount));

      res.json({
        status: 'success',
        message: 'Transfer completed successfully',
        data: {
          transaction: transaction.toJSON(),
          txHash
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Transfer failed',
        error: error.message
      });
    }
  },

  swapMpesaToCrypto: async (req, res) => {
    try {
      const { amount, currency } = req.body;
      const userId = req.user._id;

      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return res.status(404).json({
          status: 'error',
          message: 'Wallet not found'
        });
      }

      const completedDeposits = await Transaction.find({
        userId,
        type: 'mpesa_deposit',
        status: 'completed',
        currency: 'KES',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      const totalDeposited = completedDeposits.reduce((sum, tx) => sum + tx.amount, 0);

      if (totalDeposited < amount) {
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient MPESA deposits for swap'
        });
      }

      const cryptoAmount = await blockchainHelpers.convertKesToCrypto(amount, currency);

      const transactionRef = Transaction.generateReference();

      const swapTransaction = new Transaction({
        userId,
        type: 'swap_mpesa_crypto',
        amount: cryptoAmount,
        currency,
        status: 'completed',
        reference: transactionRef,
        description: `Swap ${amount} KES to ${cryptoAmount} ${currency}`,
        metadata: {
          kesAmount: amount,
          cryptoAmount,
          exchangeRate: cryptoAmount / amount
        }
      });

      await swapTransaction.save();

      const newBalance = parseFloat(wallet.balance) + cryptoAmount;
      await wallet.updateBalance(newBalance);

      res.json({
        status: 'success',
        message: 'Swap completed successfully',
        data: {
          transaction: swapTransaction.toJSON(),
          swappedAmount: cryptoAmount,
          newBalance: wallet.balance
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Swap failed',
        error: error.message
      });
    }
  }
};

module.exports = walletController;
