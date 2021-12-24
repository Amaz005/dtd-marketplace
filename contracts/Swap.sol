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
        address owner,
        address receiver,
        address token,
        uint256 amount,
        uint256 rate
    );

    event TokenToOwner (
        uint256 amount,
        address token,
        address owner
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

    function getTokenFromContract(uint amount) public onlyOwner {
        require(amount > 0, 'amount must greater than zero');
        token.transferFrom(address(this), owner(), amount);
        emit TokenToOwner(amount, address(token), owner()); 
    }

    function sellToken(uint256 amount, address _receiver) public payable{
        require(_receiver != address(0));
        require(amount > 0, "You need to sell at least some tokens");
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= amount, "Check the token allowance");
        token.transferFrom(msg.sender, _receiver, amount);
        emit TokenSell(msg.sender, _receiver, address(token), amount, rate);
    }

}