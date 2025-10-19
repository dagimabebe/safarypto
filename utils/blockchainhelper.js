const Web3 = require('web3');
const blockchainConfig = require('../config/blockchain');

class BlockchainHelpers {
  constructor() {
    this.web3 = blockchainConfig.web3;
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
        const contract = new this.web3.eth.Contract(this.getERC20ABI(), blockchainConfig.contractAddress);
        
        const decimals = await contract.methods.decimals().call();
        const value = this.web3.utils.toBN(amount).mul(this.web3.utils.toBN(10).pow(this.web3.utils.toBN(decimals)));

        txObject = {
          from: account.address,
          to: blockchainConfig.contractAddress,
          data: contract.methods.transfer(toAddress, value).encodeABI(),
          gas: 100000,
          gasPrice: gasPrice,
          nonce: nonce
        };
      }

      const signedTx = await account.signTransaction(txObject);
      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

      return receipt.transactionHash;
    } catch (error) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  async getTokenBalance(walletAddress, tokenAddress = blockchainConfig.contractAddress) {
    try {
      const contract = new this.web3.eth.Contract(this.getERC20ABI(), tokenAddress);
      const decimals = await contract.methods.decimals().call();
      const balance = await contract.methods.balanceOf(walletAddress).call();
      
      return balance / Math.pow(10, decimals);
    } catch (error) {
      throw new Error(`Balance check failed: ${error.message}`);
    }
  }

  async convertKesToCrypto(kesAmount, currency) {
    const exchangeRates = {
      ETH: 0.000025,
      USDT: 0.0095
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
      USDT: 105
    };

    const rate = exchangeRates[currency];
    if (!rate) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    return Math.floor(cryptoAmount * rate);
  }

  getERC20ABI() {
    return [
      {
        constant: true,
        inputs: [],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        type: 'function'
      },
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        type: 'function'
      },
      {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function'
      },
      {
        constant: false,
        inputs: [
          { name: '_to', type: 'address' },
          { name: '_value', type: 'uint256' }
        ],
        name: 'transfer',
        outputs: [{ name: '', type: 'bool' }],
        type: 'function'
      }
    ];
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
