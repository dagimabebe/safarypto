const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class TokenUtils {
  generateAccessToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
      issuer: 'safarypto',
      subject: user._id.toString()
    });
  }

  generateRefreshToken(user) {
    const payload = {
      userId: user._id,
      tokenId: crypto.randomBytes(16).toString('hex')
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
      issuer: 'safarypto',
      subject: user._id.toString()
    });
  }

  async generateTokens(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken
    };
  }

  verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  }

  decodeToken(token) {
    return jwt.decode(token);
  }

  getTokenExpiry(token) {
    const decoded = this.decodeToken(token);
    return decoded ? new Date(decoded.exp * 1000) : null;
  }

  isTokenExpired(token) {
    const expiry = this.getTokenExpiry(token);
    return expiry ? expiry < new Date() : true;
  }

  generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateShortLivedToken(payload, expiresIn = '5m') {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn,
      issuer: 'safarypto'
    });
  }
}

module.exports = new TokenUtils();
