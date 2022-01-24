const { ethers, upgrades } = require("hardhat")
const fs = require('fs')
async function main() {
    //upgrades
    const VestingV2 = await ethers.getContractFactory("Vesting")
    const vestingV2 = await upgrades.upgradeProxy("0x3d175AF4F7167406389af09D26E94751702f16FF", VestingV2)
    
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});
