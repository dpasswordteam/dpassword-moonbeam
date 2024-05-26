import './App.css';
import logo from './logo.svg';
import SimpleStorage from './SimpleStorage';
import PasswordVault from './PasswordVault';
import React, { useState, useEffect } from 'react';

function App() {
  
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      {loading ? (
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
      ) : (
        <>
          {/*<SimpleStorage setLoading={setLoading} />*/}
          <PasswordVault setLoading={setLoading} setErrorMessage={setErrorMessage} publicKey={publicKey} setPublicKey={setPublicKey}/>
          {errorMessage}
        </>
      )}
    </div>
  );
}

export default App;
