const { ethers, upgrades } = require("hardhat")
const fs = require('fs')
async function main() {
    //upgrades
    const VestingV2 = await ethers.getContractFactory("Vesting")
    const vestingV2 = await upgrades.upgradeProxy("0x3d175AF4F7167406389af09D26E94751702f16FF", VestingV2)
    await vestingV2.deployed();
    console.log("vesting proxy address: ", vestingV2.address)
    console.log("implementation address:", await hre.upgrades.erc1967.getImplementationAddress(vestingV2.address));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});