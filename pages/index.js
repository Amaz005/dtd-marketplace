import {ethers} from 'ethers'
import {useState, useEffect} from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'
import {
  nftAddress, nftMarketAddress,
  tokenAddress, SwapAddress
} from '../config'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import DToken from '../artifacts/contracts/DToken.sol/DToken.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import Image from "next/image"
import Loading from '../components/LoadingScreen'
import ConnectScreen from '../components/ConnectScreen'
import noImage from '../public/no-image.jpg'
export default function Home() {
  // @dev declare variable that will contain nft asset data
  const [nfts, setNfts] = useState([])
  const [symbol, setSymbol] = useState("")
  const [loadingState, setLoadingState] = useState(false)
  
  useEffect(() => {
    loadNFTs()
  }, [])

  // @dev load provider, connect to contract and get asset data
  async function loadNFTs() {
    try {
      const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/")
      const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
      const dTokenContract = new ethers.Contract(tokenAddress, DToken.abi, provider)
      const marketContract = new ethers.Contract(nftMarketAddress, Market.abi, provider)
      console.log("dTokenContract: ", dTokenContract)
      setLoadingState(true)
      
      const data = await marketContract.getAllUnsoldItems()
      const symbol = await dTokenContract.symbol.call()
      console.log('symbol', symbol)
      setLoadingState(false)
      setSymbol(symbol)
      const items = await Promise.all( data.map(async (i) => {
        const tokenURI = await tokenContract.tokenURI(i.tokenId)
        const meta = await axios.get(tokenURI)
        let price = ethers.utils.formatUnits(i.price.toString(), 'wei')
        if(meta.data.image === undefined) {
          meta.data.image = noImage.src
        }
        console.log("itemId: ", i.itemId.toNumber())
        let items = {
          price,
          itemId: i.itemId.toNumber(),
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
    } catch (error) {
      console.log( "you have some problem with you json rpc provider, ",error)
      return (
        <div>Something went wrong</div>
      )
    }
  }

  // @dev handle buying event from user,
  const buyNft = async (nft) => {
    console.log("buyNFT")
    const web3modal = new Web3Modal()
    const connection = await web3modal.connect()
    if(!connection) {
      return (
        <div>
          <ConnectScreen />
        </div>
      )
    }
    const provider = new ethers.providers.Web3Provider(connection)

    const signer = provider.getSigner()
    const dTokenContract = new ethers.Contract(tokenAddress, DToken.abi, signer)
    const contract = new ethers.Contract(nftMarketAddress, Market.abi, signer)
    const price = ethers.utils.parseUnits(nft.price.toString(), 'wei')
    console.log("price: ", price)
    await dTokenContract.approve(nftMarketAddress, nft.price.toString())
    const transaction = await contract.saleMarketItem(nftAddress,tokenAddress, nft.itemId, price)
    await transaction.wait()
    loadNFTs()
  }

  if (loadingState && !nfts.length) {
    return (
      <Loading loading={loadingState} />
    )
  } else if (!loadingState && !nfts.length) {
    return (
      <div>There is nothing to load</div>
    )
  }

  return (
    
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
