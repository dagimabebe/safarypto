const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

describe('MPESA Integration', () => {
  let authToken;
  let user;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/safarypto_test');
    
    user = new User({
      email: 'mpesa@example.com',
      phone: '254712345678',
      password: 'Password123!',
      isVerified: true
    });
    await user.save();

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'mpesa@example.com',
        password: 'Password123!'
      });

    authToken = loginResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/v1/mpesa/stk-push', () => {
    it('should initiate STK push successfully', async () => {
      const stkData = {
        phone: '254712345678',
        amount: 100
      };

      const response = await request(app)
        .post('/api/v1/mpesa/stk-push')
        .set('Authorization', `Bearer ${authToken}`)
        .send(stkData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.transaction.reference).toBeDefined();
    });

    it('should fail with invalid phone number', async () => {
      const stkData = {
        phone: 'invalid-phone',
        amount: 100
      };

      const response = await request(app)
        .post('/api/v1/mpesa/stk-push')
        .set('Authorization', `Bearer ${authToken}`)
        .send(stkData)
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/mpesa/callback', () => {
    it('should handle successful callback', async () => {
      const callbackData = {
        Body: {
          stkCallback: {
            ResultCode: 0,
            CheckoutRequestID: 'ws_CO_050520231112345678',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 100 },
                { Name: 'MpesaReceiptNumber', Value: 'RE123456' },
                { Name: 'PhoneNumber', Value: 254712345678 }
              ]
            }
          }
        }
      };

      const transaction = new Transaction({
        userId: user._id,
        type: 'mpesa_deposit',
        amount: 100,
        currency: 'KES',
        status: 'pending',
        reference: 'TEST123',
        metadata: {
          checkoutRequestID: 'ws_CO_050520231112345678'
        }
      });
      await transaction.save();

      const response = await request(app)
        .post('/api/v1/mpesa/callback')
        .send(callbackData)
        .expect(200);

      expect(response.body.status).toBe('success');

      const updatedTransaction = await Transaction.findById(transaction._id);
      expect(updatedTransaction.status).toBe('completed');
    });
  });
});
