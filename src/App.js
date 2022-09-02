import React, { useEffect, useState } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import { ethers } from "ethers";

import myEpicNft from "./utils/MyEpicNFT.json";

import * as UAuthWeb3Modal from "@uauth/web3modal";
import UAuthSPA from "@uauth/js";
import Web3Modal from "web3modal";

export const uauthOptions = {
  clientID: "ea424726-6d2b-40e5-bad8-d969a3f9183f",
  redirectUri: "https://jvs-collection.netlify.app",
  scope: "openid wallet",
};

let providerOptions = {
  "custom-uauth": {
    // The UI Assets
    display: UAuthWeb3Modal.display,

    // The Connector
    connector: UAuthWeb3Modal.connector,

    // The SPA libary
    package: UAuthSPA,

    // The SPA libary options
    options: uauthOptions,
  },
};

const web3Modal = new Web3Modal({
  providerOptions,
  cacheProvider: true,
  theme: `light`,
});

UAuthWeb3Modal.registerWeb3Modal(web3Modal);

const TWITTER_HANDLE = "janvinsha";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK =
  "https://testnets.opensea.io/collection/coolerenyeagernft-v2";
const TOTAL_MINT_COUNT = 100;

const CONTRACT_ADDRESS = "0x65813c8B5a99dECA557B6A08749B6Cd78C0a4cF6";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [minting, setMinting] = useState(false);
  const [nftAmount, setNftAmount] = useState("0");

  const checkIfWalletIsConnected = async () => {
    if (web3Modal.cachedProvider) {
      let wallet = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(wallet);
      const accounts = await provider?.listAccounts();

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);

        // Setup listener! This is for the case where a user comes to our site
        // and ALREADY had their wallet connected + authorized.
        setupEventListener();
      } else {
        console.log("No authorized account found");
      }

      const signer = provider.getSigner();
      let chainId = await signer.getChainId();
      console.log("Connected to chain " + chainId);

      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = "0x4";
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
      }
    }
  };

  const connectWallet = async () => {
    try {
      if (web3Modal.cachedProvider) {
        web3Modal.clearCachedProvider();
      }

      const wallet = await web3Modal.connect();

      const tProvider = new ethers.providers.Web3Provider(wallet);
      const accounts = await tProvider.listAccounts();
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft

    try {
      if (web3Modal.cachedProvider) {
        let wallet = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(wallet);
        // Same stuff again

        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      if (web3Modal.cachedProvider) {
        let wallet = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(wallet);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.");
        setMinting(true);
        await nftTxn.wait();
        console.log(nftTxn);
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
        setMinting(false); //set NFT amount
        let realAmount = await connectedContract.getTotalNFTsMintedSoFar();
        console.log(realAmount.toString());
        setNftAmount(realAmount.toString());
      } else {
        setMinting(false);
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setMinting(false);
      console.log(error);
    }
  };

  const refreshAmount = async () => {
    try {
      if (web3Modal.cachedProvider) {
        let wallet = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(wallet);

        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        let realAmount = await connectedContract.getTotalNFTsMintedSoFar();
        console.log(realAmount.toString());
        setNftAmount(realAmount.toString());
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    refreshAmount();
  }, []);

  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );

  const renderMintUI = () => (
    <button
      onClick={askContractToMintNft}
      className="cta-button connect-wallet-button"
    >
      {!minting ? "Mint NFT" : "Minting....."}
    </button>
  );

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? (
            ""
          ) : (
            <p className="sub-text">{nftAmount}/100 NFTs minted so far</p>
          )}
          {currentAccount === ""
            ? renderNotConnectedContainer()
            : renderMintUI()}
          <p>
            <a
              className="footer-text"
              href="https://testnets.opensea.io/collection/coolerenyeagernft-v2"
            >
              {" "}
              🌊 View Collection on OpenSea
            </a>
          </p>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{` @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
