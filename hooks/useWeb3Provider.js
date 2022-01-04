import Web3Modal from "web3modal"
import WalletConnectProvider from "@walletconnect/web3-provider"
import Authereum from "authereum"
import { INFURA_ID, ALCHEMY_KEY } from "../constants"

const web3ModalSetup = () =>
    new Web3Modal({
        network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
        cacheProvider: true, // optional
        theme: "dark", // optional. Change to "dark" for a dark theme.
        providerOptions: {
            walletconnect: {
                package: WalletConnectProvider, // required
                options: {
                bridge: "https://polygon.bridge.walletconnect.org",
                infuraId: INFURA_ID,
                rpc: {
                    1: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
                    42: `https://kovan.infura.io/v3/${INFURA_ID}`,
                    100: "https://dai.poa.network", // xDai
                },
                },
            },
            authereum: {
                package: Authereum, // required
            },
        },
    }
)

export default web3ModalSetup;
