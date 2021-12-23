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

export default function CreatorDashboard() {
    const [nfts, setNfts] = useState([]);
    const [sold, setSold] = useState([]);
    const [loadingState, setLoadingState] = useState('not-loaded');

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const web3 = new Web3(connection);

        const network = await web3.eth.net.getNetworkType();
        const accounts = await web3.eth.getAccounts()
        const networkId = await web3.eth.net.getId();
        console.log("Network : ", network, "   Accounts : ", accounts, "   NetID : ", networkId);

        let mContract = new web3.eth.Contract(Market.abi, nftmarketaddress);
        let nftContract = new web3.eth.Contract(NFT.abi, nftaddress);
        console.log("Market Contract : ", mContract, "    NFT Contract : ", nftContract);

        //let fetchNfts = await mContract.methods.fetchMyNFTs().send({from: accounts[0]});
        let fetchNfts = await mContract.methods.fetchItemsCreated().call({ from: accounts[0] });
        console.log("My NFTs : ", fetchNfts);

        let totalNFTs = await mContract.methods._itemIds().call();
        let unsoldNfts = await mContract.methods.unsoldItemCount().call();
        console.log("Total NFTs: ", totalNFTs, "UnSold NFTs : ", unsoldNfts);

        const items = await Promise.all(fetchNfts.map(async i => {
            const tokenUri = await nftContract.methods.tokenURI(i.tokenId).call();
            console.log("URIs : ", tokenUri);
            const meta = await axios.get(tokenUri);
            //let price = web3.utils.fromWei(i.price.toString(), 'ether');
            let price = web3.utils.toNumber(i.price.toString());
            console.log("price : ", price)
            let item = {
                price,
                tokenId: Number(i.tokenId),
                seller: i.seller,
                owner: i.owner,
                sold: i.sold,
                image: meta.data.image,
            }
            return item;
        }))
        console.log("Items : ", items)

        setNfts([...nfts, ...items]);
        console.log("Last Result: ", nfts)


        const soldItems = items.filter(i => i.sold)
        console.log("Sold Items: ", soldItems);
        setSold([...sold, ...soldItems]);
        setLoadingState("loaded");
    }


    if (loadingState === 'loaded' && !nfts.length) return (
        <h1>You Have Created {nfts.length} Nfts </h1>
    )
    if (loadingState === 'not-loaded' && nfts.length) return (
        <h1>Loading Plzzzzz Wait... Nfts: {nfts.length}</h1>
    )

    return (
        <div>
            <div className="p-4">
                <h2 className="text-2xl py-2">Items Created</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {
                        nfts.map((nft, i) => {
                            return (
                                <div key={i} className="border shadow rounded-xl overflow-hidden">
                                    <img src={nft.image} className="rounded" />
                                    <div className="p-4 bg-black">
                                        <p className="text-2xl font-bold text-white">Price - {nft.price} ETH</p>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
            <div className="px-4">
                {
                    Boolean(sold.length) && (
                        <div>
                            <h2 className="text-2xl py-2">Items Sold</h2>
                            <div className="grid grid-cols-1 sm:gridccols-2 lg:grid-cols4 gap-4 pt-4">
                                {
                                    sold.map((nft, i) => {
                                        return (
                                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                                <img src={nft.image} className="rounded" />
                                                <div className="p-4 bg-black">
                                                    <p className="text-2xl font-bold text-white">Price - {nft.price} ETH</p>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    )



}