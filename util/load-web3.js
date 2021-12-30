import { ethers } from 'ethers'
import Web3Modal from 'Web3Modal'

// const providerOptions = {
//     metamask: {
//         display
//     }
// }

const initWeb3Modal = async () => {
    const web3modal = new Web3Modal({
        cacheProvider: false,
        disableInjectedProvider: false
    })
    return web3modal
}
export default initWeb3Modal