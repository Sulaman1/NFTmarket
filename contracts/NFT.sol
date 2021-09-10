// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract NFT is ERC721URIStorage{
    using Counters for Counters.Counter;
    Counters.Counter public _tokenIds;
    uint256 public newId;
    address contractAddress;

    event Created(Counters.Counter _tokenIds, uint256 _tokenId);
    event CreatedToken(uint256 _tokenId);

    constructor(address marketplaceAddress) ERC721("CryptoBoy Tokens", "CBT"){
        contractAddress = marketplaceAddress;
    }

    function create(string memory tokenURI) public returns(uint){
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        newId = newItemId;
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        setApprovalForAll(contractAddress, true);
        emit CreatedToken(newItemId);
        emit Created(_tokenIds, newItemId);
        return newItemId;
    }
}