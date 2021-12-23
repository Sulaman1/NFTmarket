import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import axios from 'axios';
import Web3Modal from 'web3modal'
import { nftaddress, nftmarketaddress } from '../config';
import NFT from '../pages/build/contracts/NFT.json';
import Market from '../pages/build/contracts/NFTMarket.json';

require("dotenv").config();
const Provider = require('@truffle/hdwallet-provider');
const priKey = process.env.PRI_KEY;
const provider = new Provider(priKey, process.env.RINKEBY_URL);

export default function MyAssets() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  useEffect(() => {
    loadData();
  }, [])


  async function loadData() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const web3 = new Web3(connection);

    const accounts = await web3.eth.getAccounts()
    console.log("Accounts : ", accounts);

    let mContract = new web3.eth.Contract(Market.abi, nftmarketaddress);
    let nftContract = new web3.eth.Contract(NFT.abi, nftaddress);

    console.log("Current User : ", accounts[0])
    let acc = accounts[0];
    let fetchNfts = await mContract.methods.fetchMyNFTs().call({ from: acc });
    console.log("My NFTs : ", fetchNfts);

    let totalNFTs = await mContract.methods._itemIds().call();
    let unsoldNfts = await mContract.methods.unsoldItemCount().call();
    console.log("Total NFTs: ", totalNFTs, "UnSold NFTs : ", unsoldNfts);

    const items = await Promise.all(fetchNfts.map(async i => {
      const tokenUri = await nftContract.methods.tokenURI(i.tokenId).call();
      console.log("URI : ", tokenUri);
      const meta = await axios.get(tokenUri);
      //let price = web3.utils.fromWei(i.price.toString(), 'ether');
      let price = web3.utils.toNumber(i.price.toString());
      console.log("price : ", price)
      let item = {
        price,
        tokenId: Number(i.tokenId),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
      }
      return item;
    }))
    console.log("Items : ", items.length)

    for (var i = 0; i < items.length; i++) {
      let nftItem = {
        price: items[i].price,
        tokenId: items[i].tokenId,
        seller: items[i].seller,
        owner: items[i].owner,
        image: items[i].image,
      }
      console.log("My Item : ", nftItem)
      setNfts(nfts => [...nfts, nftItem]);
    }

    console.log("Last Result: ", nfts)
    setLoadingState("loaded");
  }
  if (loadingState === 'loaded' && !nfts.length) return (
    <h1>No Items Available</h1>
  )

  return (
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => {
              return (
                <div key={i} className="border shadow rounded-xl overflow-hidden">
                  <img src={nft.image} className="rounded" />
                  <div className="p-4 bg-black">
                    <p className="text-22xl font-bold textt-white">Price - {nft.price}</p>
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}