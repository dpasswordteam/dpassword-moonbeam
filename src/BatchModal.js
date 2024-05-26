import React from 'react';
import './BatchModal.css'; // Importa el archivo CSS que contiene los estilos de la modal

const BatchModal = ({
    isOpen,
    closeModal,
    setLoading,
    setErrorMessage,
    encryptPassword,
    contract,
    fetchVaults
}) => {

    const showHideClassName = isOpen ? "modal display-block" : "modal display-none";


    const addBatchHandler = async (event) => {
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