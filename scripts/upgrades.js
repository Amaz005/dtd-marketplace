const { ethers, upgrades } = require("hardhat");
const fs = require('fs');
async function main() {
    //upgrades
    const NFTMarketV2 = await ethers.getContractFactory("NFTMarket")
    const nftMarketV2 = await upgrades.upgradeProxy("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", NFTMarketV2)

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});
