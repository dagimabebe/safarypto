# Safarypto - Secure Authentication System with MPESA & Crypto Integration

## 🚀 Overview

Safarypto is a production-ready, enterprise-grade authentication system that seamlessly integrates MPESA mobile payments with blockchain cryptocurrency operations. Built with Node.js, MongoDB, Redis, and Docker, it provides a secure, scalable foundation for financial applications.

## 🏗️ Architecture

```
safarypto/
├── config/                 # Configuration files
├── controllers/           # Business logic
├── middleware/           # Security & validation
├── models/              # Database schemas
├── routes/              # API endpoints
├── tests/               # Test suites
├── utils/               # Helper functions
└── root files           # Docker, package.json, etc.
```

## 📋 Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+
- Docker & Docker Compose

## 🛠️ Quick Start

### Development
```bash
# Clone and setup
git clone <repository>
cd safarypto
cp .env.example .env

# Start with Docker
docker-compose up --build

# Or run locally
npm install
npm start
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## ⚙️ Environment Configuration

Create `.env` file:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/safarypto
REDIS_URL=redis://redis:6379
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

## 🗄️ Database Schemas

### User Model
```javascript
{
  email: String (unique, required),
  phone: String (unique, required),
  password: String (hashed, required),
  mpesaCode: String,
  walletAddress: String,
  role: ['user', 'admin'],
  isVerified: Boolean,
  refreshTokens: Array
}
```

### Transaction Model
```javascript
{
  userId: ObjectId (ref: User),
  type: ['mpesa_deposit', 'crypto_transfer', 'swap_mpesa_crypto'],
  amount: Number,
  currency: ['KES', 'ETH', 'USDT'],
  status: ['pending', 'completed', 'failed'],
  reference: String (unique),
  blockchainHash: String,
  metadata: Object
}
```

### Wallet Model
```javascript
{
  userId: ObjectId (ref: User, unique),
  publicKey: String (unique),
  privateKeyEncrypted: String (AES-256),
  balance: Number,
  currency: ['ETH', 'USDT']
}
```

## 🔐 Authentication Flow

### Registration
1. User provides email, phone, password
2. Password validated (8+ chars, uppercase, lowercase, number, symbol)
3. bcrypt hashing with salt rounds: 12
4. JWT access token (15min) and refresh token (7days) issued
5. Refresh tokens stored in Redis with rotation

### Security Features
- Rate limiting: 5 login attempts/15min per IP
- JWT token blacklisting
- Input sanitization and validation
- Helmet.js security headers
- CORS configured for production
- XSS and SQL injection protection

## 📱 MPESA Integration

### STK Push Flow
1. User initiates payment with phone and amount
2. System generates unique transaction reference
3. MPESA STK Push sent to user's phone
4. User enters PIN to authorize
5. MPESA sends callback with transaction status
6. System updates transaction and user records

### Endpoints
- `POST /api/v1/mpesa/stk-push` - Initiate payment
- `POST /api/v1/mpesa/callback` - Handle MPESA callbacks
- `POST /api/v1/mpesa/b2c` - Send money to users (admin only)
- `GET /api/v1/mpesa/transaction-status/:id` - Check status

## ₿ Blockchain Operations

### Wallet Management
- Ethereum wallet generation using Web3
- Private key encryption with AES-256
- Balance checking for ETH and ERC20 tokens
- Transaction signing and broadcasting
- Gas optimization

### Crypto Operations
- `POST /api/v1/wallet/create` - Generate new wallet
- `GET /api/v1/wallet/balance` - Check balance
- `POST /api/v1/wallet/transfer` - Send crypto
- `POST /api/v1/wallet/swap-mpesa` - Convert MPESA to crypto

## 🚦 API Endpoints

### Authentication
```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh-token
POST /api/v1/auth/logout
POST /api/v1/auth/verify-phone
```

### User Management
```http
GET /api/v1/users/profile
PUT /api/v1/users/profile
GET /api/v1/users/transactions
```

### Rate Limits
- General: 100 requests/15min
- Auth: 5 requests/15min
- MPESA: 3 requests/1min
- Wallet: 10 requests/30sec
- Sensitive: 5 requests/1hour

## 🐳 Docker Deployment

### Development
```yaml
version: '3.8'
services:
  app: node.js application
  mongodb: database
  redis: session store
