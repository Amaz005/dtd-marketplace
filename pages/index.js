import {ethers} from 'ethers'
import {useState, useEffect} from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'
import {
  nftAddress, nftMarketAddress,
  tokenAddress
} from '../config'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import DToken from '../artifacts/contracts/DToken.sol/DToken.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'
import Image from "next/image"
import Loading from '../components/LoadingScreen'
import ConnectScreen from '../components/ConnectScreen'
import noImage from '../public/no-image.jpg'
import Navbar from '../components/Navbar.jsx'
import { useAlert } from 'react-alert'
import Countdown, {isCompleted, formatTimeDelta } from 'react-countdown';
import web3 from 'web3'

const Completionist = () => <span>You are good to go!</span>;
export default function Home() {
  // @dev declare variable that will contain nft asset data
  const [nfts, setNfts] = useState([])
  const [symbol, setSymbol] = useState("")
  const [loadingState, setLoadingState] = useState(false)
  const [loadToken, setLoadToken] = useState(false)
  const [connection, setConnection] = useState()
  const alert = useAlert()
  const prices = []
  

  useEffect(() => {
    loadNFTs()
  }, [])

  useEffect(() => {
      if(connection) {
        connection.on("accountsChanged",handleAccountsChanged)
      }

  }, [connection])

  const handleEventOccured = () => {
    console.log('event')
  }

  const handleAccountsChanged = (accounts) => {
    loadNFTs()
    console.log("accountsChanged", accounts)
  }

  // @dev load provider, connect to contract and get asset data
  async function loadNFTs() {
    
    try {
      const web3modal = new Web3Modal()
      const connection = await web3modal.connect()
      const userProvider = new ethers.providers.Web3Provider(connection)
      const userSigner = userProvider.getSigner()
      console.log("connect: ", connection)
      setConnection(connection)
      const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/")
      const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
      const dTokenContract = new ethers.Contract(tokenAddress, DToken.abi, provider)
      const marketContract = new ethers.Contract(nftMarketAddress, Market.abi, provider)
      setLoadingState(true)
      // marketContract.on('bidMarketItem', handleEventOccured)
      let totalSupply = await tokenContract.getTotalSupply()
      totalSupply = ethers.utils.formatUnits(totalSupply,'wei')
      const symbol = await dTokenContract.symbol.call()
      setLoadingState(false)
      setSymbol(symbol)

      const data = await marketContract.getAllUnsoldItems()
      
      setLoadToken(true);
      
      if(data.length > 0) {
        const items = await Promise.all( data.map(async (i) => {
          const tokenURI = await tokenContract.tokenURI(i.tokenId)
          const meta = await axios.get(tokenURI)
          if(meta.data.image === undefined) {
            meta.data.image = noImage.src
          }
          let showBuyButton
          let currentAccount = await userSigner.getAddress()
          let price = ethers.utils.formatUnits(i.lowestPrice.toString(), 'wei')
          const highestPrice = ethers.utils.formatUnits(i.highestPrice.toString(), 'wei')
          let timestamp = ethers.utils.formatUnits(i.endTime.toString(), 'wei')
          let timeRemain = (timestamp* 1000) - Date.now()
          console.log(timeRemain)
          price = parseInt(price)
          if (i.seller == currentAccount && !i.isPublished) {
            showBuyButton = false
          } else if (i.seller != currentAccount && i.isPublished){
            showBuyButton = true
          }
          let items = {
            price,
            itemId: i.itemId,
            tokenId: i.tokenId,
            seller: i.seller,
            image: meta.data.image,
            name: meta.data.name,
            description: meta.data.description,
            showBuyButton: showBuyButton,
            endTime: timeRemain,
            highestPrice,
            payerAddress: i.payerAddress
          }
          return items
        }))
        setNfts(items)
      }
      
    } catch (error) {
      console.log( "you have some problem: ",error)
      return (
        <div>Something went wrong</div>
      )
    }
  }

  const onchangeValue = (e, i) => {
    console.log("run success")
    prices[i] = e.target.value
    console.log('value: ',prices[i])

  }

  // @dev handle buying event from user,
  const buyNft = async (nft, i) => {
    console.log("buyNFT")
    if(!connection) {
      return (
        <div>
          <ConnectScreen />
        </div>
      )
    }
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftMarketAddress, Market.abi, signer)
    console.log(prices[i])
    const price = ethers.utils.parseUnits(prices[i].toString(), 'wei')
    try {
      const transaction = await contract.bid(price, nft.itemId, tokenAddress )
      await transaction.wait()
      nft.showBuyButton = false
      loadNFTs()
    } catch (error) {
      alert.error(error.data.message)
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

  const renderer = ({days,hours, minutes, seconds, completed }) => {
    if (completed) {
      // Render a completed state
      return <Completionist />
    } else {
      // Render a countdown
      return <span>{days}:{hours}:{minutes}:{seconds}</span>;
    }
  };

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
                <form style={{display: nft.showBuyButton ? 'block': 'none'}} >
                  <div className="p-4 bg-black">
                    <p className="text-md break-words font-bold text-white ">Highest bidder: {nft.payerAddress}</p>
                    <p className="text-md break-words font-bold text-white ">Highest price: {nft.highestPrice} {symbol}</p>
                    <div className="mt-2 text-white text-center">
                      <Countdown 
                        date={Date.now() + nft.endTime} 
                        renderer={renderer} 
                        onComplete={async () => {
                          nft.showBuyButton = false; 
                          
                        }}
                      />
                    </div>
                    <div className="mt-2">
                      <input 
                          className="shadow appearance-none border rounded mb-2 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          type="number"
                          id="price"
                          name="price"
                          placeholder="price"
                          onChange={(e) => {onchangeValue(e, i)}}
                          value={prices[i]}
                      />
                  
                    </div>
                    <button type="button" className="w-full bg-gray-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft, i)}>Bid</button>
                  </div>
                </form>
              </div>
            ))  
          }
          
        </div>  
      </div>
    </div>
    </>
  )
}
