const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

const userController = {
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      const wallet = await Wallet.findOne({ userId: req.user._id });

      res.json({
        status: 'success',
        data: {
          user: user.toJSON(),
          wallet: wallet ? wallet.toJSON() : null
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch profile'
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { email, phone } = req.body;
      const userId = req.user._id;

      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: userId } },
          { $or: [{ email }, { phone }] }
        ]
      });

      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'Email or phone already in use'
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { email, phone },
        { new: true, runValidators: true }
      );

      res.json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
          user: updatedUser.toJSON()
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Profile update failed'
      });
    }
  },

  getTransactions: async (req, res) => {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10, type, status } = req.query;

      const filter = { userId };
      if (type) filter.type = type;
      if (status) filter.status = status;

      const transactions = await Transaction.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Transaction.countDocuments(filter);

      res.json({
        status: 'success',
        data: {
          transactions: transactions.map(tx => tx.toJSON()),
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch transactions'
      });
    }
  }
};

module.exports = userController;
