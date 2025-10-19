const axios = require('axios');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mpesaConfig = require('../config/mpesa');
const encryptionUtils = require('../utils/encryption');

const mpesaController = {
  stkPush: async (req, res) => {
    try {
      const { phone, amount } = req.body;
      const userId = req.user._id;

      const authToken = await mpesaConfig.getAuthToken();
      const timestamp = mpesaConfig.generateTimestamp();
      const password = mpesaConfig.generatePassword();

      const transactionRef = Transaction.generateReference();

      const requestData = {
        BusinessShortCode: mpesaConfig.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.floor(amount),
        PartyA: phone,
        PartyB: mpesaConfig.businessShortCode,
        PhoneNumber: phone,
        CallBackURL: mpesaConfig.callbackURL,
        AccountReference: transactionRef,
        TransactionDesc: 'Safarypto Deposit'
      };

      const response = await axios.post(mpesaConfig.stkPushURL, requestData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data.ResponseCode === '0') {
        const transaction = new Transaction({
          userId,
          type: 'mpesa_deposit',
          amount,
          currency: 'KES',
          status: 'pending',
          reference: transactionRef,
          description: 'MPESA deposit initiated',
          metadata: {
            mpesaRequest: response.data,
            checkoutRequestID: response.data.CheckoutRequestID
          }
        });

        await transaction.save();

        res.json({
          status: 'success',
          message: 'Payment initiated successfully',
          data: {
            transaction: transaction.toJSON(),
            mpesaResponse: response.data
          }
        });
      } else {
        throw new Error(response.data.ResponseDescription || 'MPESA request failed');
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Payment initiation failed',
        error: error.response?.data || error.message
      });
    }
  },

  handleCallback: async (req, res) => {
    try {
      const callbackData = req.body;

      const validation = mpesaConfig.validateCallback(JSON.stringify(callbackData));
      if (!validation.valid) {
        return res.status(400).json({
          status: 'error',
          message: validation.error
        });
      }

      const stkCallback = callbackData.Body.stkCallback;
      const resultCode = stkCallback.ResultCode;
      const checkoutRequestID = stkCallback.CheckoutRequestID;

      const transaction = await Transaction.findOne({
        'metadata.checkoutRequestID': checkoutRequestID
      });

      if (!transaction) {
        return res.status(404).json({
          status: 'error',
          message: 'Transaction not found'
        });
      }

      if (resultCode === 0) {
        const callbackMetadata = stkCallback.CallbackMetadata;
        const metadataItems = callbackMetadata.Item.reduce((acc, item) => {
          acc[item.Name] = item.Value;
          return acc;
        }, {});

        transaction.status = 'completed';
        transaction.mpesaReference = metadataItems.MpesaReceiptNumber;
        transaction.metadata.mpesaCallback = metadataItems;
        transaction.completedAt = new Date();

        await transaction.save();

        const user = await User.findById(transaction.userId);
        if (user && !user.mpesaCode) {
          user.mpesaCode = metadataItems.PhoneNumber;
          await user.save();
        }
      } else {
        transaction.status = 'failed';
        transaction.metadata.error = stkCallback.ResultDesc;
        await transaction.save();
      }

      res.status(200).json({
        status: 'success',
        message: 'Callback processed successfully'
      });
    } catch (error) {
      console.error('Callback processing error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Callback processing failed'
      });
    }
  },

  b2cPayment: async (req, res) => {
    try {
      const { phone, amount, remarks } = req.body;

      const authToken = await mpesaConfig.getAuthToken();

      const requestData = {
        InitiatorName: 'testapi',
        SecurityCredential: encryptionUtils.encryptData('Safaricom999!*!'),
        CommandID: 'BusinessPayment',
        Amount: Math.floor(amount),
        PartyA: mpesaConfig.businessShortCode,
        PartyB: phone,
        Remarks: remarks || 'Safarypto Payout',
        QueueTimeOutURL: `${mpesaConfig.callbackURL}/b2c-timeout`,
        ResultURL: `${mpesaConfig.callbackURL}/b2c-result`,
        Occasion: 'Payout'
      };

      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.ResponseCode === '0') {
        res.json({
          status: 'success',
          message: 'B2C payment initiated successfully',
          data: response.data
        });
      } else {
        throw new Error(response.data.ResponseDescription);
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'B2C payment failed',
        error: error.response?.data || error.message
      });
    }
  },

  getTransactionStatus: async (req, res) => {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findOne({
        $or: [
          { _id: id },
          { reference: id },
          { mpesaReference: id }
        ]
      }).populate('userId', 'email phone');

      if (!transaction) {
        return res.status(404).json({
          status: 'error',
          message: 'Transaction not found'
        });
      }

      res.json({
        status: 'success',
        data: {
          transaction: transaction.toJSON()
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch transaction status'
      });
    }
  }
};

module.exports = mpesaController;
