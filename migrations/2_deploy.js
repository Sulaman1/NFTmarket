const NFT = artifacts.require("NFT");
const NFTMarket = artifacts.require("NFTMarket");

module.exports = async function (deployer) {
    await deployer.deploy(NFTMarket)
    const nftMarketContract = await NFTMarket.deployed();
    const nftMarketAddress = await nftMarketContract.address;
    console.log("Market Address : ", nftMarketAddress);
    
    await deployer.deploy(NFT, nftMarketAddress);
    const nftContract = await NFT.deployed();
    console.log("NFT address : ", nftContract.address);
};
