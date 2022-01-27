require("@nomiclabs/hardhat-waffle")
require('@openzeppelin/hardhat-upgrades')
require('@nomiclabs/hardhat-etherscan')
require("@nomiclabs/hardhat-ganache")
require("hardhat-gas-reporter")
require('dotenv').config()

const fs = require('fs')
const privateKey = fs.readFileSync(".secret").toString().trim() || "01234567890123456789"
const infuraId = fs.readFileSync(".infuraid").toString().trim() || ""

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/9ac2da124ced41e197c43b093c503302",
      accounts: [privateKey]
    },
    bsctest: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      //https://data-seed-prebsc-1-s1.binance.org:8545/
      accounts: [privateKey],
      chainId: 97
    }
  },
  etherscan: {
    apiKey: process.env.bscAPIKEY
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["storageLayout"]
        }
      }
    }
  }
};

