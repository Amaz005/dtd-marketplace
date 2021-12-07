import {ethers} from 'ethers'
import {useState, useEffect} from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'
import {
  nftAddress, nftMarketAddress
} from '../config'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
export default function Home() {
  // @dev declare variable that will contain nft asset data
  const [nfts, setNfts] = useState([])

  const [loadingState, setLoadingState] = useState(false)

  useEffect(() => {
    loadNFTs()
  }, [])

  // @dev load provider, connect to contract and get asset data
  async function loadNFTs() {
    console.log("loadNFTs")
    const provider = new ethers.providers.JsonRpcProvider("https://rinkeby.infura.io/v3/9ac2da124ced41e197c43b093c503302")
  
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftMarketAddress, Market.abi, provider)
    const data = await marketContract.getAllUnsoldItems()
    console.log("data", data)
    const items = await Promise.all( data.map(async (i) => {
      const tokenURI = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenURI)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let items = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return items
    }))
    setNfts(items)
    setTimeout(() =>{
      console.log("nfts", nfts)
    },3000)
    
    setLoadingState(true)
  }

  // @dev handle buying event from user,
  const buyNft = async (nft) => {
    console.log("buyNft", nft)
    const web3modal = new Web3Modal()
    const connection = await web3modal.connect()
    console.log(connection)
    const provider = new ethers.providers.Web3Provider(connection)

    const signer = provider.getSigner()
    console.log("nftMarketAddress: ",nftMarketAddress)
    const contract = new ethers.Contract(nftMarketAddress, Market.abi, signer)

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
    console.log("price after format: ", price)
    const transaction = await contract.saleMarketItem(nftAddress, nft.tokenId, {value: price})

    await transaction.wait()
    loadNFTs()
  }

  if (loadingState && !nfts.length) {
    return (
      <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
    )
  }  

  return (
    <div className="flex justify-center">
      <div className="px-4" styles={{maxWidth: '1600px'}}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft,i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <Image alt="Picture of the author" src={nft.image} layout="fill"/>
                <div className="p-4">
                  <p style={{ height: '30px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '20px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} ETH</p>
                  <button className="w-full bg-gray-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Buy</button>
                </div>
              </div>
            ))  
          }
          
        </div>  
      </div>
    </div>
  )
}
