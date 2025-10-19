const Web3 = require('web3');

class BlockchainConfig {
  constructor() {
    this.infuraKey = process.env.INFURA_API_KEY;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.providerURL = `https://mainnet.infura.io/v3/${this.infuraKey}`;
    this.web3 = new Web3(this.providerURL);
    
    this.gasLimit = 21000;
    this.gasPrice = this.web3.utils.toWei('20', 'gwei');
  }

  validateAddress(address) {
    return this.web3.utils.isAddress(address);
  }

  async getGasPrice() {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();
      return this.web3.utils.toBN(gasPrice).mul(this.web3.utils.toBN(120)).div(this.web3.utils.toBN(100));
    } catch (error) {
      return this.web3.utils.toWei('20', 'gwei');
    }
  }

  async getBalance(address) {
    try {
      if (!this.validateAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }
      
      const balance = await this.web3.eth.getBalance(address);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  createAccount() {
    try {
      const account = this.web3.eth.accounts.create();
      return {
        address: account.address,
        privateKey: account.privateKey
      };
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }
}

module.exports = new BlockchainConfig();
