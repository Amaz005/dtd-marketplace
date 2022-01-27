pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyERC20 is ERC20, Ownable {
    constructor() ERC20("MyERC20", "MYE") {}

    function mintUpTo(
        address to, uint256 amount
    ) external onlyOwner returns (uint256) {
        uint256 currentBalance = balanceOf(to);

        if (currentBalance >= amount) return 0;

        uint256 mintBalance = amount - currentBalance;
        _mint(to, mintBalance);

        return mintBalance;
    }
}