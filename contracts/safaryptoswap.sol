// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SafaryptoSwap is ReentrancyGuard, Ownable, Pausable {
    IERC20 public token;
    
    struct SwapOrder {
        address user;
        uint256 mpesaAmount;
        uint256 tokenAmount;
        uint256 timestamp;
        bool executed;
        bool isBuy;
    }
    
    mapping(bytes32 => SwapOrder) public swapOrders;
    mapping(address => uint256) public dailySwaps;
    mapping(address => uint256) public lastSwapDate;
    
    uint256 public exchangeRate = 100;
    uint256 public dailyLimit = 100000 * 10 ** 18;
    uint256 public feePercentage = 1;
    address public feeWallet;
    
    event SwapOrderCreated(bytes32 orderId, address user, uint256 mpesaAmount, uint256 tokenAmount, bool isBuy);
    event SwapOrderExecuted(bytes32 orderId, uint256 tokenAmount, uint256 fee);
    event ExchangeRateUpdated(uint256 newRate);
    event DailyLimitUpdated(uint256 newLimit);
    event FeePercentageUpdated(uint256 newFee);

    constructor(address _token, address _feeWallet) {
        token = IERC20(_token);
        feeWallet = _feeWallet;
    }

    function createBuyOrder(bytes32 orderId, uint256 mpesaAmount) external onlyOwner whenNotPaused {
        uint256 tokenAmount = (mpesaAmount * exchangeRate) / 1e18;
        uint256 fee = (tokenAmount * feePercentage) / 100;
        uint256 netAmount = tokenAmount - fee;
        
        swapOrders[orderId] = SwapOrder({
            user: msg.sender,
            mpesaAmount: mpesaAmount,
            tokenAmount: netAmount,
            timestamp: block.timestamp,
            executed: false,
            isBuy: true
        });
        
        emit SwapOrderCreated(orderId, msg.sender, mpesaAmount, netAmount, true);
    }

    function createSellOrder(bytes32 orderId, uint256 tokenAmount) external whenNotPaused {
        require(token.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        uint256 mpesaAmount = (tokenAmount * 1e18) / exchangeRate;
        uint256 fee = (tokenAmount * feePercentage) / 100;
        uint256 netAmount = tokenAmount - fee;
        
        swapOrders[orderId] = SwapOrder({
            user: msg.sender,
            mpesaAmount: mpesaAmount,
            tokenAmount: netAmount,
            timestamp: block.timestamp,
            executed: false,
            isBuy: false
        });
        
        emit SwapOrderCreated(orderId, msg.sender, mpesaAmount, netAmount, false);
    }

    function executeBuyOrder(bytes32 orderId) external nonReentrant whenNotPaused {
        SwapOrder storage order = swapOrders[orderId];
        require(!order.executed, "Order already executed");
        require(order.isBuy, "Not a buy order");
        
        _checkDailyLimit(order.user, order.tokenAmount);
        
        uint256 fee = (order.tokenAmount * feePercentage) / 100;
        uint256 netAmount = order.tokenAmount - fee;
        
        require(token.transfer(order.user, netAmount), "Token transfer failed");
        if (fee > 0) {
            require(token.transfer(feeWallet, fee), "Fee transfer failed");
        }
        
        order.executed = true;
        _updateDailySwaps(order.user, order.tokenAmount);
        
        emit SwapOrderExecuted(orderId, netAmount, fee);
    }

    function executeSellOrder(bytes32 orderId) external nonReentrant whenNotPaused {
        SwapOrder storage order = swapOrders[orderId];
        require(!order.executed, "Order already executed");
        require(!order.isBuy, "Not a sell order");
        
        uint256 fee = (order.tokenAmount * feePercentage) / 100;
        uint256 netAmount = order.tokenAmount - fee;
        
        require(token.transferFrom(order.user, address(this), order.tokenAmount), "Token transfer failed");
        if (fee > 0) {
            require(token.transfer(feeWallet, fee), "Fee transfer failed");
        }
        
        order.executed = true;
        
        emit SwapOrderExecuted(orderId, netAmount, fee);
    }

    function setExchangeRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Invalid exchange rate");
        exchangeRate = newRate;
        emit ExchangeRateUpdated(newRate);
    }

    function setDailyLimit(uint256 newLimit) external onlyOwner {
        dailyLimit = newLimit;
        emit DailyLimitUpdated(newLimit);
    }

    function setFeePercentage(uint256 newFee) external onlyOwner {
        require(newFee <= 10, "Fee too high");
        feePercentage = newFee;
        emit FeePercentageUpdated(newFee);
    }

    function setFeeWallet(address newFeeWallet) external onlyOwner {
        require(newFeeWallet != address(0), "Invalid fee wallet");
        feeWallet = newFeeWallet;
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(token.transfer(owner(), amount), "Token withdrawal failed");
    }

    function _checkDailyLimit(address user, uint256 amount) internal {
        if (block.timestamp > lastSwapDate[user] + 1 days) {
            dailySwaps[user] = 0;
            lastSwapDate[user] = block.timestamp;
        }
        
        require(dailySwaps[user] + amount <= dailyLimit, "Daily limit exceeded");
    }

    function _updateDailySwaps(address user, uint256 amount) internal {
        dailySwaps[user] += amount;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function getOrder(bytes32 orderId) public view returns (SwapOrder memory) {
        return swapOrders[orderId];
    }

    function getDailySwapAmount(address user) public view returns (uint256) {
        if (block.timestamp > lastSwapDate[user] + 1 days) {
            return 0;
        }
        return dailySwaps[user];
    }
}
