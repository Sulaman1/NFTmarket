// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter public _itemIds;
    Counters.Counter public _itemsSold;
    uint256 public unsoldItemCount;

    address payable owner;
    address public ItemCaller;
    uint256 listingPrice = 0.025 ether;

    constructor() {
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => MarketItem) public idToMarketItem;
    mapping(uint256 => MarketItem) public idToUnsoldMarketItem;

    event MarketItemCreated(
        uint256 itemId,
        address nftContract,
        uint256 tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function uint2str(uint256 _i)
        internal
        pure
        returns (string memory _uintAsString)
    {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        //Testing Stuff Start
        string memory valS = uint2str(msg.value);
        string memory valS2 = "Price Must be equal to listing price ";
        string memory errMsg = string(abi.encodePacked(valS2, valS));
        require(price > 0, "Price Must be greater than 0");
        require(msg.value >= listingPrice, errMsg);
        //Testing Stuff End

        ItemCaller = msg.sender;
        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    function sellMarketItem(address nftContract, uint256 itemId)
        public
        payable
        nonReentrant
    {
        uint256 price = idToMarketItem[itemId].price;
        uint256 tokenId = idToMarketItem[itemId].tokenId;
        string memory valS = uint2str(msg.value);
        string memory valS2 = "Not enough Token ";
        string memory errMsg = string(abi.encodePacked(valS2, valS));
        require(msg.value >= price, errMsg);

        idToMarketItem[itemId].seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();
        payable(owner).transfer(listingPrice);
    }

    function fetchMarketItems() public returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint256 currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(0)) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function fetchMarketItems2() public {
        uint256 itemCount = _itemIds.current();
        unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(0)) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                idToUnsoldMarketItem[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
    }

    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint256 totalitemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalitemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint256 i = 0; i < totalitemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        uint256 totalitemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalitemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint256 i = 0; i < totalitemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                uint256 currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // function fetchMarketItems2() public view returns (  uint[] memory,
    //                                                     uint[] memory,
    //                                                     uint[] memory,
    //                                                     address[] memory,
    //                                                     address[] memory,
    //                                                     bool[] memory
    //                                                     ){
    //     uint itemCount = _itemIds.current();
    //     uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
    //     uint currentIndex = 0;

    //     uint256[] memory itemId = new uint[](unsoldItemCount);
    //     uint256[] memory price = new uint256[](unsoldItemCount);
    //     uint256[] memory tokenId = new uint256[](unsoldItemCount);
    //     //address[] memory owner1 = new address[](unsoldItemCount);
    //     address[] memory nftContract = new address[](unsoldItemCount);
    //     address[] memory seller = new address[](unsoldItemCount);
    //     bool[] memory sold = new bool[](unsoldItemCount);

    //     for(uint i=0; i<itemCount; i++){
    //         if(idToMarketItem[i + 1].owner == address(0)){

    //             itemId[currentIndex] = idToMarketItem[i+1].itemId;
    //             //itemId[currentIndex] = id;
    //             price[currentIndex]  = idToMarketItem[i+1].price;
    //             //price[currentIndex] = pri;
    //             tokenId[currentIndex] = idToMarketItem[i+1].tokenId;
    //             //tokenId[currentIndex] = tid;
    //             nftContract[currentIndex] = idToMarketItem[i+1].nftContract;
    //             //nftContract[currentIndex] = nftC;
    //             seller[currentIndex] = idToMarketItem[i+1].seller;
    //             //seller[currentIndex] = sell;
    //             //owner1[currentIndex] = idToMarketItem[i+1].owner;
    //             //owner1[currentIndex] = own;
    //             sold[currentIndex] = idToMarketItem[i+1].sold;
    //             //sold[currentIndex] = sol;

    //             currentIndex += 1;
    //         }
    //     }
    //     return (itemId, price, tokenId, nftContract, seller, sold);
    // }
}
