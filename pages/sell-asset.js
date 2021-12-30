import {ethers} from "ethers"
import {useState, useEffect} from "react"
import axios from "axios"
import {
    nftAddress, nftMarketAddress,tokenAddress
} from "../config"
import NFT from "../artifacts/contracts/NFT.sol/NFT.json"
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json"
import DToken from '../artifacts/contracts/DToken.sol/DToken.json'
import Web3Modal from "web3modal"
import Image from "next/image"
import noImage from '../public/no-image.jpg'
import Loading from '../components/LoadingScreen'
import Navbar from '../components/Navbar.jsx'
import Modal from '../components/Modal'

export default function SellAsset() {
   // @dev declare variable that will contain nft asset data
    const [nfts, setNfts] = useState([])
    const [sold, setSold] = useState([])
    const [loadingState, setLoadingState] = useState(false)
    const [connection, setConnection] = useState()
    const [symbol, setSymbol] = useState("")
    const [loadToken, setLoadToken] = useState(false)
    const [show, isShow] = useState(false)
    const [value, setValue] = useState()
    const [index, setIndex] = useState()

    useEffect(() => {
        loadNFTs()
    },[])

    useEffect(() => {
        if(connection) {
            connection.on("accountsChanged",handleAccountsChanged)
        }
    }, [connection])

    const handleAccountsChanged = (accounts) => {
        loadNFTs()
    }

    const close = () => {
        isShow(false);
        loadNFTs();
    }

    // @dev load provider, connect to contract and get asset data
    const loadNFTs = async () =>{
        try {
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
            
            let totalSupply = await tokenContract.getTotalSupply()
            totalSupply = ethers.utils.formatUnits(totalSupply,'wei')
            const symbol = await dTokenContract.symbol.call()
            setLoadingState(false)
            setSymbol(symbol)
            let items = []
            for(let i = 0; i < totalSupply; i++) {
                
                const tokenId = ethers.utils.parseUnits((i+1).toString(),'wei')
                const tokenURI = await tokenContract.tokenURI(tokenId)
                if(tokenURI == "") {
                    continue
                }
                const meta = await axios.get(tokenURI)
                const isExist = await marketContract.checkExisting(tokenId)
                if(meta.data.image === undefined) {
                    meta.data.image = noImage.src
                }
                let showPublicButton
                let currentAccount = await signer.getAddress()
        
                if(meta.data.creater != currentAccount) {
                    continue
                } else {
                    if (!isExist) {
                        showPublicButton = true
                    } else if (isExist){
                        showPublicButton = false
                    }
                }
                
                let item = {
                    tokenId: tokenId,
                    seller: meta.data.creater,
                    image: meta.data.image,
                    name: meta.data.name,
                    description: meta.data.description,
                    showPublicButton: showPublicButton,
                }
                items.push(item)
            }
            const soldItems = items.filter(i => i.sold)
            setSold(soldItems)
            setNfts(items)
            setLoadingState(false)
        } catch (error) {
            console.log( "you have some problem with you json rpc provider, ",error)
        }
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
                <div>There is nothing to load</div>
            </>
        )
    }  

    // @dev public item to market
    const publicNft = async (values, index) => {
        console.log(index)
        setValue(values)
        setIndex(index)
        isShow(true)
    }

    return (
        <>
        <Navbar dToken={loadToken}/>
        <div>
            <div className="p-4">
                <h2 className="text-2xl py-2">Items Created</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {
                    nfts.map((nft, i) => (
                    <div key={i} className="border shadow rounded-xl overflow-hidden">
                        <Image alt="" width={100} height={52} layout="responsive" src={nft.image} />
                        <div className="p-4">
                            <p style={{ height: '30px' }} className="text-2xl font-semibold">{nft.name}</p>
                            <div style={{ height: '20px', overflow: 'hidden' }}>
                                <p className="text-gray-400">{nft.description}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-black">
                        <p className="text-2xl font-bold text-white" style={{display: nft.showPublicButton ? 'none': 'block'}}>Price - {nft.price} {symbol}</p>
                        <button className="w-full bg-gray-500 text-white font-bold py-2 px-12 rounded" style={{display: nft.showPublicButton ? 'block': 'none'}} onClick={() => publicNft(nft, i)}>Public</button>
                        </div>
                    </div>
                    ))
                }
                </div>
            </div>
            <div className="px-4">
                {
                    
                    Boolean(sold.length) && (
                    <div>
                        <h2 className="text-2xl py-2">Items sold</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            {
                            sold.map((nft, i) => (
                                <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <Image alt="Picture of the author" width={100} height={52} layout="responsive" src={nft.image} />
                                <div className="p-4 bg-black">
                                    <p className="text-2xl font-bold text-white">Price - {nft.price} {symbol}</p>
                                </div>
                                </div>
                            ))
                            }
                        </div>
                    </div>
                    )
                }
            </div>
        </div>
        <Modal show={show} handleClose={close} index={index} value={value} connection={connection}/>
        </>
    )
}