//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DMarket {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _itemIds;
    CountersUpgradeable.Counter private _itemsSold;
    uint256 fee = 100;

    struct Item {
        uint256 id;
        uint256 price;
        string name;
        address owner;
        bool isSold;
        bool isPublished;
    }
    mapping(uint256 => Item) idToItem;
    event itemCreated (
        uint256 indexed itemId,
        uint256 price,
        string name,
        address owner,
        bool isSold,
        bool isPublished
    );

    event itemPurchased(
        uint256 indexed itemId,
        uint256 price,
        string name,
        address owner,
        bool isSold,
        bool isPublished
    );

    function createItem (string memory _name, uint256 _price) public {
        _itemIds.increment();
        // require(_name != "");
        uint256 id = _itemIds.current();
        idToItem[id] = Item(id, _price, _name, msg.sender, false, false);
        emit itemCreated(id, _price, _name , msg.sender, false, false);
    }

    function publicItem(uint256 id) public returns(bool){
        idToItem[id].isPublished = true;
        return true;
    }

    function buyItem(address tokenAddress,uint256 id, uint256 amount) public {
        Item memory item = idToItem[id];
        require(amount == item.price, "pls input amount equal to price");
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        item.owner = msg.sender;
        item.isSold = true;
    }

    // function getItemToSell() {
    //     uint256 itemId = _itemIds.current();
    //     uint256 soldItemId = _itemsSold.current();

    //     require()
    //     for (uint i = 0; i < )
    // }
}