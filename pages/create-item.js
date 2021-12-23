import React, { useState } from 'react';
import Web3 from 'web3';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import Web3Modal from 'web3modal'
import { useRouter } from 'next/router'; //next/dist/client/router

import { nftaddress, nftmarketaddress } from '../config';
import NFT from '../pages/build/contracts/NFT.json';
import Market from '../pages/build/contracts/NFTMarket.json';

require("dotenv").config();
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')
const Provider = require('@truffle/hdwallet-provider');
const priKey = process.env.PRI_KEY;
const provider = new Provider(priKey, process.env.RINKEBY_URL);

export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, setFormInput] = useState({ price: '', name: '', description: '' });
    const router = useRouter();

    async function onChange(e) {
        const file = e.target.files[0];
        try {
            const added = await client.add(
                file,
                {
                    progress: (prog) => console.log("received : ", prog)
                }
            )
            const url = 'https://ipfs.infura.io/ipfs/' + added.path;
            console.log("Path : ", url);
            setFileUrl(url);
        }
        catch (err) {
            console.log(err);
        }
    }

    async function createItem() {
        const { name, description, price } = formInput
        if (!name || !description || !price) return
        const data = JSON.stringify({
            name, description, image: fileUrl
        })

        console.log("Meta Data: ", data);

        try {
            const added = await client.add(data)
            const url = 'https://ipfs.infura.io/ipfs/' + added.path
            console.log("Image URL : ", url);
            createSale(url)
        }
        catch (err) {
            console.log(err);
        }
    }

    async function createSale(url) {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const web3 = new Web3(connection);
        const accounts = await web3.eth.getAccounts()
        console.log("Url to create: ", url);
        console.log("Acc : ", accounts[0]);
        let nftContract = new web3.eth.Contract(NFT.abi, nftaddress);
        const tx = await nftContract.methods.create(url).send({ from: accounts[0] });
        console.log("Tx : ", tx);

        // const tx = await nftContract.methods.create(url);
        // const data = tx.encodeABI();
        // const gas = await tx.estimateGas({from: accounts[0]});
        // const gasPrice = await web3.eth.getGasPrice();
        // const txParams = {
        //     to: nftaddress,
        //     //from: accounts[0],
        //     gas: gasPrice,
        //     data: data,
        //     gasLimit: gas,
        //     //value: 2,
        //     //nonce: nonce,
        //     //chainId: id
        // };
        // const signTx = await web3.eth.accounts.signTransaction(txParams,priKey);
        // const receipt = await web3.eth.sendSignedTransaction(signTx.rawTransaction);
        // let txHash = receipt.transactionHash;
        // console.log("TxHash: ", txHash, "       Recipet : ", receipt);

        let tokenId = await nftContract.methods._tokenIds().call();
        let tokenId2 = await nftContract.methods.newId().call()

        console.log("_TI : ", tokenId, "        TI : ", tokenId2)
        const price = web3.utils.fromWei(formInput.price, 'ether');
        console.log("Price: ", price)
        let mContract = new web3.eth.Contract(Market.abi, nftmarketaddress);
        let listingPrice = await mContract.methods.getListingPrice().call();
        listingPrice = listingPrice.toString();
        let transaction = await mContract.methods.createMarketItem(nftaddress, tokenId, formInput.price).send({ from: accounts[0], value: listingPrice })
        //await transaction.wait();
        router.push('/');
    }
    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input
                    placeholder="NFT name"
                    className="mt-8 border rounded p-4"
                    onChange={e => setFormInput({ ...formInput, name: e.target.value })}
                />
                <textarea
                    placeholder="NFT Description"
                    className="mt-2 border rounded p-4"
                    onChange={e => setFormInput({ ...formInput, description: e.target.value })}
                />
                <input
                    placeholder="NFT Price"
                    className="mt-8 border rounded p-4"
                    onChange={e => setFormInput({ ...formInput, price: e.target.value })}
                />
                {/* <input
                    typr="file"
                    name="NFT"
                    className="my-4"
                    onChange={onChange}
                ></input> */}
                <input
                    type="file"
                    onChange={onChange}
                    className="btn btn-success bg-pink-500"
                // style={{width: '250px', margin: '0px 0px 10px 0px', backgroundColor: '#753a88'}}
                />

                {
                    fileUrl && (
                        <img className="rounded mt-4" width="350" src={fileUrl} />
                    )
                }
                <button
                    onClick={createItem}
                    className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
                >
                    Create Digital NFT
                </button>
            </div>
        </div>
    )

}
