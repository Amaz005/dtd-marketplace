const { expect } = require("chai")
const chai = require("chai")
const { FakeContract, smock } = require('@defi-wonderland/smock')
const {makeRandomAddress} = require('../util/randomAddress')
chai.use(smock.matchers);

describe("My ERC20 and other contract", function () {
	let myERC20;
    let myFake;
	beforeEach(async () => {
        [owner, user1, user2, user3, user4, user5, user6, user7, user8, user9] = await ethers.getSigners()
		const MyERC20 = await ethers.getContractFactory("MyERC20");
		myERC20 = await MyERC20.deploy();
		await myERC20.deployed();
	})
    it("should create fake with contract factory",async () => {
        
		const myOtherContract = await ethers.getContractFactory("MyOtherContract")
		myFake = await smock.fake(myOtherContract)
        expect(myFake).not.to.be.undefined
    })
    it("should create fake with contract name",async () => {
        const myFake = await smock.fake('MyOtherContract');
        expect(myFake).not.to.be.undefined
    })
    it("should return specified value", async () => {
        myFake.getValues.returns(111)
        const value = await myFake.getValues()
        expect(value).to.equal(111)
    })
    it("should return random address", async () => {
        console.log(makeRandomAddress())
    })
    it("should call mintUpTo",async () => {
        
    })
})