import {ethers} from "ethers"
import {useState, useEffect} from "react"
import axios from "axios"
import {
    nftAddress, nftMarketAddress
} from "../config"
import NFT from "../artifacts/contracts/NFT.sol/NFT.json"
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json"
import Web3Modal from "web3modal"
import Image from "next/image"

export default function SellAsset() {
   // @dev declare variable that will contain nft asset data
    const [nfts, setNfts] = useState([])
    const [sold, setSold] = useState([])
    const [loadingState, setLoadingState] = useState(false)
    const [provider, setProvider] = useState()

    useEffect(() => {
        loadNFTs();
    },[])

    useEffect(() => {
        if(provider) {
            provider.on("accountsChanged",handleAccountsChanged)
        }
    }, [provider])

    const handleAccountsChanged = (accounts) => {
        loadNFTs()
        console.log("accountsChanged", accounts)
    }

    

    // @dev load provider, connect to contract and get asset data
    const loadNFTs = async () =>{
        const web3Modal = new Web3Modal({
            network: "testnet",
            cacheProvider: true,
        })
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        setProvider(connection)
        // if(provider) {
        //     provider.on('accountsChanged',handleAccountsChanged)
        // }    
        const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
        const marketContract = new ethers.Contract(nftMarketAddress, Market.abi, signer)
        getData(marketContract, tokenContract); 
    }

    const getData = async (marketContract, tokenContract) => {
        const data = await marketContract.getUserCreateItems()
        console.log(data)
        const items = await Promise.all( data[0].map(async (i) => {
            const tokenURI = await tokenContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenURI)
            let price = ethers.utils.formatUnits(i.price.toString(), "ether")
            console.log("sold", i.isSold)
            let items = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                sold: i.isSold,
                image: meta.data.image,
            }
            return items
        }))
        const soldItems = items.filter(i => i.sold)
        console.log("soldItems: " + soldItems);
        setSold(soldItems)
        setNfts(items)
        setLoadingState(true)
    }

    if (loadingState && !nfts.length) {
        return (
        <h1 className="px-20 py-10 text-3xl">You didn&apos;t create any asset yet</h1>
        )
    }  

    return (
        <div>
            <div className="p-4">
                <h2 className="text-2xl py-2">Items Created</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {
                    nfts.map((nft, i) => (
                    <div key={i} className="border shadow rounded-xl overflow-hidden">
                        <Image alt="" width={100} height={52} layout="responsive" src={nft.image} />
                        <div className="p-4 bg-black">
                        <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
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
                                    <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
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
    )
}