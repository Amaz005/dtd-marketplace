const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat")
require('@nomiclabs/hardhat-etherscan')
const fs = require('fs');

async function main() {
    [owner, user1, user2, user3, user4, user5, user6, user7, user8, user9] = await ethers.getSigners()

    const Token = await ethers.getContractFactory("DToken")
    const dtoken = await Token.deploy("1000000000000")
    await dtoken.deployed()
    // const Vesting = await ethers.getContractFactory("Vesting")
    // const vesting = await upgrades.deployProxy(Vesting, [owner.address], {kind: "uups"})
    // await vesting.deployed()
    // console.log("vesting: ", vesting.address)
    // console.log("implementation address:", await hre.upgrades.erc1967.getImplementationAddress(vesting.address));
    let config = `
    export const tokenAddress = "${dtoken.address}"
  `
  let data = JSON.stringify(config)
  fs.writeFileSync('vestingConfig.js', JSON.parse(data))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });