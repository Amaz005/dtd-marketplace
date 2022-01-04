

const MyAsset = (props) => {
    const {connection} = props
    const loadNFTs = async () =>{
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        setConnection(connection)
        setLoadToken(true)
        const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
        const dTokenContract = new ethers.Contract(tokenAddress, DToken.abi, provider)
        const marketContract = new ethers.Contract(nftMarketAddress, Market.abi, provider)
        setLoadingState(true)
        
        const data = await marketContract.getUserItems({from: signer.getAddress()})
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
}