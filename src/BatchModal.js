import React from 'react';
import './BatchModal.css'; // Importa el archivo CSS que contiene los estilos de la modal
import PasswordVault_abi from './contracts/PasswordVault_abi.json';

const ethers = require("ethers");

const BatchModal = ({
    isOpen,
    closeModal,
    setLoading,
    setErrorMessage,
    encryptPassword,
    batchContract,
    fetchVaults
}) => {

    const contractAddressMB = '0xaF91f6b78C63956d7d0100414cb65552EC259555';

    const showHideClassName = isOpen ? "modal display-block" : "modal display-none";

    // Use ABI to create an interface
    const passwordVaultInterface = new ethers.Interface(PasswordVault_abi);

    const addBatchHandler = async (event) => {
        event.preventDefault();
        setLoading(true);
        if (batchContract) {
            try {
                const batchData = []; // Array to store complete tuples
                const to = []; // Array for contract addresses
                const value = []; // Array for values
                const gasLimit = []; // Array for gas limits

                // Iterate through the inputs of username, password, and url
                for (let i = 1; i <= 3; i++) { // Assuming you have 3 sets of fields
                    const username = event.target[`username${i}`].value;
                    const password = event.target[`password${i}`].value;
                    const url = event.target[`url${i}`].value;
                    
                    // Check if all fields are filled
                    if (username && password && url) {
                        const encryptedPassword = await encryptPassword(password);

                        batchData.push({ username, encryptedPassword, url }); // Add complete tuple to array
                        to.push(contractAddressMB); // Add contract address
                        value.push(0); // Add value (assuming 0 for now)
                        gasLimit.push(0); // Add gas limit (adjust as needed)
                    }
                }

                    // Check if complete tuples were found
                if (batchData.length > 0) {
                    const batchCallData = batchData.map(({ username, encryptedPassword, url }) =>
                        passwordVaultInterface.encodeFunctionData('addLogin', [username, encryptedPassword, url])
                    );

                    const tx = await batchContract.batchAll(to, value, batchCallData, gasLimit);
                    await tx.wait();
                    fetchVaults();
                } else {
                    setErrorMessage('No data provided');
                }

            } catch (error) {
                setErrorMessage(error.message);
            } finally {
                setLoading(false);
                closeModal()
            }
        } else {
            setErrorMessage('Contract is not loaded');
            setLoading(false);
            closeModal()
        }
    };

    return (
        <div className={showHideClassName}>
          <section className="modal-main">
            

          <form onSubmit={addBatchHandler}>
            <p><input id="username1" type="text" placeholder="Username" />
            <input id="password1" type="text" placeholder="Password" />
            <input id="url1" type="text" placeholder="URL" /></p>

            <p><input id="username2" type="text" placeholder="Username" />
            <input id="password2" type="text" placeholder="Password" />
            <input id="url2" type="text" placeholder="URL" /></p>
            
            <p><input id="username3" type="text" placeholder="Username" />
            <input id="password3" type="text" placeholder="Password" />
            <input id="url3" type="text" placeholder="URL" /></p>
            
            <button type="submit">Add Batch</button>
          </form>

            <button type="button" onClick={closeModal}>
              Close
            </button>
          </section>
        </div>
      );
};

export default BatchModal;