// https://docs.metamask.io/guide/ethereum-provider.html#using-the-provider
// Import everything
import React, {useState, useEffect} from 'react';
import PasswordVault_abi from './contracts/PasswordVault_abi.json';
import Batch_abi from './contracts/Batch_abi.json';
import CallPermit_abi from './contracts/CallPermit_abi.json';
import CryptoJS from 'crypto-js';
import { encrypt } from 'eth-sig-util';
import { bufferToHex } from 'ethereumjs-util';
import BatchModal from './BatchModal';
import { getSignature } from './CallPermit'
const ethers = require("ethers")

const PasswordVault = ({ setLoading, setErrorMessage, publicKey, setPublicKey }) => {
	// deploy simple storage contract and paste deployed contract address here.
	//let contractAddress = '0xDDb64fE46a91D46ee29420539FC25FD07c5FEa3E';
    const contractAddressMB = '0xaF91f6b78C63956d7d0100414cb65552EC259555';

    const batchContractAddressMB = '0x0000000000000000000000000000000000000808'
    const callPermitContractAddressMB = '0x000000000000000000000000000000000000080a'

	
	const [defaultAccount, setDefaultAccount] = useState(null);
	const [connButtonText, setConnButtonText] = useState('Connect Wallet');

    const [vaults, setVaults] = useState([]);

	const [provider, setProvider] = useState(null);
	const [signer, setSigner] = useState(null);
	const [contract, setContract] = useState(null);
    const [batchContract, setBatchContract] = useState(null);
    const [callPermitContract, setCallPermitContract] = useState(null);

    const [decryptedPasswords, setDecryptedPasswords] = useState({});

    const [modalIsOpen, setModalIsOpen] = useState(false);

    // Use ABI to create an interface
    const callPermitInterface = new ethers.Interface(CallPermit_abi);
    // Use ABI to create an interface
    const batchInterface = new ethers.Interface(Batch_abi);
    // Use ABI to create an interface
    const passwordVaultInterface = new ethers.Interface(PasswordVault_abi);
    
    const openModal = () => {
        setModalIsOpen(true);
    }

    const closeModal = () => {
        setModalIsOpen(false);
    }

	useEffect(() => {
		connectWalletHandler();
	});


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
        updateEthers(newAccount);
	}

	const chainChangedHandler = () => {
		// reload the page to avoid any errors with chain change mid use of application
		window.location.reload();
	}

	// listen for account changes
	//window.ethereum.on('accountsChanged', accountChangedHandler);

	//window.ethereum.on('chainChanged', chainChangedHandler);

	const updateEthers = async (newAccount) => {

        const providerRPC = {
            moonbeam: {
                name: 'moonbase-alpha',
                rpc: 'https://rpc.api.moonbase.moonbeam.network', // Insert your RPC URL here
                chainId: 1287, // 0x504 in hex,
            }
        };

		try {
            const tempProvider = new ethers.JsonRpcProvider(providerRPC.moonbeam.rpc, {
                chainId: providerRPC.moonbeam.chainId,
                name: providerRPC.moonbeam.name,
            });
            setProvider(tempProvider);

			let tempSignerProvider = new ethers.BrowserProvider(window.ethereum);
			

			let tempSigner = await tempSignerProvider.getSigner();
			setSigner(tempSigner);

			//let tempContract = new ethers.Contract(contractAddress, PasswordVault_abi, tempSigner);
            let tempContract = new ethers.Contract(contractAddressMB, PasswordVault_abi, tempSigner);
			setContract(tempContract);

            let tempBatchContract = new ethers.Contract(batchContractAddressMB, Batch_abi, tempSigner);
			setBatchContract(tempBatchContract);


            // CallPermit calls are signed by company wallet
            let wallet = new ethers.Wallet("565427635873a0562de50c29a56b321617bb215556d19cc962c6c2d11c2cdd66", provider);
            let tempCallPermitContract = new ethers.Contract(callPermitContractAddressMB, CallPermit_abi, tempSigner);
			setCallPermitContract(tempCallPermitContract);
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
        try{
            // Generate a symmetric key
            const symKey = CryptoJS.lib.WordArray.random(16).toString();
            
            // Encrypt the password with the symmetric key
            const encryptedPassword = CryptoJS.AES.encrypt(password, symKey).toString();
        
            // Combine the symmetric key and the encrypted password
            const combined = `${symKey}:${encryptedPassword}`;

            const tempPublicKey = publicKey || await window.ethereum.request({
                    method: 'eth_getEncryptionPublicKey',
                    params: [defaultAccount],
                });

            setPublicKey(tempPublicKey)

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
        } catch (error) {
            console.error('Failed to get encryption public key:', error);
            return null;
        }
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
                if (error.message.indexOf("User denied") !== -1) {
                    setErrorMessage('User denied transaction signature');
                } else {
                    setErrorMessage(error.message);
                }
            } finally {
                setLoading(false);
                event.preventDefault();
            }
        } else {
            setErrorMessage('Contract is not loaded');
            setLoading(false);
        }
        event.preventDefault();
    };

    const addFirstLoginHandler = async (event) => {
        setLoading(true);
        if (callPermitContract) {
            try {
                const username = event.target.f_username.value;
                const password = event.target.f_password.value;
                const url = event.target.f_url.value;
                //const encryptedPassword = await encryptPassword(password);

                const callData = passwordVaultInterface.encodeFunctionData('addLogin', [username, password, url])
                
                const nonce = event.target.f_nonce.value;
                //const nonce = await callPermitContract.nonces(defaultAccount);

                const privateKey = event.target.f_privateKey.value;
                
                const signature = getSignature(defaultAccount, contractAddressMB, 0, callData, 1000, nonce, 1716751660000, privateKey)

                const tx = await callPermitContract.dispatch(defaultAccount, 
                    contractAddressMB, 0, callData, 1000, 1716751660000, signature.v, signature.r, signature.s  );
                await tx.wait();
                fetchVaults();

            } catch (error) {
                if (error.message.indexOf("User denied") !== -1) {
                    setErrorMessage('User denied transaction signature');
                } else {
                    setErrorMessage(error.message);
                }
            } finally {
                setLoading(false);
                event.preventDefault();
            }
        } else {
            setErrorMessage('Contract is not loaded');
            setLoading(false);
        }
        event.preventDefault();
    };
	
    return (
        <div>
          <h4>{"dPassword Vault"}</h4>
          <button onClick={connectWalletHandler}>{connButtonText}</button>
          <div>
            <h3>Address: {defaultAccount}</h3>
          </div>

          <div>
            <h3>Add your first password for free</h3>
          </div>
          <form onSubmit={addFirstLoginHandler}>
            <input id="f_username" type="text" placeholder="Username" />
            <input id="f_password" type="text" placeholder="Password" />
            <input id="f_url" type="text" placeholder="URL" />
            <input id="f_nonce" type="number" placeholder="0"/>
            <input id="f_privateKey" type="text" placeholder="PrivateKey"/>
            <button type="submit">Add First Login</button>
          </form>


          <div>
            <h3>Add a password</h3>
          </div>
          <form onSubmit={addLoginHandler}>
            <input id="username" type="text" placeholder="Username" />
            <input id="password" type="text" placeholder="Password" />
            <input id="url" type="text" placeholder="URL" />
            <button type="submit">Add Login</button>
          </form>
            
            <button type="button" onClick={openModal}>Add Batch Logins</button>
            <BatchModal 
                isOpen={modalIsOpen} 
                closeModal={closeModal} 
                setLoading={setLoading} 
                setErrorMessage={setErrorMessage} 
                encryptPassword={encryptPassword}
                batchContract={batchContract}
                fetchVaults={fetchVaults}
                />
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
        </div>
    );
}

export default PasswordVault;