// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SafaryptoVault is ReentrancyGuard, Ownable, Pausable {
    struct Deposit {
        uint256 amount;
        uint256 timestamp;
        uint256 unlockTime;
        bool withdrawn;
    }
    
    struct VaultSettings {
        uint256 minLockPeriod;
        uint256 maxLockPeriod;
        uint256 penaltyPercentage;
        uint256 rewardRate;
    }
    
    mapping(address => Deposit[]) public userDeposits;
    mapping(address => uint256) public totalDeposits;
    mapping(address => uint256) public totalRewards;
    
    IERC20 public token;
    VaultSettings public settings;
    
    event Deposited(address indexed user, uint256 amount, uint256 unlockTime, uint256 depositId);
    event Withdrawn(address indexed user, uint256 amount, uint256 reward, uint256 depositId);
    event EmergencyWithdrawn(address indexed user, uint256 amount, uint256 penalty, uint256 depositId);
    event SettingsUpdated(uint256 minLockPeriod, uint256 maxLockPeriod, uint256 penaltyPercentage, uint256 rewardRate);

    constructor(address _token) {
        token = IERC20(_token);
        settings = VaultSettings({
            minLockPeriod: 30 days,
            maxLockPeriod: 365 days,
            penaltyPercentage: 10,
            rewardRate: 5
        });
    }

    function deposit(uint256 amount, uint256 lockPeriod) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(lockPeriod >= settings.minLockPeriod && lockPeriod <= settings.maxLockPeriod, "Invalid lock period");
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        uint256 unlockTime = block.timestamp + lockPeriod;
        uint256 depositId = userDeposits[msg.sender].length;
        
        userDeposits[msg.sender].push(Deposit({
            amount: amount,
            timestamp: block.timestamp,
            unlockTime: unlockTime,
            withdrawn: false
        }));
        
        totalDeposits[msg.sender] += amount;
        
        emit Deposited(msg.sender, amount, unlockTime, depositId);
    }

    function withdraw(uint256 depositId) external nonReentrant {
        require(depositId < userDeposits[msg.sender].length, "Invalid deposit ID");
        
        Deposit storage userDeposit = userDeposits[msg.sender][depositId];
        require(!userDeposit.withdrawn, "Already withdrawn");
        require(block.timestamp >= userDeposit.unlockTime, "Lock period not ended");
        
        uint256 reward = calculateReward(userDeposit.amount, userDeposit.timestamp);
        uint256 totalAmount = userDeposit.amount + reward;
        
        userDeposit.withdrawn = true;
        totalDeposits[msg.sender] -= userDeposit.amount;
        totalRewards[msg.sender] += reward;
        
        require(token.transfer(msg.sender, totalAmount), "Token transfer failed");
        
        emit Withdrawn(msg.sender, userDeposit.amount, reward, depositId);
    }

    function emergencyWithdraw(uint256 depositId) external nonReentrant {
        require(depositId < userDeposits[msg.sender].length, "Invalid deposit ID");
        
        Deposit storage userDeposit = userDeposits[msg.sender][depositId];
        require(!userDeposit.withdrawn, "Already withdrawn");
        
        uint256 penalty = (userDeposit.amount * settings.penaltyPercentage) / 100;
        uint256 netAmount = userDeposit.amount - penalty;
        
        userDeposit.withdrawn = true;
        totalDeposits[msg.sender] -= userDeposit.amount;
        
        require(token.transfer(msg.sender, netAmount), "Token transfer failed");
        if (penalty > 0) {
            require(token.transfer(owner(), penalty), "Penalty transfer failed");
        }
        
        emit EmergencyWithdrawn(msg.sender, userDeposit.amount, penalty, depositId);
    }

    function calculateReward(uint256 amount, uint256 depositTime) public view returns (uint256) {
        uint256 timeStaked = block.timestamp - depositTime;
        uint256 reward = (amount * settings.rewardRate * timeStaked) / (100 * 365 days);
        return reward;
    }

    function updateSettings(
        uint256 minLockPeriod,
        uint256 maxLockPeriod,
        uint256 penaltyPercentage,
        uint256 rewardRate
    ) external onlyOwner {
        require(minLockPeriod <= maxLockPeriod, "Invalid lock periods");
        require(penaltyPercentage <= 50, "Penalty too high");
        require(rewardRate <= 20, "Reward rate too high");
        
        settings = VaultSettings({
            minLockPeriod: minLockPeriod,
            maxLockPeriod: maxLockPeriod,
            penaltyPercentage: penaltyPercentage,
            rewardRate: rewardRate
        });
        
        emit SettingsUpdated(minLockPeriod, maxLockPeriod, penaltyPercentage, rewardRate);
    }

    function getUserDeposits(address user) public view returns (Deposit[] memory) {
        return userDeposits[user];
    }

    function getUserDepositCount(address user) public view returns (uint256) {
        return userDeposits[user].length;
    }

    function getTotalValueLocked() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function withdrawExcessTokens(uint256 amount) external onlyOwner {
        uint256 vaultBalance = token.balanceOf(address(this));
        uint256 totalLocked = _calculateTotalLocked();
        uint256 excess = vaultBalance - totalLocked;
        
        require(amount <= excess, "Amount exceeds excess tokens");
        require(token.transfer(owner(), amount), "Token transfer failed");
    }

    function _calculateTotalLocked() internal view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
