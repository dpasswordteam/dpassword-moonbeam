// https://docs.metamask.io/guide/ethereum-provider.html#using-the-provider

import React, {useState, useEffect} from 'react'
import SimpleStorage_abi from './contracts/SimpleStorage_abi.json'
// Import everything
import { ethers } from "ethers";

const SimpleStorage = ({ setLoading }) => {
    

	// deploy simple storage contract and paste deployed contract address here. This value is local ganache chain
	let contractAddress = '0x5b1869D9A4C187sF2EAa108f3062412ecf0526b24';

	const [errorMessage, setErrorMessage] = useState(null);
	const [defaultAccount, setDefaultAccount] = useState(null);
	const [connButtonText, setConnButtonText] = useState('Connect Wallet');

	const [currentContractVal, setCurrentContractVal] = useState(null);

	const [provider, setProvider] = useState(null);
	const [signer, setSigner] = useState(null);
	const [contract, setContract] = useState(null);


	useEffect(() => {
		connectWalletHandler();
	  }, []);


	const connectWalletHandler = () => {
		if (window.ethereum && window.ethereum.isMetaMask) {

			window.ethereum.request({ method: 'eth_requestAccounts'})
			.then(result => {
				accountChangedHandler(result[0]);
				setConnButtonText('Wallet Connected');
			})
			.catch(error => {
				setErrorMessage(error.message);
			
			});

		} else {
			console.log('Need to install MetaMask');
			setErrorMessage('Please install MetaMask browser extension to interact');
		}
	}

	// update account, will cause component re-render
	const accountChangedHandler = (newAccount) => {
		setDefaultAccount(newAccount);
		updateEthers();
	}

	const chainChangedHandler = () => {
		// reload the page to avoid any errors with chain change mid use of application
		window.location.reload();
	}


	// listen for account changes
	window.ethereum.on('accountsChanged', accountChangedHandler);

	window.ethereum.on('chainChanged', chainChangedHandler);

	const updateEthers = async () => {
		try {
			let tempProvider = new ethers.BrowserProvider(window.ethereum)
			setProvider(tempProvider);

			let tempSigner = await tempProvider.getSigner();
			setSigner(tempSigner);

			let tempContract = new ethers.Contract(contractAddress, SimpleStorage_abi, tempSigner);
			setContract(tempContract);
		} catch (error) {
			setErrorMessage(error.message);
		}	
	}

	const setHandler = async (event) => {
		event.preventDefault();
		console.log('sending ' + event.target.setText.value + ' to the contract');
		try {
			const tx = await contract.set(event.target.setText.value);
			await tx.wait();
			console.log('Transaction successful');
		} catch (error) {
			if (error.message.indexOf("User denied") !== -1) {
				setErrorMessage('User denied transaction signature');
			} else {
				setErrorMessage(error.message);
			}
			
		}
	}

	const getCurrentVal = async () => {
		let val = await contract.get();
		setCurrentContractVal(val);
	}
	
	return (
		<div>
		<h4> {"Get/Set Contract interaction"} </h4>
			<button onClick={connectWalletHandler}>{connButtonText}</button>
			<div>
				<h3>Address: {defaultAccount}</h3>
			</div>
			<form onSubmit={setHandler}>
				<input id="setText" type="text"/>
				<button type={"submit"}> Update Contract </button>
			</form>
			<div>
			<button onClick={getCurrentVal} style={{marginTop: '5em'}}> Get Current Contract Value </button>
			</div>
			{currentContractVal}
			{errorMessage}
		</div>
	);
}

export default SimpleStorage;