import { ethers } from 'ethers';
import { signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util';

const createPermitMessageData = (from, to, value, data, gaslimit, nonce, deadline) => {
  const message = {
    from: from,
    to: to,
    value: value,
    data: data,
    gaslimit: gaslimit,
    nonce: nonce,
    deadline: deadline,
  };

  const typedData = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      CallPermit: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'gaslimit', type: 'uint64' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'CallPermit',
    domain: {
      name: 'Call Permit Precompile',
      version: '1',
      chainId: 1287,
      verifyingContract: '0x000000000000000000000000000000000000080a',
    },
    message: message,
  };

  return {
    typedData,
    message,
  };
};


export const getSignature = (from, to, value, data, gaslimit, nonce, deadline, privateKey) => {

    const messageData = createPermitMessageData(from, to, value, data, gaslimit, nonce, deadline);

    // For demo purposes only. Never store your private key in a JavaScript/TypeScript file
    const signature = signTypedData({
      privateKey: Buffer.from(privateKey, 'hex'),
      data: messageData.typedData,
      version: SignTypedDataVersion.V4,
    });

    console.log(`Transaction successful with hash: ${signature}`);

    const ethersSignature = ethers.Signature.from(signature);
    const formattedSignature = {
      r: ethersSignature.r,
      s: ethersSignature.s,
      v: ethersSignature.v,
    };

    console.log(formattedSignature);

    return formattedSignature;
};