/** @type {import('next').NextConfig} */
require('dotenv').config();

module.exports = {
  env: {
    INFURA_API_KEY: process.env.INFURA_API_KEY,
    MNEMONIC: process.env.MNEMONIC,
    nftAddress: process.env.nftAddress,
    nftMarketAddress: process.env.nftMarketAddress,
    infuraId: process.env.infuraId,
    secret: process.env.secret
  },
  reactStrictMode: true,
  images: {
    domains: ['ipfs.infura.io'],
  },
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false,path: false };

    return config;
  },
}
