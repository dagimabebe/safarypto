const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redisClient = require('../config/redis');

const authMiddleware = {
  verifyToken: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          status: 'error',
          message: 'Access token required'
        });
      }

      const token = authHeader.split(' ')[1];
      
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          status: 'error',
          message: 'Token revoked'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          status: 'error',
          message: 'Account not verified'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token expired'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token'
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Authentication failed'
      });
    }
  },

  verifyRefreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({
          status: 'error',
          message: 'Refresh token required'
        });
      }

      const isBlacklisted = await redisClient.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        return res.status(401).json({
          status: 'error',
          message: 'Refresh token revoked'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      const tokenExists = user.refreshTokens.some(t => t.token === refreshToken && t.expires > new Date());
      if (!tokenExists) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid refresh token'
        });
      }

      req.user = user;
      req.refreshToken = refreshToken;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Refresh token expired'
        });
      }
      
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }
  },

  requireRole: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        });
      }

      next();
    };
  }
};

module.exports = authMiddleware;