```

### Production
- Multi-stage builds
- Health checks
- Volume persistence
- Environment-specific configs

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:auth
npm run test:mpesa
npm run test:wallet

# Test with coverage
npm run test:coverage
```

### Test Coverage
- Authentication flows
- MPESA integration
- Blockchain operations
- Error handling
- Security validation

## 🔒 Security Implementation

### Encryption Standards
- bcrypt: 12 salt rounds
- JWT: 256-bit secrets
- AES-256-GCM for private keys
- SHA-256 for data hashing

### Protection Layers
1. **Input Validation**: Express-validator on all endpoints
2. **Rate Limiting**: Redis-based per-endpoint limits
3. **XSS Prevention**: Input sanitization
4. **SQL Injection**: Mongoose parameterization
5. **Session Security**: JWT + Redis blacklisting
6. **Headers Security**: Helmet.js configuration

## 📊 Error Handling

### Structured Responses
```javascript
{
  status: 'success' | 'error',
  message: 'Human readable message',
  data: {}, // Optional success data
  errors: [] // Optional validation errors
}
```

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 409: Conflict
- 429: Rate limit exceeded
- 500: Internal server error

## 🚨 Emergency Procedures

### Database Connection Loss
- Automatic retry with exponential backoff
- Circuit breaker pattern
- Graceful degradation

### MPESA API Failure
- Transaction status polling fallback
- Manual reconciliation endpoints
- Alert system for failed transactions

### Blockchain Network Issues
- Gas price optimization
- Transaction queuing
- Nonce management

## 📈 Monitoring & Health Checks

### Health Endpoint
```http
GET /health
```
Response:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2023-11-05T10:30:00.000Z",
  "environment": "production"
}
```

### Logging
- Structured JSON logging
- Error tracking
- Performance metrics
- Audit trails for financial operations

## 🔄 MPESA to Crypto Swap

### Conversion Process
1. User deposits KES via MPESA
2. System verifies transaction completion
3. Real-time exchange rate calculation
4. Equivalent crypto amount credited to wallet
5. Transaction recorded with audit trail

### Exchange Rates
- Dynamic rate calculation
- Market-based pricing
- Transparent fee structure

## 🤝 API Integration Examples

### User Registration
```javascript
const response = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    phone: '254712345678',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!'
  })
});
```

### MPESA Payment
```javascript
const response = await fetch('/api/v1/mpesa/stk-push', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <access_token>'
  },
  body: JSON.stringify({
    phone: '254712345678',
    amount: 1000
  })
});
```

## 🛡️ Compliance & Best Practices

### Data Protection
- GDPR-compliant data handling
- PII encryption at rest
- Secure key management
- Regular security audits

### Financial Compliance
- Transaction logging for audit
- Anti-fraud measures
- Suspicious activity monitoring
- Regulatory reporting capabilities

## 🚀 Production Deployment

### Infrastructure Requirements
- Load balancer configuration
- Database replication
- Redis clustering
- Backup strategies
- Disaster recovery

### Performance Optimization
- Database indexing
- Query optimization
- Caching strategies
- Connection pooling

## 🆘 Troubleshooting

### Common Issues
1. **MongoDB connection failures**: Check network and credentials
2. **Redis timeouts**: Verify memory settings and connections
3. **MPESA API errors**: Validate business shortcode and passkey
4. **Blockchain transaction failures**: Check gas prices and nonce

### Log Analysis
- Application logs in JSON format
- Database query performance
- API response times
- Error rate monitoring

## 📞 Support

For technical support:
1. Check application logs
2. Verify environment configuration
3. Review API documentation
4. Contact me

## 📄 License

MIT - All rights reserved.

---

**Safarypto** - Building the future of secure financial authentication systems. **for educational purposes only**
