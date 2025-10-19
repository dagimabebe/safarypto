
# Safarypto - Secure Authentication System with MPESA & Crypto Integration

## Overview
Enterprise-grade authentication and financial platform integrating MPESA mobile payments with blockchain cryptocurrency operations. Built for production with security-first architecture.

##  Features

### Authentication & Security
- JWT-based authentication with refresh token rotation
- Role-based access control (User/Admin)
- Rate limiting and brute force protection
- Input validation and sanitization
- Password strength enforcement
- Redis session management

### MPESA Integration
- STK Push for payment initiation
- C2B transaction processing
- B2C payouts to users
- Real-time webhook callbacks
- Transaction status tracking

### Blockchain Operations
- Ethereum wallet generation and management
- ERC20 token operations (SafaryptoToken - SFT)
- Crypto transfers and balance checking
- MPESA to crypto swapping
- Private key encryption (AES-256)

### Smart Contracts
- **SafaryptoToken**: Custom ERC20 token with minting/burning
- **SafaryptoSwap**: MPESA to crypto exchange platform
- **SafaryptoVault**: Staking and rewards system

## 📋 Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+
- Docker & Docker Compose

## 🛠 Installation

### Quick Start with Docker
```bash
git clone <repository>
cd safarypto
docker-compose up --build
```

### Manual Installation
```bash
npm install

# Start services
docker-compose up mongodb redis -d

# Start application
npm start
```

## ⚙️ Configuration

### Environment Variables
Create `.env` file:
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/safarypto
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your_256bit_access_secret_here
JWT_REFRESH_SECRET=your_256bit_refresh_secret_here
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=your_mpesa_passkey
INFURA_API_KEY=your_infura_project_id
CONTRACT_ADDRESS=0xYourERC20ContractAddress
ENCRYPTION_KEY=your_32byte_encryption_key
```

### Smart Contract Deployment
```bash
npm run compile
npm run deploy:sepolia
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh-token` - Token refresh
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/verify-phone` - Phone verification

### MPESA Payments
- `POST /api/v1/mpesa/stk-push` - Initiate payment
- `POST /api/v1/mpesa/callback` - Handle callbacks (webhook)
- `POST /api/v1/mpesa/b2c` - Send money to user (Admin only)
- `GET /api/v1/mpesa/transaction-status/:id` - Check status

### Wallet Operations
- `POST /api/v1/wallet/create` - Generate blockchain wallet
- `GET /api/v1/wallet/balance` - Get crypto balance
- `POST /api/v1/wallet/transfer` - Send crypto
- `POST /api/v1/wallet/swap-mpesa` - Convert MPESA to crypto

### User Management
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update profile
- `GET /api/v1/users/transactions` - Transaction history

## 🔒 Security Features

- **Password Requirements**: 8+ chars, uppercase, lowercase, number, symbol
- **Rate Limiting**: 5 login attempts per 15min per IP
- **JWT Tokens**: 15min access, 7day refresh with rotation
- **Input Validation**: All endpoints sanitized and validated
- **CORS**: Configured for production domains
- **Helmet.js**: Security headers enabled
- **Private Key Encryption**: AES-256 encryption for wallet keys

## 🗄 Database Schemas

### User
- email (unique), phone (unique), password (hashed)
- mpesaCode, walletAddress, role[user,admin]
- isVerified, refreshTokens[]

### Transaction
- userId, type[mpesa_deposit, crypto_transfer, swap_mpesa_crypto]
- amount, currency[KES, ETH, USDT], status[pending,completed,failed]
- reference, mpesaReference, blockchainHash

### Wallet
- userId, publicKey, privateKeyEncrypted
- balance, currency[ETH, USDT], isActive

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:auth
npm run test:mpesa
npm run test:wallet
npm run test:contracts
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up --build
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Service Management
```bash
# Start only databases
docker-compose up mongodb redis

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## 📊 Health Checks

```bash
GET /health

Response:
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production"
}
```

## 🔄 MPESA Integration Flow

1. **STK Push Initiation**: User requests payment via `/stk-push`
2. **Payment Prompt**: User receives MPESA prompt on phone
3. **Callback Processing**: MPESA sends result to `/callback`
4. **Status Update**: Transaction status updated in database
5. **Wallet Credit**: Funds available for crypto swapping

## 💱 Crypto Operations

### Wallet Creation
- Generates new Ethereum wallet using Web3
- Encrypts private key with AES-256
- Stores public key in user profile

### Crypto Swapping
- Converts MPESA KES to cryptocurrency
- Uses real-time exchange rates
- Executes via smart contract interactions

### Token Transfers
- Supports ETH and ERC20 token transfers
- Gas optimization and price estimation
- Transaction status tracking

## 🏗 Architecture

```
Client → API Gateway → Authentication → Business Logic → Database
                              ↓
                      External Services
                    (MPESA API, Blockchain)
```

## 🚨 Error Handling

- Structured error responses with HTTP status codes
- Database transaction rollbacks on failures
- MPESA API failure fallbacks
- Blockchain transaction error recovery
- Graceful shutdown procedures

## 📈 Monitoring

- Structured logging for all operations
- Transaction status tracking
- Error reporting and alerting
- Performance metrics collection

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB service is running
   - Verify connection string in .env

2. **Redis Connection Issues**
   - Ensure Redis server is accessible
   - Check REDIS_URL environment variable

3. **MPESA API Errors**
   - Validate consumer key/secret
   - Check business shortcode configuration

4. **Blockchain Transactions Failing**
   - Verify Infura API key
   - Check gas price and limits
   - Confirm sufficient ETH for gas fees

### Logs
```bash
# Application logs
docker-compose logs app

# Database logs
docker-compose logs mongodb

# Cache logs
docker-compose logs redis
```

## 📄 License

MIT - All rights reserved.

## 🆘 Support

For technical support and issues:
1. Check application logs
2. Verify environment configuration
3. Review API documentation
4. Contact development team

---

**Safarypto** - Bridging Mobile Money and Blockchain Technology
```
