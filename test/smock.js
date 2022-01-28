const { expect } = require("chai")
const { FakeContract, smock } = require('@defi-wonderland/smock')

describe("My ERC20 and other contract", function () {
	let myERC20;

	beforeEach(async () => {
		const MyERC20 = await ethers.getContractFactory("MyERC20");
		myERC20 = await MyERC20.deploy();
		await myERC20.deployed();
	});

	it("call mint up in my ERC20", async function () {
        [owner, user1, user2, user3, user4, user5, user6, user7, user8, user9] = await ethers.getSigners()
		const myOtherContract = await ethers.getContractFactory("MyOtherContract")

		//@dev init with contract factory
		const myFake = await smock.fake(myOtherContract)
		
		// myOtherContract.connect(myFake.wallet)

		const defaultValue = await myFake.getValues.returns(42)
		console.log("defaultValue: ",defaultValue)

	});
});