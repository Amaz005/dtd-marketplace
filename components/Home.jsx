import Image from "next/image"
import { useEffect } from 'react'
import Countdown from 'react-countdown';
import noImage from '../public/no-image.jpg'

const Home = (props) => {
    const {connection, isloading, NFT, DToken, Market} = props;
    const [nfts, setNfts] = useState([])
    const [symbol, setSymbol] = useState("")
    const [loadingState, setLoadingState] = useState(false)
    const prices = []

    useEffect(() => {
        if(isloading) {
            loadNFTs()
        }
    }, [isloading])

    async function loadNFTs() {
        try {
            const userProvider = new ethers.providers.Web3Provider(connection)
            const userSigner = userProvider.getSigner()
            setConnection(connection)
            connection.on("accountsChanged", handleAccountsChanged)
            const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/")
            const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
            const dTokenContract = new ethers.Contract(tokenAddress, DToken.abi, provider)
            const marketContract = new ethers.Contract(nftMarketAddress, Market.abi, provider)
            setLoadingState(true)
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
                let showConfirm
                const currentAccount = await userSigner.getAddress()
                let price = ethers.utils.formatUnits(i.lowestPrice.toString(), 'wei')
                const highestPrice = ethers.utils.formatUnits(i.highestPrice.toString(), 'wei')
                const timestamp = ethers.utils.formatUnits(i.endTime.toString(), 'wei')
                const timeRemain = (timestamp* 1000) - Date.now()
        
                console.log(timeRemain < 0)
                price = parseInt(price)
                if ((i.seller == currentAccount && !i.isPublished) || (timeRemain < 0)) {
                    showBuyButton = false
                } else if (i.seller != currentAccount && i.isPublished ){
                    showBuyButton = true
                }
                if(i.payerAddress == currentAccount && timeRemain < 0) {
                    showConfirm = true
                } else {
                    showConfirm = false
                }
                let items = {
                    price,
                    itemId: i.itemId,
                    tokenId: i.tokenId,
                    seller: i.seller,
                    image: meta.data.image,
                    name: meta.data.name,
                    description: meta.data.description,
                    showBuyButton,
                    endTime: timeRemain,
                    highestPrice,
                    payerAddress: i.payerAddress,
                    showConfirm
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

    const confirm = async (nft) => {
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftMarketAddress, Market.abi, signer)
    try {
        const transaction = await contract.saleMarketItem(nftAddress, tokenAddress, nft.itemId)
        await transaction.wait()
    } catch(error) {
        if(error.data) {
        alert.error(error.data.message)
        } else {
        alert.error(error.message)
        }
        
    }
    }

    // @dev handle buying event from user,
    const buyNft = async (nft, i) => {
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(nftMarketAddress, Market.abi, signer)
        contract.on('bidMarketItem',handleEventOccured)
        console.log(prices[i])
        const price = ethers.utils.parseUnits(prices[i].toString(), 'wei')
        try {
            const transaction = await contract.bid(price, nft.itemId, tokenAddress )
            await transaction.wait()
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
            <div className="flex item-center justify-center font-bold w-full">There is nothing to load</div>
            </>
        )
    }

    const renderer = ({days,hours, minutes, seconds, completed }) => {
        if (!completed) {
            return <span>{days}:{hours}:{minutes}:{seconds}</span>;
        } else {
            return null
        }
    };

    const onchangeValue = (e, i) => {
        prices[i] = e.target.value
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
                                    loadNFTs()
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
                        <div className="p-4 bg-black" style={{display: nft.showConfirm ? 'block': 'none'}}>
                        <button type="button" className="w-full bg-gray-500 text-white font-bold py-2 px-12 rounded" onClick={() => confirm(nft)}>Confirm</button>
                        </div>
                    </div>
                    ))  
                }
                
                </div>  
            </div>
        </div>
    )
}

export default Home