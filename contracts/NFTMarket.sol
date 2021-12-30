//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

contract NFTMarket is ReentrancyGuardUpgradeable,OwnableUpgradeable, UUPSUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _itemIds;
    CountersUpgradeable.Counter private _itemsSold;

    address payable feeWallet;
    uint public listingPrice;

    function initialize() initializer public{
        __Ownable_init();
        __UUPSUpgradeable_init();
        feeWallet = payable(msg.sender);
        listingPrice = 0.025 ether;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint tokenId;
        address payable seller;
        address payable owner;
        bool isSold;
        bool isPublished;
        uint256 priceStep;
        uint256 lowestPrice;
        uint256 endTime;
        uint256 highestPrice;
        address payable payerAddress;
    }

    // struct Regulation {
    //     uint256 regulationId;
    //     uint256 priceStep;
    //     uint256 lowestPrice;
    //     uint256 startDate;
    //     uint256 endTime;
    // }

    mapping (address => uint256) pendingReturn;

    // mapping(uint256 => Regulation) idToRegulation;
    mapping (uint => MarketItem) private idToMarketItem;

    event MarketItemCreate(
        uint indexed itemId,
        address indexed nftContract,
        uint indexed tokenId,
        address seller,
        address owner,
        bool isSold,
        bool isPublished,
        uint256 priceStep,
        uint256 lowestPrice,
        uint256 endTime
    );

    event bidMarketItem(
        uint256 indexed itemId,
        address payerAddress,
        uint256 highestPrice
    );

    event SaleMarketItem(
        uint indexed itemId,
        address indexed nftContract,
        uint indexed tokenId,
        address seller,
        address owner,
        uint price,
        bool isSold,
        bool isPublished
    );

    function setListingPrice(uint256 _listingPrice) public onlyOwner {
        listingPrice = _listingPrice;
    }

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 priceStep,
        uint256 endTime,
        uint256 lowestPrice
    ) public payable nonReentrant {
        require(priceStep > 0, "price step must be greater than 0");
        require(endTime > block.timestamp, "end time must be greater than now");
        require(lowestPrice > 0, "lowest price must be greater than 0");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            false,
            true,
            priceStep,
            lowestPrice,
            endTime,
            lowestPrice,
            payable(address(0))
        );

        IERC721Upgradeable(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreate(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            false,
            true,
            priceStep,
            lowestPrice,
            endTime
        );
    }

    function checkExisting(uint256 itemId) public view returns(bool) {
        if(idToMarketItem[itemId].itemId != uint256(0x0)) {
            return true;
        } else {
            return false;
        }
    }

    function bid(uint256 amount, uint256 itemId, address tokenAddress) public payable {
        
        require(idToMarketItem[itemId].itemId != uint256(0), "item not found");
        require(IERC20Upgradeable(tokenAddress).allowance(msg.sender, address(this)) >= amount, 'dont have enought Token');
        uint256 highestPrice = idToMarketItem[itemId].highestPrice;   
        uint256 priceStep = idToMarketItem[itemId].priceStep; 
        uint256 newPrice = SafeMathUpgradeable.add(highestPrice,priceStep);
        uint256 endTime = idToMarketItem[itemId].endTime;
        require(endTime > block.timestamp, "auction had already end");
        require(amount > newPrice, 'current price must greater than previous price plus price step');
        require(IERC20Upgradeable(tokenAddress).balanceOf(msg.sender) >= highestPrice);
        if(idToMarketItem[itemId].payerAddress != address(0)) {
            IERC20Upgradeable(tokenAddress).transfer(msg.sender, highestPrice);
        }
        IERC20Upgradeable(tokenAddress).transferFrom(payable(msg.sender), address(this), amount);
        idToMarketItem[itemId].highestPrice = amount;
        idToMarketItem[itemId].payerAddress = payable(msg.sender);
        emit bidMarketItem(itemId , msg.sender , newPrice);
    }

    function saleMarketItem(
        address nftContract,
        address tokenContract,
        uint itemId
    ) public payable nonReentrant {
        uint price = idToMarketItem[itemId].highestPrice;
        uint tokenId = idToMarketItem[itemId].tokenId;
        address payerAddress = idToMarketItem[itemId].payerAddress;
        // @dev token from receiver to buyer
        IERC721Upgradeable(nftContract).transferFrom(address(this), payerAddress , tokenId);
        IERC20Upgradeable(tokenContract).transferFrom(address(this), idToMarketItem[itemId].seller, price);
        // @dev set owner equal to msg.sender
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].isSold = true;
        _itemsSold.increment();
        // @dev 
        (bool sent, ) = idToMarketItem[itemId].seller.call{value: listingPrice}("");
        require(sent, "Failed to send Ether");
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

    function getUserItems() public view returns(MarketItem[] memory) {
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
        return (items);
    }

    function getUserCreateItems() public view returns(MarketItem[] memory) {
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
        return (items);
    }

}