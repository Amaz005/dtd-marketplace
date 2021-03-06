const assetAddresses = {
    RINKEBY: {
        address: '0x6ede7f3c26975aad32a475e1021d8f6f39c89d82',
        chainId: 4,
        domain: 'https://ethereum-api-staging.rarible.org'
    },
    ROPSTEN: {
        address: '0xB0EA149212Eb707a1E5FC1D2d3fD318a8d94cf05',
        chainId: 3,
        domain: 'https://ethereum-api-dev.rarible.org'
    },
    MAINNET: {
        address: '0xF6793dA657495ffeFF9Ee6350824910Abc21356C',
        chainId: 1,
        domain: ''
    },
};

const getRaribleUrl = (network, contractId, tokenId) => {
    let raribleUrl = '';

    switch (network) {
        case 'RINKEBY':
            raribleUrl = `https://rinkey.rarible.com/token/${contractId}:${tokenId}?tab=details`;
            break;
        case 'ROPSTEN':
            raribleUrl = `https://ropsten.rarible.com/token/${contractId}:${tokenId}?tab=details`;
            break;
        case 'MAINNET':
            raribleUrl = `https://rarible.com/token/${contractId}:${tokenId}?tab=details`;
            break;
        default:
            break;
    }

    return raribleUrl;
};

module.exports = { assetAddresses, getRaribleUrl };