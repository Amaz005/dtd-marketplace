const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

async function main() {
    //upgrades
    const NFTMarketV2 = await ethers.getContractFactory("NFTMarket")
    const nftMarketV2 = await upgrades.upgradeProxy(nftMarketAddress, NFTMarketV2)
    
    const NFTV2 = await ethers.getContractFactory("NFT")
    const nftV2 = await upgrades.upgradeProxy(nftAddress, NFTV2, [nftMarketAddress])

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});
