const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat")
const fs = require('fs');
const { BigNumber } = require("ethers");
require('@nomiclabs/hardhat-etherscan')

async function main() {
  //deploy

  const accounts = await hre.ethers.getSigners()
  console.log("account 0: ", accounts[0].address)
  
  const NFTMarket = await ethers.getContractFactory("NFTMarket")
  const nftMarket = await upgrades.deployProxy(NFTMarket, {kind: "uups"} )
  await nftMarket.deployed()
  console.log("nftMarket deployed to:", nftMarket.address)

  console.log("implementation address:", await hre.upgrades.erc1967.getImplementationAddress(nftMarket.address));

  const NFT = await ethers.getContractFactory("NFT")
  const nft = await NFT.deploy(nftMarket.address)
  await nft.deployed()
  console.log("nft deployed to:", nft.address)

  const DToken = await ethers.getContractFactory("DToken")
  const dtoken = await DToken.deploy("1000000000000")
  await dtoken.deployed()

  const Swap = await ethers.getContractFactory('Swap')
  const swap = await Swap.deploy(dtoken.address)
  await swap.deployed()

  const Verify = await ethers.getContractFactory('VerifyContract')
  const verify = await Verify.deploy()
  await verify.deployed()

  // await dtoken.transfer(swap.address, '1000000000000')

  const Vesting = await ethers.getContractFactory("Vesting")
  const vesting = await upgrades.deployProxy(Vesting, [accounts[0].address], {kind: "uups"})
  await vesting.deployed()

  console.log("tokenAddress: " ,dtoken.address)
  console.log("walletAddress: " ,swap.address)
  console.log("verifyAddress: ", verify.address)
  console.log("vestingAddress: ", vesting.address)

  let config = `
    export const nftMarketAddress = "${nftMarket.address}"
    export const nftAddress = "${nft.address}"
    export const tokenAddress = "${dtoken.address}"
    export const walletAddress = "${swap.address}"
    export const verifyAddress = "${verify.address}"
    export const vestingAddress = "${vesting.address}"
  `
  let data = JSON.stringify(config)
  fs.writeFileSync('config.js', JSON.parse(data))
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
