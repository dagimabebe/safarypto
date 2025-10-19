const User = require('../models/User');
const tokenUtils = require('../utils/tokenUtils');
const redisClient = require('../config/redis');

const authController = {
  register: async (req, res) => {
    try {
      const { email, phone, password } = req.body;

      const existingUser = await User.findOne({
        $or: [{ email }, { phone }]
      });

      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'User with this email or phone already exists'
        });
      }

      const user = new User({
        email,
        phone,
        password
      });

      await user.save();

      const { accessToken, refreshToken } = await tokenUtils.generateTokens(user);

      await user.addRefreshToken(refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Registration failed'
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          status: 'error',
          message: 'Account not verified. Please verify your phone number.'
        });
      }

      const { accessToken, refreshToken } = await tokenUtils.generateTokens(user);

      await user.addRefreshToken(refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      await redisClient.del(`login_attempts:${user.email}`);

      res.json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Login failed'
      });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { user, refreshToken: oldRefreshToken } = req;

      const { accessToken, refreshToken: newRefreshToken } = await tokenUtils.generateTokens(user);

      await user.removeRefreshToken(oldRefreshToken);
      await user.addRefreshToken(newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      await redisClient.setEx(`blacklist:${oldRefreshToken}`, 7 * 24 * 60 * 60, 'revoked');

      res.json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Token refresh failed'
      });
    }
  },

  logout: async (req, res) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const { refreshToken } = req.body;

      if (refreshToken) {
        await req.user.removeRefreshToken(refreshToken);
        await redisClient.setEx(`blacklist:${refreshToken}`, 7 * 24 * 60 * 60, 'revoked');
      }

      await redisClient.setEx(`blacklist:${token}`, 900, 'revoked');

      res.json({
        status: 'success',
        message: 'Logout successful'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Logout failed'
      });
    }
  },

  verifyPhone: async (req, res) => {
    try {
      const { code } = req.body;
      const user = req.user;

      if (user.mpesaCode === code) {
        user.isVerified = true;
        await user.save();

        res.json({
          status: 'success',
          message: 'Phone number verified successfully'
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: 'Invalid verification code'
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Phone verification failed'
      });
    }
  }
};

module.exports = authController;
