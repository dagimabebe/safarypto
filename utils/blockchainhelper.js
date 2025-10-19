const Web3 = require('web3');
const blockchainConfig = require('../config/blockchain');

const tokenABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_spender", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_from", "type": "address"},
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  }
];

class BlockchainHelpers {
  constructor() {
    this.web3 = blockchainConfig.web3;
    this.tokenContract = new this.web3.eth.Contract(tokenABI, blockchainConfig.contractAddress);
  }

  async getTokenBalance(walletAddress) {
    try {
      const balance = await this.tokenContract.methods.balanceOf(walletAddress).call();
      const decimals = await this.tokenContract.methods.decimals().call();
      return balance / Math.pow(10, decimals);
    } catch (error) {
      throw new Error(`Token balance check failed: ${error.message}`);
    }
  }

  async transferTokens(privateKey, toAddress, amount) {
    try {
      const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
      const decimals = await this.tokenContract.methods.decimals().call();
      const value = this.web3.utils.toBN(amount).mul(this.web3.utils.toBN(10).pow(this.web3.utils.toBN(decimals)));

      const gasPrice = await this.web3.eth.getGasPrice();
      const gasEstimate = await this.tokenContract.methods.transfer(toAddress, value).estimateGas({
        from: account.address
      });

      const txObject = {
        from: account.address,
        to: blockchainConfig.contractAddress,
        data: this.tokenContract.methods.transfer(toAddress, value).encodeABI(),
        gas: gasEstimate,
        gasPrice: gasPrice
      };

      const signedTx = await account.signTransaction(txObject);
      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Token transfer failed: ${error.message}`);
    }
  }

  async approveSpender(privateKey, spenderAddress, amount) {
    try {
      const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
      const decimals = await this.tokenContract.methods.decimals().call();
      const value = this.web3.utils.toBN(amount).mul(this.web3.utils.toBN(10).pow(this.web3.utils.toBN(decimals)));

      const gasPrice = await this.web3.eth.getGasPrice();
      const gasEstimate = await this.tokenContract.methods.approve(spenderAddress, value).estimateGas({
        from: account.address
      });

      const txObject = {
        from: account.address,
        to: blockchainConfig.contractAddress,
        data: this.tokenContract.methods.approve(spenderAddress, value).encodeABI(),
        gas: gasEstimate,
        gasPrice: gasPrice
      };

      const signedTx = await account.signTransaction(txObject);
      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Token approval failed: ${error.message}`);
    }
  }

  async getTokenInfo() {
    try {
      const name = await this.tokenContract.methods.name().call();
      const symbol = await this.tokenContract.methods.symbol().call();
      const decimals = await this.tokenContract.methods.decimals().call();
      const totalSupply = await this.tokenContract.methods.totalSupply().call();

      return {
        name,
        symbol,
        decimals: parseInt(decimals),
        totalSupply: totalSupply / Math.pow(10, decimals)
      };
    } catch (error) {
      throw new Error(`Token info fetch failed: ${error.message}`);
    }
  }

  async sendTransaction(privateKey, toAddress, amount, currency = 'ETH') {
    try {
      const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
      const nonce = await this.web3.eth.getTransactionCount(account.address, 'pending');
      const gasPrice = await blockchainConfig.getGasPrice();

      let txObject;

      if (currency === 'ETH') {
        txObject = {
          from: account.address,
          to: toAddress,
          value: this.web3.utils.toWei(amount.toString(), 'ether'),
          gas: blockchainConfig.gasLimit,
          gasPrice: gasPrice,
          nonce: nonce
        };
      } else {
        return await this.transferTokens(privateKey, toAddress, amount);
      }

      const signedTx = await account.signTransaction(txObject);
      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  async convertKesToCrypto(kesAmount, currency) {
    const exchangeRates = {
      ETH: 0.000025,
      USDT: 0.0095,
      SFT: 0.01
    };

    const rate = exchangeRates[currency];
    if (!rate) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    return parseFloat((kesAmount * rate).toFixed(8));
  }

  async convertCryptoToKes(cryptoAmount, currency) {
    const exchangeRates = {
      ETH: 40000,
      USDT: 105,
      SFT: 100
    };

    const rate = exchangeRates[currency];
    if (!rate) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    return Math.floor(cryptoAmount * rate);
  }

  getERC20ABI() {
    return tokenABI;
  }

  validateTransactionHash(hash) {
    return /^0x([A-Fa-f0-9]{64})$/.test(hash);
  }

  async getTransactionReceipt(txHash) {
    try {
      return await this.web3.eth.getTransactionReceipt(txHash);
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }
}

module.exports = new BlockchainHelpers();
