import Link from 'next/link'
import logo from '../public/duck-logo.svg'
import Image from 'next/image'
import Web3Modal from 'web3modal'
import DToken from '../artifacts/contracts/DToken.sol/DToken.json'
import {tokenAddress} from '../config'
import {useEffect, useState} from 'react'
import { ethers } from 'ethers'

const Navbar = (props) => {
    
    const [token, setToken] = useState("")

    useEffect(() => {
        loadWeb3()
    }, []) 

    useEffect(() => {
        loadWeb3()
    }, [token])

    const loadWeb3 = async () => {
        const web3modal = new Web3Modal()
        const log = localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER")
        if(log == "injected") { 
            console.log("not connect")
            return <div>disconnected</div>
        }
        const connection = await web3modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        const tokenContract = new ethers.Contract(tokenAddress, DToken.abi, provider);
        const data = await tokenContract.balanceOf(signer.getAddress())
        setToken(ethers.utils.formatUnits(data, 'wei'))
    }

    return (
        <nav className="flex items-center justify-between flex-wrap p-4 bg-gradient-to-r from-gray-700 to-gray-400 border-b shadow">
            <div className="flex items-center flex-shrink-0 text-white mr-6">
                <Image alt="" src={logo.src} height={25} width={25}/>
                <span className="ml-3"/>
                <span className="text-xl font-bold tracking-tight">DTD marketplace</span>
            </div>
            <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
                <div className="text-sm lg:flex-grow font-semibold">
                <Link href="/">
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-gray-400 hover:text-white hover:underline mr-4">
                        Home
                    </a>
                </Link>
                <Link href="/sell-asset">
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-gray-400 hover:text-white hover:underline mr-4">
                        Sell Asset
                    </a>
                </Link>
                <Link href="/my-asset">
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-gray-400 hover:text-white hover:underline mr-4">
                    Asset you have bought
                    </a>
                </Link>
                <Link href="/create-asset">
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-gray-400 hover:text-white hover:underline mr-4">
                        Create asset
                    </a>
                </Link>
                <Link href="/swap-token">
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-gray-400 hover:text-white hover:underline ">
                        Swap token
                    </a>
                </Link>
                </div>
                <div>
                    <a href="#" className="inline-block text-sm px-4 py-2 leading-none text-white  mt-4 lg:mt-0">Wallet: {token} DTK</a>
                    <a href="#" className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-gray-800 hover:bg-white mt-4 lg:mt-0">Account</a>
                </div>
            </div>
            
        </nav>
    )
}
export default Navbar;