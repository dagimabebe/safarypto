const crypto = require('crypto');

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default_32byte_encryption_key_here!', 'utf8');

class EncryptionUtils {
  encryptData(data) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return JSON.stringify({
        iv: iv.toString('hex'),
        data: encrypted,
        authTag: authTag.toString('hex')
      });
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  decryptData(encryptedData) {
    try {
      const encryptedObject = JSON.parse(encryptedData);
      const iv = Buffer.from(encryptedObject.iv, 'hex');
      const authTag = Buffer.from(encryptedObject.authTag, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedObject.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  generateRandomKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  validateEncryptedData(encryptedData) {
    try {
      const encryptedObject = JSON.parse(encryptedData);
      return !!(encryptedObject.iv && encryptedObject.data && encryptedObject.authTag);
    } catch (error) {
      return false;
    }
  }
}

module.exports = new EncryptionUtils();
