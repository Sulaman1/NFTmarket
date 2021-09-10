import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from 'axios';
import Web3Modal from 'web3modal'
import { nftaddress, nftmarketaddress } from '../config';
import NFT from '../pages/build/contracts/NFT.json';
import Market from '../pages/build/contracts/NFTMarket.json';

const Provider = require('@truffle/hdwallet-provider');
//const fromAdd = await web3.utils.toChecksumAddress('0x3EEe74823c59E709606d89BF10f2424465Ba69F9')
const priKey = 'b8ed812a73ca25905a534c4afc5b0f5ba2b387727cf73e4700fe843dcb7971b6';
//const priKey = '0x26b057a0c71c29749e992a11642f9e16e378271d4682b0ed73aa7f6754036080';
//const provider = new Provider(priKey, 'http://localhost:8545');
const provider = new Provider(priKey, `https://rinkeby.infura.io/v3/33b80616d03249baa458695ca6f348b4`);

export default function Home() {

  const [nfts, setNfts] = useState([]);
  const [nftItems, setNftItems] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');
  
  async function loadData(){
    // const web3Modal = new Web3Modal();
    // const connection = await web3Modal.connect();
    // const web3 = new Web3(connection);
    
    const web3 = new Web3(provider);
    const network = await web3.eth.net.getNetworkType();
    const accounts = await web3.eth.getAccounts()
    const networkId = await web3.eth.net.getId();
    console.log("Network : ", network, "   Accounts : ", accounts, "   NetID : ", networkId);
    console.log("Web3 : ", web3);

    const marketData = await Market.networks[networkId];
    const nftData = await NFT.networks[networkId];
    console.log("Market : ", marketData, "   NFT : ", nftData);
    let mContract = new web3.eth.Contract(Market.abi, nftmarketaddress);
    let nftContract = new web3.eth.Contract(NFT.abi, nftaddress);
    console.log("Market Contract : ", mContract, "    NFT Contract : ", nftContract);

    let fetchNfts = await mContract.methods.fetchMarketItems2().send({from: accounts[0]});
    let totalNFTs = await mContract.methods._itemIds().call();
    let unsoldNfts = await mContract.methods.unsoldItemCount().call();
    console.log("Total NFTs: ", totalNFTs, "UnSold NFTs : ", unsoldNfts);

    for(var i=0; i<unsoldNfts; i++){
      let unsoldNft = await mContract.methods.idToUnsoldMarketItem(i).call();
      
      const tokenUri1 = await nftContract.methods.tokenURI(unsoldNft.tokenId).call();
      console.log("URI : ", tokenUri1);
      const meta = await axios.get(tokenUri1);
      let price = web3.utils.toNumber(unsoldNft.price.toString());
      console.log("price : ", price)
      
      let obj = {
        price,
        tokenId: Number(unsoldNft.tokenId),
        seller: unsoldNft.seller,
        owner: unsoldNft.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description
      }
      console.log("obj NFTs : ", obj)
      setNfts(nfts => [...nfts, obj]);
    }

    // const items = await Promise.all(nfts.map(async i => {
    //   const tokenUri = await nftContract.methods.tokenURI(i.tokenId).call();
    //   console.log("URI : ", tokenUri);
    //   const meta = await axios.get(tokenUri);
    //   //let price = web3.utils.fromWei(i.price.toString(), 'ether');
    //   let price = web3.utils.toNumber(i.price.toString());
    //   console.log("price : ", price)
    //   let item = {
    //     price,
    //     tokenId: Number(i.tokenId),
    //     seller: i.seller,
    //     owner: i.owner,
    //     image: meta.data.image,
    //     name: meta.data.name,
    //     description: meta.data.description
    //   }
    //   return item;
    // }))
    // console.log("Items : ", items)
    // setNftItems([nftItems, ...items]);
    
    // console.log("Last Result: ", nftItems)
    setLoadingState("loaded");
  }

  async function buyNFTs(nft){
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const web3 = new Web3(connection);
    const accounts = await web3.eth.getAccounts();
    console.log("Acc : ", accounts);

    let mContract = new web3.eth.Contract(Market.abi, nftmarketaddress);
    let nftContract = new web3.eth.Contract(NFT.abi, nftaddress);
    
    const price = web3.utils.toNumber(nft.price.toString())
    console.log("Price in Buy: ", price, " tokenId: ", nft.tokenId, " Acc: ", accounts[0]);
    let listingPrice = await mContract.methods.getListingPrice().call();
    listingPrice = listingPrice.toString();
    let transaction = await mContract.methods.sellMarketItem(nftaddress, nft.tokenId).send({from: accounts[0], value: listingPrice})
    
    loadData();
  }

  useEffect(()=>{
    loadData();
  },[])

  async function load(){
    console.log("Load")
    await loadData();
  }

  if(loadingState === 'loaded' && !nfts.length) return (   
    <h1>Loaded No Items Available</h1>
  )
  if(!nfts.length) return (   
    <div>
      <button onClick={load}>Load</button>
      <h1>Loading Plzzzz Wait loading state: {loadingState}</h1>
    </div>
  )

  return (
    <div className="flex-justify-center">
      <div className="px-4" style={{ maxWidth: '1600px'}}>
        <div className="grid grid-cols-1 sx:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {nfts.map((nft, key)=>{
                  return(
                    <div key={key} className="border shadow rounded-xl overflow-hidden">
                      <img src={nft.image}/>
                      <div>
                        <p style={{height: '64px'}} className="text-2xl font-semibold">
                          {nft.name}
                        </p>
                        <div style={{height: '70px', overflow: 'hidden'}}>
                          <p className="text-gray-400">{nft.description}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-black">
                        <p className="text-2xl mb-4 font-bold text-white">{nft.price} ETH</p>
                        <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                        onClick={() => buyNFTs(nft)}>Buy</button>
                      </div>
                    </div>
                  )
                })}
        </div>
      </div>
    </div>
    )  
}
