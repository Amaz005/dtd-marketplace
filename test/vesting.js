const ERC20Artifact = "DToken"
const vestingArtifact = "Vesting"
const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");
require("hardhat-gas-reporter");
let vestingContract
let Erc20Contract
let owner, user1, user2, user3, user4, user5, user6, user7, user8, user9
let vestingInfor = {
    maxSupplyClaim: "1000",
    lastClaim: "1"
}
let currentTime = convertTime(5000)
const currentTime2 = convertTime(10000)
const currentTime3 = convertTime(15000)
const timeClaim = 3
const numerators = [33,33,34]
const denominators = [100,100,100]
const timeWithDraws = [currentTime,currentTime2,currentTime3]

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function countTime(num) {
    return num * 30 * 60 * 60
}

function convertTime(ms) {
    return parseInt((Date.now() + ms)/1000)
}

const scheme = {
    name: "scheme 1",
    vestTime: 2,
    cliffTime: 2,
    durationTime: 100,
    periodTime: 25,
    tokenAddress: Erc20Contract.address
}

describe("vesting", function() {
    before("Vesting -deploy contract",async function() {
        [owner, user1, user2, user3, user4, user5, user6, user7, user8, user9] = await ethers.getSigners()
        console.log("account 0: ", owner.address)
        const Vesting = await ethers.getContractFactory(vestingArtifact)
        const DToken = await ethers.getContractFactory(ERC20Artifact)
        const paramDeployERC20 = {
            totalSupply: "10000000000",
        }
        
        const dToken = await DToken.deploy(paramDeployERC20.totalSupply)
        Erc20Contract = await dToken.deployed()

        Erc20Contract.transfer(owner.address, "10000000000")

        const vesting = await upgrades.deployProxy(Vesting, [owner.address], {kind: "uups"})
        vestingContract = await vesting.deployed()
        Erc20Contract.approve(vestingContract.address, vestingInfor.maxSupplyClaim)
    })
    it("Should create scheme", async function() {
        // string memory name,
        // uint256 vestTime,
        // uint256 cliffTime,
        // uint256 durationTime,
        // uint256 periodTime,
        // address tokenAddress
        let isSuccess = false;
        const scheme = {
            name: "scheme 1",
            vestTime: 2,
            cliffTime: 2,
            durationTime: 100,
            periodTime: 25,
            tokenAddress: Erc20Contract.address
        }
        try {
            const transaction = await vestingContract.newSchemeInformation(
                                                        scheme.name, 
                                                        scheme.vestTime, 
                                                        scheme.cliffTime, 
                                                        scheme.durationTime,
                                                        scheme.periodTime,
                                                        scheme.tokenAddress
                                                    )
            const txData = await transaction.wait()
            const event = txData.events[0]
            console.log("return event "+ i + ": ",event)
            isSuccess =  true
        }catch (e) {
            console.log(e)
            isSuccess = false
        }
        expect(isSuccess).to.true
    })
    it("should create new Vesting information", async () => {
        
        // address wallet,
        // uint256 totalAmount,
        // uint256 amountDeposit,
        // uint256 totalClaimed,
        // uint256 schemeId,
        // uint256 startTime
        const vest = {
            wallet: user1.address,
            totalAmount: 1000,
            schemeId
        }

        const transaction = await vestingContract
                                    .newVestingInformation(
                                        user1.address, 
                                        vestingInfor.maxSupplyClaim, 
                                        vestingInfor.amountDeposit, 
                                        vestingInfor.schemeId, 
                                        numerators, 
                                        denominators, 
                                        timeWithDraws
                                    )
        const txData = await transaction.wait()
        for (let i = 0; i < txData.events.length; i++) {
            const event = txData.events[i]
            console.log("event infor",event)
        }
        // const event = txData.events[2].args
        // console.log("=======================================================")
        // console.log("txData: ", txData)
        // console.log("=======================================================")
        // console.log("vesting event: ",event)
        // console.log("=======================================================")
        // vestingInfor.vestingId = txData.events[2]?.args.vestingId
        // vestingInfor.lastClaim = txData.events[2]?.args.lastClaimId
        // vestingInfor.schemeId = txData.events[2]?.args.schemeId
    })
    // it("should claim token", async () => {
    //     //address _wallet, uint256 _vestingId, uint256 _schemeDetailId, uint256 _schemeId, bool isClaimAll
    //         await sleep(15000)
    //         console.log("=======================================================")
    //         console.log("vesting info:", vestingInfor)
    //         console.log("=======================================================")
    //         console.log("vesting info:", timeWithDraws)
    //         console.log("=======================================================")
    //         console.log("start time:", Date.now()/ 1000)
    //         console.log("=======================================================")
    //         const transaction = await vestingContract
    //                                 .claim(
    //                                     vestingInfor.wallet, 
    //                                     vestingInfor.vestingId, 
    //                                     vestingInfor.lastClaim, 
    //                                     vestingInfor.schemeId, 
    //                                     true)
    //         const txData = await transaction.wait()
    //         const event = txData.events[1].args
    //         console.log("=======================================================")
    //         console.log("event : ",event)
    //         console.log("=======================================================")
    //         expect(event.blockTime).to.above(ethers.BigNumber.from(timeWithDraws[2]))
    //         // console.log("transaction: ", transaction)
    // })
    
})