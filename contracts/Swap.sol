//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Swap is Ownable {
    uint256 private rate = 1000;
    IERC20 private token;

    event TokensPurchased (
        address account,
        address token,
        uint256 amount,
        uint256 rate
    );

    event TokenSell (
        address account,
        address token,
        uint256 amount,
        uint256 rate
    );

    constructor (address _tokenAddress) {
        token = IERC20(_tokenAddress);
    }

    function buyToken() public payable{
        require(msg.value > 0, "value must greater than zero");
          // Calculate the number of tokens to buy
        uint tokenAmount = msg.value * rate;
        // Require that Swap has enough tokens
        
        require(token.balanceOf(address(this)) >= tokenAmount);

        // Transfer tokens to the user
        token.transfer(msg.sender, tokenAmount);

        // Emit an event
        emit TokensPurchased(msg.sender, address(token), tokenAmount, rate);
    }

    // function sellToken(uint256 amount) public payable{
    //     require(amount > 0, "You need to sell at least some tokens");
    //     uint256 allowance = token.allowance(msg.sender, address(this));
    //     require(allowance >= amount, "Check the token allowance");
    //     token.transferFrom(msg.sender, address(this), amount);
    //     emit TokenSell(msg.sender, address(token), amount, rate);
    // }

}