const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  console.log("Deploying SafaryptoToken...");
  const SafaryptoToken = await ethers.getContractFactory("SafaryptoToken");
  const token = await SafaryptoToken.deploy();
  await token.deployed();
  console.log("SafaryptoToken deployed to:", token.address);

  console.log("Deploying SafaryptoSwap...");
  const SafaryptoSwap = await ethers.getContractFactory("SafaryptoSwap");
  const swap = await SafaryptoSwap.deploy(token.address, deployer.address);
  await swap.deployed();
  console.log("SafaryptoSwap deployed to:", swap.address);

  console.log("Deploying SafaryptoVault...");
  const SafaryptoVault = await ethers.getContractFactory("SafaryptoVault");
  const vault = await SafaryptoVault.deploy(token.address);
  await vault.deployed();
  console.log("SafaryptoVault deployed to:", vault.address);

  console.log("Setting up authorized minter...");
  await token.setAuthorizedMinter(swap.address, true);
  console.log("Swap contract authorized as minter");

  console.log("Deployment completed!");
  console.log("Token:", token.address);
  console.log("Swap:", swap.address);
  console.log("Vault:", vault.address);

  return {
    token: token.address,
    swap: swap.address,
    vault: vault.address
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
