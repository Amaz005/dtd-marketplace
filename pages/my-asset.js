import {ethers} from "ethers"
import {useState, useEffect} from "react"
import axios from "axios"
import {
    nftAddress, nftMarketAddress, tokenAddress
} from "../config"
import NFT from "../artifacts/contracts/NFT.sol/NFT.json"
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json"
import Web3Modal from "web3modal"
import Image from "next/image"
import Loading from '../components/LoadingScreen'
import Navbar from '../components/Navbar.jsx'
import noImage from '../public/no-image.jpg'
import DToken from '../artifacts/contracts/DToken.sol/DToken.json'

export default function MyAsset() {
   // @dev declare variable that will contain nft asset data
    const [nfts, setNfts] = useState([])
    const [loadingState, setLoadingState] = useState(false)
    const [connection, setConnection] = useState()
    const [symbol, setSymbol] = useState("")
    const [loadToken, setLoadToken] = useState(false)

    useEffect(() => {
        loadNFTs()
    }, [])

    useEffect(() => {
        if(connection) {
            connection.on("accountsChanged",handleAccountsChanged)
            connection.on('connect', handleConnect)
            connection.on('disconnect', handleDisconnect)
        }

    }, [connection])

    const handleAccountsChanged = (accounts) => {
        loadNFTs()
        console.log("accountsChanged", accounts)
    }

    const handleConnect = (info) => {
        console.log("connectInfo: ", info)
    }

    const handleDisconnect = () => {
        console.log()
    }

    // @dev load provider, connect to contract and get asset data
    const loadNFTs = async () =>{
            const web3modal = new Web3Modal()
            const connection = await web3modal.connect()
            const provider = new ethers.providers.Web3Provider(connection)
            const signer = provider.getSigner()
            setConnection(connection)
            setLoadToken(true)
            const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
            const dTokenContract = new ethers.Contract(tokenAddress, DToken.abi, provider)
            const marketContract = new ethers.Contract(nftMarketAddress, Market.abi, provider)
            setLoadingState(true)
            
            const data = await marketContract.getUserItems()
            const symbol = await dTokenContract.symbol.call()
            setLoadingState(false)
            setSymbol(symbol)
            console.log('data: ',data)
            console.log('signer',await signer.getAddress())
            const items = await Promise.all(data.map(async i => {
                const tokenUri = await tokenContract.tokenURI(i.tokenId)
                const meta = await axios.get(tokenUri)
                let price = ethers.utils.formatUnits(i.price.toString(), 'wei')
                let item = {
                    price,
                    itemId: i.itemId.toNumber(),
                    seller: i.seller,
                    owner: i.owner,
                    image: meta.data.image,
                    name: meta.data.name,
                    description: meta.data.description,
                }
                return item
            }))
        setNfts(items)
        
    }



    if (loadingState && !nfts.length) {
        return (
            <>
                <Navbar/>
                <Loading loading={loadingState} />
            </>
        )
    } else if (!loadingState && !nfts.length) {
        return (
            <>
                <Navbar/>
                <div className="flex item-center justify-center font-bold w-full">There is nothing to load</div>
            </>
        )
    }

    return (
        <>
        <Navbar dToken={loadToken}/>
        <div className="overflow-auto">
            <div className="px-4" styles={{maxWidth: '1600px'}}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {
                    nfts.map((nft,i) => (
                    <div key={i} className="border shadow rounded-xl overflow-hidden">
                        <Image alt="" width={100} height={52} layout="responsive" src={nft.image} />
                        <div className="p-4">
                        <p style={{ height: '30px' }} className="text-2xl font-semibold">{nft.name}</p>
                        <div style={{ height: '20px', overflow: 'hidden' }}>
                            <p className="text-gray-400">{nft.description}</p>
                        </div>
                        </div>
                        <div className="p-4 bg-black">
                            <p className="text-2xl mb-4 font-bold text-white">{nft.price} {symbol}</p>
                            <button className="w-full bg-gray-500 text-white font-bold py-2 px-12 rounded" style={{display: nft.showPublicButton ? 'block': 'none'}} onClick={() => publicNft(nft)}>Public</button>
                        </div>
                    </div>
                    ))
                }
                
                </div>
            </div>
        </div>
        </>
    )
}