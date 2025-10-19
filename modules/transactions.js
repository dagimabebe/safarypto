const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['mpesa_deposit', 'crypto_transfer', 'crypto_receive', 'swap_mpesa_crypto'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['KES', 'ETH', 'USDT'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  mpesaReference: {
    type: String,
    sparse: true
  },
  blockchainHash: {
    type: String,
    sparse: true
  },
  fromAddress: {
    type: String,
    sparse: true
  },
  toAddress: {
    type: String,
    sparse: true
  },
  description: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ mpesaReference: 1 });
transactionSchema.index({ blockchainHash: 1 });
transactionSchema.index({ status: 1 });

transactionSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

transactionSchema.statics.generateReference = function() {
  return `TX${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

module.exports = mongoose.model('Transaction', transactionSchema);
