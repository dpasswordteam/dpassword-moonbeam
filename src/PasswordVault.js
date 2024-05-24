// https://docs.metamask.io/guide/ethereum-provider.html#using-the-provider

import React, {useState, useEffect} from 'react'
import PasswordVault_abi from './contracts/PasswordVault_abi.json'
// Import everything
import { ethers } from "ethers";

const PasswordVault = ({ setLoading }) => {
	// deploy simple storage contract and paste deployed contract address here.
	let contractAddress = '0xe982E462b094850F12AF94d21D470e21bE9D0E9C';

	const [errorMessage, setErrorMessage] = useState(null);
	const [defaultAccount, setDefaultAccount] = useState(null);
	const [connButtonText, setConnButtonText] = useState('Connect Wallet');

	const [vault, setVault] = useState([]);

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

			let tempContract = new ethers.Contract(contractAddress, PasswordVault_abi, tempSigner);
			setContract(tempContract);
		} catch (error) {
			setErrorMessage(error.message);
		}	
	}

	const fetchVault = async (contract) => {
        try {
          const vault = await contract.getVault();
          setVault(vault);
        } catch (error) {
          setErrorMessage(error.message);
        }
    };

    const addLoginHandler = async (event) => {
        event.preventDefault();
        setLoading(true);
        if (contract) {
            try {
                const username = event.target.username.value;
                const password = event.target.password.value;
                const url = event.target.url.value;
                const tx = await contract.addLogin(username, password, url);
                await tx.wait();
                fetchVault(contract);
            } catch (error) {
                setErrorMessage(error.message);
            } finally {
                setLoading(false);
            }
        } else {
            setErrorMessage('Contract is not loaded');
            setLoading(false);
        }
    };
	
    return (
        <div>
          <h4>{"dPassword Vault"}</h4>
          <button onClick={connectWalletHandler}>{connButtonText}</button>
          <div>
            <h3>Address: {defaultAccount}</h3>
          </div>
          <form onSubmit={addLoginHandler}>
            <input id="username" type="text" placeholder="Username" />
            <input id="password" type="text" placeholder="Password" />
            <input id="url" type="text" placeholder="URL" />
            <button type="submit">Add Login</button>
          </form>
          <div>
            <h3>Vault:</h3>
            {vault.map((login, index) => (
              <div key={index}>
                <p>Username: {login.username}</p>
                <p>Password: {login.password}</p>
                <p>URL: {login.url}</p>
              </div>
            ))}
          </div>
          {errorMessage}
        </div>
    );
}

export default PasswordVault;