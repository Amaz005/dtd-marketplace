
describe("Swap", function() {
  it("Should buy token", async function() {
    // const Market = await ethers.getContractFactory("NFTMarket")
    // const market = await Market.deploy()
    // await market.deployed()
    // const marketAddress = market.address

    // const NFT = await ethers.getContractFactory("NFT")
    // const nft = await NFT.deploy(marketAddress)
    // await nft.deployed()
    // const nftContractAddress = nft.address

    // let listingPrice = await market.getListingPrice()
    // listingPrice = listingPrice.toString()
    // items = await market.getUserCreateItems()
    // items = await Promise.all(items.map(async i => {
    //   const tokenUri = await nft.tokenURI(i.tokenId)
    //   let item = {
    //     price: i.price.toString(),
    //     tokenId: i.tokenId.toString(),
    //     seller: i.seller,
    //     owner: i.owner,
    //     tokenUri
    //   }
    //   return item
    // }))
    // console.log('items: ', items)
    const DToken = await ethers.getContractFactory("DToken")
    const dToken = await DToken.deploy("1000000000000")
    await dToken.deployed()
    const Swap = await ethers.getContractFactory("Swap")
    const swap = await Swap.deploy(dToken.address)
    await swap.deployed()
    console.log("pass")
    await dToken.transfer(swap.address, '1000000000000')
    const amount = ethers.utils.parseUnits('1', 'wei')
    const buyToken = await swap.buyToken({value: amount})
    console.log('buyToken', buyToken)
    const [owner] = await ethers.getSigners();
    const ownerBalance = await dToken.balanceOf(owner.address)
    const balance = await ethers.utils.formatUnits(ownerBalance.toString(), 'wei')
    console.log("ownerBalance", balance)
    await dToken.approve(swap.address, '1000')
    const amount2 = ethers.utils.parseUnits('1', 'wei')
    const sellToken = await swap.sellToken(amount2)
    console.log('sellToken', sellToken)
  })
  // it("Should sell token", async function() {
  //   const DToken = await ethers.getContractFactory("DToken")
  //   const dToken = await DToken.deploy("1000000000000")
  //   await dToken.deployed()
  //   const Swap = await ethers.getContractFactory("Swap")
  //   const swap = await Swap.deploy(dToken.address)
  //   await swap.deployed()
 
  //   const amount2 = ethers.utils.parseUnits('1', 'wei')
  //   const sellToken = await swap.sellToken(amount2)
  //   console.log('sellToken', sellToken)
  // })
  // it("Should check balance", async function() {
  // })
  
})
