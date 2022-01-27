pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./MyERC20.sol";

contract MyOtherContract {
    MyERC20 private myERC20;

    constructor(MyERC20 myERC20_) {
        myERC20 = myERC20_;
    }

    function myOtherFunction(
        address to, uint256 amount
    ) external returns (bool) {
    // do stuff

        uint256 mintAmount = myERC20.mintUpTo(to, amount);
        console.log("The minted amount was", mintAmount);

    // do more stuff
    }
}