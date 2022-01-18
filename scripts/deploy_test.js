const { ethers, upgrades } = require("hardhat");
require('@nomiclabs/hardhat-etherscan')

async function main() {
    [owner, user1, user2, user3, user4, user5, user6, user7, user8, user9] = await ethers.getSigners()
    const DToken = await ethers.getContractFactory("DToken")
    const dtoken = await DToken.deploy("1000000000000")
    await dtoken.deployed()

    const Vesting = await ethers.getContractFactory("Vesting")
    const vesting = await upgrades.deployProxy(Vesting, [owner.address], {kind: "uups"})
    await vesting.deployed()

    console.log("dtoken: ", dtoken.address)
    console.log("vesting: ", vesting.address)

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });