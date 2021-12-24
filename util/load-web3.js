import { ethers } from 'ethers'
import Web3Modal from 'Web3Modal'



export default function loadWeb3Provider() {
    const web3modal = new Web3Modal()
    const connection = await web3modal.connect()
    provider = new ethers.providers.Web3Provider(connection)
}