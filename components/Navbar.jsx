import Link from 'next/link'
import logo from '../public/duck-logo.svg'
import Image from 'next/image'
import DToken from '../artifacts/contracts/DToken.sol/DToken.json'
import {tokenAddress, nftMarketAddress, walletAddress} from '../config'
import {useEffect, useState} from 'react'
import { ethers } from 'ethers'
import { useAlert } from 'react-alert'
import Vesting from '../artifacts/contracts/Vesting.sol/Vesting.json'

const Navbar = ({isLoading,provider,web3Provider}) => {
    const [token, setToken] = useState(0)
    const alert = useAlert()

    useEffect(() => {
        if(provider) {
            provider.on("accountsChanged",handleAccountsChanged)
        }
    }, [provider])

    useEffect(() => {
        console.log('isloading: ' + isLoading)
        if(isLoading) {
            loadWeb3()
        }
    }, [isLoading])

    const handleAccountsChanged = () => {
        loadWeb3()
    }

    const callTest = async () => {
        console.log("web3Provider: ", web3Provider)
        if(!web3Provider) {
            return null
        }
        console.log("call test")
        const signer = web3Provider.getSigner()
        const owner = await signer.getAddress()
        const vestingContract = new ethers.Contract("0x0d302e592ce1255C4Dbe74D577810c04dfb5dD2a",Vesting.abi, signer)
        const tokenContract = new ethers.Contract("0xbF1dE3589aaCfe1857F467D502E1cD8D2c36A8a6", DToken.abi, signer)
        // tokenContract.transfer(owner, "10000000000")
        try {
            // const schemeName = "scheme 1"
            let durationTime = Date.now() + 1000000
            durationTime = ethers.utils.parseUnits(durationTime.toString(),"wei")
    
            const timeClaim = 3
            console.log("owner: ", owner)
            const schemeCreate = await vestingContract
                .newSchemeInformation(
                    durationTime, 
                    timeClaim, 
                    "0xbF1dE3589aaCfe1857F467D502E1cD8D2c36A8a6"
                )
            let dataTx = await schemeCreate.wait()
            let result = dataTx.events[0]?.args
    
            console.log('success: ')
            console.log(dataTx)
        } catch(e) {
            console.log(e)
        }
    }

    const handleApprove = async () => {
        if(!web3Provider) {
            return null
        }
        const signer = web3Provider.getSigner()
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
        console.log('web3provider: ', web3Provider)
        if(!web3Provider) {
            return null
        }
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
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-gray-400 hover:text-white hover:underline mr-4">
                        Swap token
                    </a>
                </Link>
                <Link href="/sign-message">
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-gray-400 hover:text-white hover:underline mr-4">
                        Sign message
                    </a>
                </Link>
                <Link href="/create-scheme">
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-gray-400 hover:text-white hover:underline ">
                        Create scheme
                    </a>
                </Link>
                </div>
                <div>
                    <span className="inline-block text-sm px-4 py-2 leading-none text-white  mt-4 lg:mt-0">Wallet: {token} DTK</span>
                    <a href="#" className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-gray-800 hover:bg-white mt-4 lg:mt-0" onClick={callTest}>Approve</a>
                </div>
            </div>
        
        </nav>
    )
}
export default Navbar;