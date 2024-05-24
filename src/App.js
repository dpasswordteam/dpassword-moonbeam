import './App.css';
import logo from './logo.svg';
import SimpleStorage from './SimpleStorage';
import PasswordVault from './PasswordVault';
import React, { useState, useEffect } from 'react';

function App() {
  const [loading, setLoading] = useState(true);

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
          <PasswordVault setLoading={setLoading} />
        </>
      )}
    </div>
  );
}

export default App;
