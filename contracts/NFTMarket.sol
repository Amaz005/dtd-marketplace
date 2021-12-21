//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Swap.sol";

contract NFTMarket is ReentrancyGuardUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _itemIds;
    CountersUpgradeable.Counter private _itemsSold;

    address payable owner;
    uint listingPrice;

    function initialize() initializer public{
        owner = payable(msg.sender);
        listingPrice = 0.025 ether;
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint tokenId;
        address payable seller;
        address payable owner;
        uint price;
        bool isSold;
        bool isPublished;
    }

    mapping (uint => MarketItem) private idToMarketItem;

    event MarketItemCreate(
        uint indexed itemId,
        address indexed nftContract,
        uint indexed tokenId,
        address seller,
        address owner,
        uint price,
        bool isSold,
        bool isPublished
    );

    function getListingPrice() public view returns(uint256) {
        return listingPrice;
    }

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listingPrice");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false,
            false
        );

        IERC721Upgradeable(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreate(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false,
            false
        );
    }

    function publicItem(uint256 id) public returns(bool){
        idToMarketItem[id].isPublished = true;
        return true;
    }

    function saleMarketItem(
        address nftContract,
        address tokenContract,
        uint itemId,
        uint amount
    ) public payable nonReentrant {
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;
        require(amount == price, "Pls submit the asking price for the item");
        // @dev value from seller to receiver
        idToMarketItem[itemId].seller.transfer(msg.value);
        // @dev token from receiver to buyer
        IERC721Upgradeable(nftContract).transferFrom(address(this), msg.sender, tokenId);
        IERC20(tokenContract).transferFrom(msg.sender, idToMarketItem[itemId].seller, amount);
        // @dev set owner equal to msg.sender
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].isSold = true;
        _itemsSold.increment();
        // @dev 
        payable(owner).transfer(listingPrice);
    }

    function getAllUnsoldItems() public view returns(MarketItem[] memory) {
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        // @dev get all items that are unsold
        for (uint i = 0; i< itemCount; i++) {
            if(idToMarketItem[i+1].owner == address(0) && idToMarketItem[i+1].seller != msg.sender) {
                items[currentIndex] = idToMarketItem[i+1];
                currentIndex += 1;
            }
        }
        return items;
    }

    function getUserItems() public view returns(MarketItem[] memory, address) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                items[currentIndex] = idToMarketItem[i + 1];
                currentIndex += 1;
            }
        }
        return (items,tx.origin);
    }

    function getUserCreateItems() public view returns(MarketItem[] memory, address) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                items[currentIndex] = idToMarketItem[i + 1];
                currentIndex += 1;
            }
        }
        return (items, tx.origin);
    }
}