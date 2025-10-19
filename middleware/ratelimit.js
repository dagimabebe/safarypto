const rateLimit = require('express-rate-limit');
const redisClient = require('../config/redis');

const RedisStore = require('express-rate-limit').RedisStore;

const redisStore = new RedisStore({
  sendCommand: (...args) => redisClient.sendCommand(args),
});

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: 'error',
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore
  });
};

const rateLimitMiddleware = {
  general: createRateLimiter(900000, 100, 'Too many requests, please try again later'),
  
  auth: createRateLimiter(900000, 5, 'Too many authentication attempts, please try again in 15 minutes'),
  
  mpesa: createRateLimiter(60000, 3, 'Too many MPESA requests, please try again in 1 minute'),
  
  wallet: createRateLimiter(30000, 10, 'Too many wallet operations, please try again in 30 seconds'),
  
  sensitive: createRateLimiter(3600000, 5, 'Too many sensitive operations, please try again in 1 hour')
};

module.exports = rateLimitMiddleware;
