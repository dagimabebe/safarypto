const axios = require('axios');
const crypto = require('crypto');

class MpesaConfig {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.businessShortCode = process.env.MPESA_BUSINESS_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.callbackURL = process.env.MPESA_CALLBACK_URL;
    this.authURL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    this.stkPushURL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
  }

  async getAuthToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(this.authURL, {
        headers: {
          Authorization: `Basic ${auth}`
        },
        timeout: 10000
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error(`MPESA auth failed: ${error.response?.data?.error_message || error.message}`);
    }
  }

  generateTimestamp() {
    return new Date().toISOString().replace(/[-:.]/g, '').slice(0, -4);
  }

  generatePassword() {
    const timestamp = this.generateTimestamp();
    const data = this.businessShortCode + this.passkey + timestamp;
    return Buffer.from(data).toString('base64');
  }

  validateCallback(data) {
    try {
      const response = JSON.parse(data);
      if (!response.Body || !response.Body.stkCallback) {
        return { valid: false, error: 'Invalid callback structure' };
      }
      return { valid: true, data: response };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON in callback' };
    }
  }
}

module.exports = new MpesaConfig();const axios = require('axios');
const crypto = require('crypto');

class MpesaConfig {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.businessShortCode = process.env.MPESA_BUSINESS_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.callbackURL = process.env.MPESA_CALLBACK_URL;
    this.authURL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    this.stkPushURL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
  }

  async getAuthToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(this.authURL, {
        headers: {
          Authorization: `Basic ${auth}`
        },
        timeout: 10000
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error(`MPESA auth failed: ${error.response?.data?.error_message || error.message}`);
    }
  }

  generateTimestamp() {
    return new Date().toISOString().replace(/[-:.]/g, '').slice(0, -4);
  }

  generatePassword() {
    const timestamp = this.generateTimestamp();
    const data = this.businessShortCode + this.passkey + timestamp;
    return Buffer.from(data).toString('base64');
  }

  validateCallback(data) {
    try {
      const response = JSON.parse(data);
      if (!response.Body || !response.Body.stkCallback) {
        return { valid: false, error: 'Invalid callback structure' };
      }
      return { valid: true, data: response };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON in callback' };
    }
  }
}

module.exports = new MpesaConfig();
