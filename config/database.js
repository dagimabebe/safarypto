const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safarypto';

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let isConnected = false;
let retryCount = 0;
const maxRetries = 5;

async function connectWithRetry() {
  try {
    await mongoose.connect(MONGODB_URI, options);
    isConnected = true;
    console.log('MongoDB connected successfully');
    retryCount = 0;
  } catch (error) {
    retryCount++;
    console.error(`MongoDB connection failed (attempt ${retryCount}):`, error.message);
    
    if (retryCount < maxRetries) {
      console.log(`Retrying connection in 5 seconds...`);
      setTimeout(connectWithRetry, 5000);
    } else {
      console.error('Max retries reached. Exiting process.');
      process.exit(1);
    }
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  isConnected = false;
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  isConnected = false;
});

module.exports = {
  connectWithRetry,
  isConnected: () => isConnected
};
