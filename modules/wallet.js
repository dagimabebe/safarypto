const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  publicKey: {
    type: String,
    required: true,
    unique: true
  },
  privateKeyEncrypted: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    enum: ['ETH', 'USDT'],
    default: 'ETH'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

walletSchema.index({ userId: 1 });
walletSchema.index({ publicKey: 1 });
walletSchema.index({ isActive: 1 });

walletSchema.methods.updateBalance = function(newBalance) {
  this.balance = newBalance;
  this.lastSynced = new Date();
  return this.save();
};

walletSchema.methods.toJSON = function() {
  const walletObject = this.toObject();
  delete walletObject.privateKeyEncrypted;
  return walletObject;
};

module.exports = mongoose.model('Wallet', walletSchema);
