import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React from "react";
import { useEffect, useState } from 'react';
import { ethers } from "ethers"
import myEpicNft from './utils/MyEpicNFT.json';
import ClipLoader from "react-spinners/ClipLoader";

// Constants
const MY_TWITTER_HANDLE = 'be_lockay';
const TWITTER_LINK = `https://twitter.com/${MY_TWITTER_HANDLE}`;
const TOTAL_MINT_COUNT = 50;
const OPENSEA_URL ="https://testnets.opensea.io/collection/squarenft-0bfrmp7lm3"

const App = () => {

	/*
  * Just a state variable we use to store our user's public wallet. Don't forget to import useState.
  */
  const [currentAccount, setCurrentAccount] = useState("");
  const [mintedNFTsCounts, setMintedNFTsCount] = useState(null);
	const [isMining, setIsMining] = useState(false)
	const CONTRACT_ADDRESS = "0xB3fA8B7b756BE2dae42FcF422De93249e639Ffb8";

	const checkIfWalletIsConnected = async () => {
		// Check if we have ethereum
		const { ethereum } = window

		if (!ethereum) {
			console.log("Make sure you have metamask!")
			return
		}
		else {
			console.log("we have the ethereum object")
		}

		let chainId = await ethereum.request({ method: 'eth_chainId' });
		console.log("Connected to chain " + chainId);

		// String, hex code of the chainId of the Rinkebey test network
		const rinkebyChainId = "0x4"; 
		if (chainId !== rinkebyChainId) {
			alert("You are not connected to the Rinkeby Test Network!");
			return
		}

		/*
    * Check if we're authorized to access the user's wallet
    */
    const accounts = await ethereum.request({ method: 'eth_accounts' });

    /*
    * User can have multiple authorized accounts, we grab the first one if its there!
    */
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account)
			// Setup listener! This is for the case where a user comes to our site
			// and ALREADY had their wallet connected + authorized.
			setupEventListener()
			getNFTsMintedCount()
    } else {
      console.log("No authorized account found")
    }

	}

	/*
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

			let chainId = await ethereum.request({ method: 'eth_chainId' });
			console.log("Connected to chain " + chainId);

			// String, hex code of the chainId of the Rinkebey test network
			const rinkebyChainId = "0x4"; 
			if (chainId !== rinkebyChainId) {
				alert("You are not connected to the Rinkeby Test Network!");
				return
			}

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 

			// Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener()
			getNFTsMintedCount()
    } catch (error) {
      console.log(error)
    }
  }

	// Setup our listener.
	const setupEventListener = async () => {
		// Most of this looks the same as our function askContractToMintNft
		try {
			const { ethereum } = window;

			if (ethereum) {
				// Same stuff again
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

				// THIS IS THE MAGIC SAUCE.
				// This will essentially "capture" our event when our contract throws it.
				// If you're familiar with webhooks, it's very similar to that!
				connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
					console.log(from, tokenId.toNumber())
					alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()
					}`)
					getNFTsMintedCount()
				});

				console.log("Setup event listener!")

			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error)
		}
	}

	const getNFTsMintedCount = async () => {
		try {
			const {ethereum} = window

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

				const totalNFTsMinted = await connectedContract.getTotalNFTsMinted()
				setMintedNFTsCount(Number(totalNFTsMinted))
			}
			else {
				console.log("ethereum object doesn't exist")
			}
		}
		catch (err) {
			console.log(err)
		}
	}

	const askContractToMintNft = async () => {

		setIsMining(true)
		if (mintedNFTsCounts === TOTAL_MINT_COUNT) {
			alert("Fresh out of NFT's")
			return
		}

		try {
			const { ethereum } = window;
	
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

				console.log("Going to pop wallet now to pay gas...")
				let nftTxn = await connectedContract.makeAnEpicNFT();
				
				console.log("Mining...please wait.")
				await nftTxn.wait();
				
				console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
				setIsMining(false)
	
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			setIsMining(false)
			console.log(error)
		}
	}
	
	/*
	* This runs our function when the page loads.
	*/
	useEffect(() => {
		checkIfWalletIsConnected();
	}, [])

	const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const renderMintUI = () => (
		<div style={{display: 'flex', margin: '0 auto', justifyContent: 'center', position: 'relative'}}>
			{isMining && <div style={{position: 'absolute', top: '0'}}>
				<ClipLoader/>
			</div>}
			<button onClick={askContractToMintNft} disabled={isMining} className="cta-button connect-wallet-button mint-button">
				<span>Mint NFT</span>
			</button>
		</div>
  )

	return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<p className="header gradient-text">My NFT Collection</p>
					<p className="sub-text">
						Each unique. Each beautiful. Discover your NFT today.
					</p>
					<p className="sub-text">
						{mintedNFTsCounts && mintedNFTsCounts + "/" + TOTAL_MINT_COUNT + " Already Minted"} 
					</p>
					<p>
						<a className="sub-text" href={OPENSEA_URL} target="blank">
							View on OpenSea
						</a>
					</p>
					{currentAccount === "" ? renderNotConnectedContainer() : renderMintUI()}
				</div>
				<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built by @${MY_TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
};

export default App;
