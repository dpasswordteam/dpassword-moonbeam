// SPDX-License-Identifier: UNLICENSED
//Solidity Version
pragma solidity >=0.8.2 <0.9.0;

contract PasswordVault {
    struct Login {
        string username;
        string password;
        string url;
    }

    struct Vault {
        Login[] logins;
    }

    mapping(address => Vault) private vaults;

    event LoginAdded(address indexed user, string username, string url);

    function addLogin(string memory _username, string memory _password, string memory _url) public {
        Login memory newLogin = Login({
            username: _username,
            password: _password,
            url: _url
        });

        vaults[msg.sender].logins.push(newLogin);
        emit LoginAdded(msg.sender, _username, _url);
    }

    function getVaults() public view returns (Vault[] memory) {
        Vault[] memory userVault = new Vault[](1);
        userVault[0] = vaults[msg.sender];
        return userVault;
    }
}