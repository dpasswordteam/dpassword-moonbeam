import React from 'react';
import './BatchModal.css'; // Importa el archivo CSS que contiene los estilos de la modal
import Batch_abi from './contracts/PasswordVault_abi.json';

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
    const batchInterface = new ethers.Interface(Batch_abi);

    const addBatchHandler = async (event) => {
        event.preventDefault();
        setLoading(true);
        if (batchContract) {
            try {
                const username = event.target.username.value;
                const password = event.target.password.value;
                const url = event.target.url.value;
                const encryptedPackage = await encryptPassword(password);


                const to = [
                    contractAddressMB
                  ];

                const value = [0]; // Asumimos que las llamadas no envían ETH

                // Find call data for the setMessage function
                const callData = batchInterface.encodeFunctionData(
                    'addLogin', 
                    [username, password, url]
                );

                const batchCallData = [callData];

                const gasLimit = [0]; // Ajusta según sea necesario

                const tx = await batchContract.batchAll(to, value, batchCallData, gasLimit);
                await tx.wait();
                fetchVaults();
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
            <p><input id="username" type="text" placeholder="Username" />
            <input id="password" type="text" placeholder="Password" />
            <input id="url" type="text" placeholder="URL" /></p>

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