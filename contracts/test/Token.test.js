const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SafaryptoToken", function () {
  let token;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const SafaryptoToken = await ethers.getContractFactory("SafaryptoToken");
    token = await SafaryptoToken.deploy();
    await token.deployed();
  });

  it("Should have correct name and symbol", async function () {
    expect(await token.name()).to.equal("SafaryptoToken");
    expect(await token.symbol()).to.equal("SFT");
  });

  it("Should mint initial supply to owner", async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.utils.parseEther("10000000"));
  });

  it("Should allow authorized minter to mint tokens", async function () {
    await token.setAuthorizedMinter(owner.address, true);
    
    const mintAmount = ethers.utils.parseEther("1000");
    await token.mint(user1.address, mintAmount);
    
    const userBalance = await token.balanceOf(user1.address);
    expect(userBalance).to.equal(mintAmount);
  });

  it("Should not allow unauthorized minter to mint tokens", async function () {
    await expect(
      token.connect(user1).mint(user2.address, ethers.utils.parseEther("1000"))
    ).to.be.revertedWith("Not authorized minter");
  });

  it("Should allow users to burn their tokens", async function () {
    const burnAmount = ethers.utils.parseEther("100");
    await token.connect(owner).burn(burnAmount);
    
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.utils.parseEther("9999900"));
  });

  it("Should allow ETH swap for tokens", async function () {
    const ethAmount = ethers.utils.parseEther("0.1");
    const expectedTokens = ethAmount.mul(1000);
    
    await token.connect(user1).swapEthForTokens({ value: ethAmount });
    
    const userBalance = await token.balanceOf(user1.address);
    expect(userBalance).to.equal(expectedTokens);
  });

  it("Should enforce swap cooldown", async function () {
    const ethAmount = ethers.utils.parseEther("0.1");
    
    await token.connect(user1).swapEthForTokens({ value: ethAmount });
    
    await expect(
      token.connect(user1).swapEthForTokens({ value: ethAmount })
    ).to.be.revertedWith("Swap cooldown active");
  });
});
