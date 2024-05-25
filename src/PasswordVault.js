// https://docs.metamask.io/guide/ethereum-provider.html#using-the-provider
// Import everything
import React, {useState, useEffect} from 'react';
import PasswordVault_abi from './contracts/PasswordVault_abi.json';
import { ethers } from "ethers";
import CryptoJS from 'crypto-js';
import { encrypt } from 'eth-sig-util';
import { bufferToHex } from 'ethereumjs-util';

const PasswordVault = ({ setLoading }) => {
	// deploy simple storage contract and paste deployed contract address here.
	let contractAddress = '0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E';

	const [errorMessage, setErrorMessage] = useState(null);
	const [defaultAccount, setDefaultAccount] = useState(null);
	const [connButtonText, setConnButtonText] = useState('Connect Wallet');

    const [vaults, setVaults] = useState([]);

	const [provider, setProvider] = useState(null);
	const [signer, setSigner] = useState(null);
	const [contract, setContract] = useState(null);

    const [publicKey, setPublicKey] = useState(null);

    const [decryptedPasswords, setDecryptedPasswords] = useState({});

	useEffect(() => {
		connectWalletHandler();
	  }, []);


    useEffect(() => {
        if (contract) {
            fetchVaults()
        }
    }, [contract])

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

	const fetchVaults = async () => {
        if (contract) {
            try {
                const retrievedVaults = await contract.getVaults();
                
                setVaults(retrievedVaults);            
            } catch (error) {
                setErrorMessage(error.message);
            }
        }
    };

    const encryptPassword = async (password) => {
        // Generate a symmetric key
        const symKey = CryptoJS.lib.WordArray.random(16).toString();
        
        // Encrypt the password with the symmetric key
        const encryptedPassword = CryptoJS.AES.encrypt(password, symKey).toString();
    
        // Combine the symmetric key and the encrypted password
        const combined = `${symKey}:${encryptedPassword}`;

        let tempPublicKey = '';
        if(publicKey == null){
            tempPublicKey = await window.ethereum.request({
                method: 'eth_getEncryptionPublicKey',
                params: [defaultAccount],
             })
             setPublicKey(tempPublicKey)
        }

        const encryptedData = bufferToHex(
            Buffer.from(
                JSON.stringify(
                    encrypt(tempPublicKey, 
                        { data: combined }, 
                        'x25519-xsalsa20-poly1305'),
                ),
                'utf8',
            ),
        );


        return encryptedData;
    }

    const decryptPassword = async (encryptedPassword) => {
        try {
            // Desencripta el mensaje cifrado utilizando eth_decrypt
            const decryptedData = await window.ethereum.request({
                method: 'eth_decrypt',
                params: [encryptedPassword, defaultAccount]
            });

            // Separa la clave simétrica y la contraseña encriptada
            const [symKey, encryptedPass] = decryptedData.split(':');

            // Desencripta la contraseña utilizando la clave simétrica
            const bytes = CryptoJS.AES.decrypt(encryptedPass, symKey);
            const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);

            return decryptedPassword;
        } catch (error) {
            throw new Error('Failed to decrypt password');
        }
    }

    const handleViewPassword = async (login) => {
        try {
            const decryptedPassword = await decryptPassword(login.password);
            setDecryptedPasswords(prevState => ({
                ...prevState,
                [login.password]: decryptedPassword
            }));
        } catch (error) {
            setErrorMessage(error.message);
        }
    }

    const addLoginHandler = async (event) => {
        event.preventDefault();
        setLoading(true);
        if (contract) {
            try {
                const username = event.target.username.value;
                const password = event.target.password.value;
                const url = event.target.url.value;

                const encryptedPackage = await encryptPassword(password);

                const tx = await contract.addLogin(username, encryptedPackage, url);
                await tx.wait();
                fetchVaults();
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
            {vaults.length > 0 ? (
            vaults.map((vault, vaultIndex) => (
                <div key={vaultIndex}>
                {vault.logins.length > 0 ? (
                    vault.logins.map((login) => (
                    <div>
                        <p>
                            Username: {login.username}, 
                            Password: {decryptedPasswords[login.password] || (
                                <button onClick={() => handleViewPassword(login)}>View Password</button>
                            )}, 
                            URL: {login.url}
                        </p>
                    </div>
                    ))
                ) : (
                    <p>No logins found</p>
                )}
                </div>
            ))
            ) : (
                <p>No logins found</p>
            )}
          </div>
          {errorMessage}
        </div>
    );
}

export default PasswordVault;