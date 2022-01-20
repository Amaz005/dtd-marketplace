const { ethers, upgrades } = require("hardhat");
const fs = require('fs');
const {vestingAddress} = require('../vestingConfig')
async function main() {
    //upgrades
    const VestingV2 = await ethers.getContractFactory("Vesting")
    const vestingV2 = await upgrades.upgradeProxy(vestingAddress, NFTMarketV2)
    
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});
