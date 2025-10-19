const axios = require('axios');
const mpesaConfig = require('../config/mpesa');

class MpesaHelpers {
  async validatePhoneNumber(phone) {
    const kenyanRegex = /^254[17][0-9]{8}$/;
    return kenyanRegex.test(phone);
  }

  formatPhoneNumber(phone) {
    let formatted = phone.toString().trim();
    
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }
    
    if (!formatted.startsWith('254')) {
      formatted = '254' + formatted;
    }
    
    return formatted;
  }

  async queryTransactionStatus(checkoutRequestID) {
    try {
      const authToken = await mpesaConfig.getAuthToken();
      const timestamp = mpesaConfig.generateTimestamp();
      const password = mpesaConfig.generatePassword();

      const requestData = {
        BusinessShortCode: mpesaConfig.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      };

      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Transaction query failed: ${error.message}`);
    }
  }

  calculateMpesaCharges(amount) {
    if (amount <= 1000) return 0;
    if (amount <= 50000) return 27.5;
    if (amount <= 100000) return 52.5;
    if (amount <= 150000) return 72.5;
    throw new Error('Amount exceeds MPESA limit');
  }

  validateAmount(amount) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1 || numAmount > 150000) {
      throw new Error('Amount must be between 1 and 150,000 KES');
    }
    return Math.floor(numAmount);
  }

  generateTransactionDescription(type, metadata = {}) {
    const descriptions = {
      deposit: `MPESA Deposit - ${metadata.phone || ''}`,
      withdrawal: `MPESA Withdrawal - ${metadata.phone || ''}`,
      transfer: `Transfer to ${metadata.recipient || ''}`,
      payment: `Payment for ${metadata.service || 'services'}`
    };
    
    return descriptions[type] || 'MPESA Transaction';
  }
}

module.exports = new MpesaHelpers();
