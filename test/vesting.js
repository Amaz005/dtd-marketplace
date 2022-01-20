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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function countTime(num) {
    return num * 30 * 60 * 60
}

function convertTime(ms) {
    return parseInt((Date.now() + ms)/1000)
}

let scheme = {
    schemeId: 0,
    name: "",
    vestTime: 0,
    cliffTime: 0,
    durationTime: 0,
    periodTime: 0,
    tokenAddress: ""
}

let vest = {
    wallet: "",
    totalAmount: 0,
    amountDeposit: 0,
    totalClaimed: 0,
    schemeId: 0,
    startTime: Date.now()
}

vestingIds = []

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
        scheme = {
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
            const event = txData.events[0].args
            console.log("return event "+ 0 + ": ",event)
            scheme.schemeId = event.schemeId
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
        vest = {
            wallet: user1.address,
            totalAmount: 1000,
            amountDeposit: 1000,
            totalClaimed: 100,
            schemeId: scheme.schemeId,
            startTime: Date.now()
        }
        console.log("vest: ",vest)
        const transaction = await vestingContract
                                    .newVestingInformation(
                                        vest.wallet, 
                                        vest.totalAmount, 
                                        vest.amountDeposit, 
                                        vest.totalClaimed,
                                        vest.schemeId, 
                                        vest.startTime
                                    )
        const txData = await transaction.wait()
        
        const event = txData.events[3].args
        vest.vestingId = event.vestingId
        vestingIds.push(event.vestingId)
    })
    it("should claim token", async () => {
        //address _wallet, uint256 _vestingId, uint256 _schemeDetailId, uint256 _schemeId, bool isClaimAll
        
            console.log("vest: ",vest)
            console.log("scheme: ",scheme)
            await sleep(15000)
            const transaction = await vestingContract
                                    .claim(
                                        vestingIds, 
                                        scheme.tokenAddress)
            const txData = await transaction.wait()
            for(let i = 0; i < txData.events.length; i++){
                const event = txData.events[i]
                console.log("claim event: ", event)
            }
            
            // console.log("transaction: ", transaction)
    })
    
})