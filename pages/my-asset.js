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

export default function MyAsset() {
    let window;
   // @dev declare variable that will contain nft asset data
    const [nfts, setNfts] = useState([])
    const [loadingState, setLoadingState] = useState(false)
    const [provider, setProvider] = useState()

    useEffect(() => {
        loadNFTs()
    }, [])

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
        console.log("loadNFTs")
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        console.log("sender", signer.getAddress())
        const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
        const marketContract = new ethers.Contract(nftMarketAddress, Market.abi, signer)
        setProvider(connection)
        const data = await marketContract.getUserItems()
        console.log("pass1", data)
        const items = await Promise.all(data[0].map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.toString(), "ether")
            console.log("price: ",price)
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
            }
            return item
        }))
        console.log(items[0])
        setNfts(items)
        setLoadingState(true) 
        console.log("nfts",nfts)
    }

    if (loadingState && !nfts.length) {
        return (
        <h1 className="px-20 py-10 text-3xl">You didn&apos;t buy any asset yet</h1>
        )
    }  

    return (
        <div>
            <div className="p-4">
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
        </div>
    )
}