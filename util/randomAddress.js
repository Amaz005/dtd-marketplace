const {getAddress} = require('ethers/lib/utils')
const {randomHex} = require('web3-utils')

const makeRandomAddress = () => {
    return getAddress(randomHex(20));
}

module.exports = {
    makeRandomAddress
}