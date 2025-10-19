const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

describe('Wallet Operations', () => {
  let authToken;
  let user;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/safarypto_test');
    
    user = new User({
      email: 'wallet@example.com',
      phone: '254712345678',
      password: 'Password123!',
      isVerified: true
    });
    await user.save();

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'wallet@example.com',
        password: 'Password123!'
      });

    authToken = loginResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/v1/wallet/create', () => {
    it('should create wallet successfully', async () => {
      const response = await request(app)
        .post('/api/v1/wallet/create')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.wallet.publicKey).toBeDefined();
    });

    it('should fail if wallet already exists', async () => {
      await request(app)
        .post('/api/v1/wallet/create')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);
    });
  });

  describe('GET /api/v1/wallet/balance', () => {
    it('should get wallet balance', async () => {
      const response = await request(app)
        .get('/api/v1/wallet/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.balance).toBeDefined();
    });
  });

  describe('POST /api/v1/wallet/swap-mpesa', () => {
    it('should swap MPESA to crypto', async () => {
      const swapData = {
        amount: 1000,
        currency: 'ETH'
      };

      const response = await request(app)
        .post('/api/v1/wallet/swap-mpesa')
        .set('Authorization', `Bearer ${authToken}`)
        .send(swapData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.swappedAmount).toBeDefined();
    });
  });
});
