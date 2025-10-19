// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract SafaryptoToken is ERC20, ERC20Burnable, Pausable, Ownable, ERC20Permit {
    mapping(address => bool) public authorizedMinters;
    mapping(address => uint256) public lastSwapTime;
    mapping(address => uint256) public swapLimits;
    
    uint256 public constant MAX_SUPPLY = 1000000000 * 10 ** 18;
    uint256 public swapCooldown = 1 hours;
    uint256 public defaultSwapLimit = 1000 * 10 ** 18;
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event SwapExecuted(address indexed user, uint256 ethAmount, uint256 tokenAmount);
    event AuthorizedMinterUpdated(address indexed minter, bool authorized);

    constructor() ERC20("SafaryptoToken", "SFT") ERC20Permit("SafaryptoToken") {
        _mint(msg.sender, 10000000 * 10 ** decimals());
        authorizedMinters[msg.sender] = true;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyAuthorizedMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function burn(uint256 amount) public override {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    function swapEthForTokens() public payable whenNotPaused {
        require(msg.value > 0, "Must send ETH");
        require(block.timestamp >= lastSwapTime[msg.sender] + swapCooldown, "Swap cooldown active");
        
        uint256 tokenAmount = calculateTokenAmount(msg.value);
        require(tokenAmount <= getSwapLimit(msg.sender), "Exceeds swap limit");
        
        lastSwapTime[msg.sender] = block.timestamp;
        _mint(msg.sender, tokenAmount);
        
        emit SwapExecuted(msg.sender, msg.value, tokenAmount);
    }

    function setAuthorizedMinter(address minter, bool authorized) public onlyOwner {
        authorizedMinters[minter] = authorized;
        emit AuthorizedMinterUpdated(minter, authorized);
    }

    function setSwapCooldown(uint256 cooldown) public onlyOwner {
        swapCooldown = cooldown;
    }

    function setSwapLimit(address user, uint256 limit) public onlyOwner {
        swapLimits[user] = limit;
    }

    function calculateTokenAmount(uint256 ethAmount) public pure returns (uint256) {
        return ethAmount * 1000;
    }

    function getSwapLimit(address user) public view returns (uint256) {
        return swapLimits[user] > 0 ? swapLimits[user] : defaultSwapLimit;
    }

    function withdrawEth() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender], "Not authorized minter");
        _;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
