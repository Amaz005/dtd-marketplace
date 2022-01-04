import Link from 'next/link'
import logo from '../public/duck-logo.svg'
import Image from 'next/image'
import DToken from '../artifacts/contracts/DToken.sol/DToken.json'
import {tokenAddress, nftMarketAddress, walletAddress} from '../config'
import {useEffect, useState} from 'react'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import { useAlert } from 'react-alert'
import Modal from '../components/Modal'

const simulateSlowNetworkRequest = () =>
    new Promise(resolve => setTimeout(resolve, 500));


const Navbar = ({dToken}) => {
    const [token, setToken] = useState(0)
    const [connection, setConnection] = useState()
    const alert = useAlert()
    useEffect(() => {
        let isCancelled = false;
    
        simulateSlowNetworkRequest().then(() => {
            if (!isCancelled) {
                loadWeb3()
            }
            if(connection) {
                connection.on("accountsChanged",handleAccountsChanged)
            }
        });

        return () => {
            isCancelled = true;
        };
    }, [dToken,connection]);

    // useEffect(() => {
    //     if(connection) {
    //         connection.on("accountsChanged",handleAccountsChanged)
    //     }
    // }, [connection])

    const handleAccountsChanged = () => {
        loadWeb3()
    }

    const handleApprove = async () => {
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        const tokenContract = new ethers.Contract(tokenAddress, DToken.abi, signer);
        const dToken = ethers.utils.parseUnits(token.toString(), 'wei')
        console.log('dtoken: ',dToken)
        const account = signer.getAddress()
        const allowanceMarket = await tokenContract.allowance(account, nftMarketAddress)
        const allowanceSwap = await tokenContract.allowance(account, walletAddress)
        let transactionMarket;
        let transactionSwap;

        if(allowanceMarket.eq(ethers.BigNumber.from(0))){
            transactionMarket = await tokenContract.approve(nftMarketAddress, dToken)
        } else if(allowanceMarket.lt(dToken)) {
            const incrementNumber = dToken.sub(allowanceMarket)
            transactionMarket = await tokenContract.increaseAllowance(nftMarketAddress, incrementNumber)
        } else if (allowanceMarket.eq(dToken)) {

            alert.info("You already have approved")
        }
        if(allowanceSwap.eq(ethers.BigNumber.from(0))) {
            transactionSwap = await tokenContract.approve(walletAddress, dToken)
        } else if (allowanceSwap.lt(dToken)) {
            const incrementNumber = dToken.sub(allowanceMarket)
            transactionMarket = await tokenContract.increaseAllowance(walletAddress, incrementNumber)
        }else if (allowanceSwap.eq(dToken)) {
            alert.info("You already have approved")
        }
        if(transactionMarket)
            await transactionMarket.wait()
        if(transactionSwap)
            await transactionSwap.wait()
        console.log('allowanceMarket: ', allowanceMarket)
        console.log('allowanceSwap: ', allowanceSwap)
    }

    const loadWeb3 = async () => {
        console.log('load')
        const web3modal = new Web3Modal()
        const connection = await web3modal.connect()
        if(!connection) {
            return
        }
        setConnection(connection)
        const log = localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER")
        if(log == "injected") { 
            console.log("not connect")
        }
        const web3Provider = new ethers.providers.Web3Provider(connection)
        const signer = web3Provider.getSigner()
        const tokenContract = new ethers.Contract(tokenAddress, DToken.abi, web3Provider);
        try {
            const data = await tokenContract.balanceOf(signer.getAddress())
            setToken(ethers.utils.formatUnits(data, 'wei'))
        } catch (error) {
            alert.error(error.message)
        }
        
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
                    <span className="inline-block text-sm px-4 py-2 leading-none text-white  mt-4 lg:mt-0">Wallet: {token} DTK</span>
                    <a href="#" className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-gray-800 hover:bg-white mt-4 lg:mt-0" onClick={handleApprove}>Approve</a>
                </div>
            </div>
        
        </nav>
    )
}
export default Navbar;