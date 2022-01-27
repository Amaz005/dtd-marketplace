const { expect } = require("chai");
const { smoddit, smockit } = require("@eth-optimism/smock");
const { BigNumber } = require("ethers");

describe("My ERC20 and other contract", function () {
	let myERC20;

	beforeEach(async () => {
		const MyERC20 = await ethers.getContractFactory("MyERC20");
		myERC20 = await MyERC20.deploy();
		await myERC20.deployed();
	});

	it("call mint up in my ERC20", async function () {
        [owner, user1, user2, user3, user4, user5, user6, user7, user8, user9] = await ethers.getSigners()
		const MyMockContract = await smockit(myERC20);
		const MyOtherContract = await ethers.getContractFactory(
			"MyOtherContract"
		);
		const myOtherContract = await MyOtherContract.deploy(
			MyMockContract.address
		);

		const mockedMintAmount = 30;
		MyMockContract.smocked.mintUpTo
                    .will.return.with(mockedMintAmount);

		const to = owner.address;
		const amount = 100;

		await myOtherContract.myOtherFunction(to, amount);

		expect(MyMockContract.smocked.mintUpTo.calls.length)
                    .to.be.equal(1);
		expect(MyMockContract.smocked.mintUpTo.calls[0].to)
                    .to.be.equals(to);
		expect(
			MyMockContract.smocked.mintUpTo.calls[0].amount.toString()
		).to.equal(amount.toString());
	});
});