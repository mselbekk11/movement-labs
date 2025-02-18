// app/register/page.tsx
'use client';

declare global {
  interface Window {
    ethereum?: any;
  }
}

import { useState } from 'react';
import { ethers } from 'ethers';

type WalletType = 'EVM' | 'Movement';

export default function RegisterPage() {
  const [walletType, setWalletType] = useState<WalletType>('EVM');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [connectionSignature, setConnectionSignature] = useState('');

  // EVM Wallet Connection using MetaMask
  const connectEVMWallet = async () => {
    try {
      if (!window.ethereum) {
        setMessage('MetaMask is not installed.');
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      // Add signature request during connection
      const connectionMessage = `I approve connecting my wallet ${addr} to this application.`;
      const signature = await signer.signMessage(connectionMessage);

      setAddress(addr);
      setConnectionSignature(signature);
    } catch (error: any) {
      console.error(error);
      setMessage('Error connecting EVM wallet.');
    }
  };

  // Simulated Movement wallet connection
  const connectMovementWallet = async () => {
    // For a real implementation, integrate the actual Movement/Aptos wallet adapter.
    // Here, we simulate the connection by prompting for an address.
    const addr = prompt('Enter your Movement wallet address:');
    if (addr) setAddress(addr);
  };

  const handleConnect = async () => {
    setMessage('');
    setAddress('');
    if (walletType === 'EVM') {
      await connectEVMWallet();
    } else {
      await connectMovementWallet();
    }
  };

  // Function to handle registration submission
  const handleRegister = async () => {
    if (!address || (walletType === 'EVM' && !connectionSignature)) {
      setMessage('Please connect a wallet first.');
      return;
    }

    // For EVM wallets: sign a registration challenge message
    let registrationSignature = '';
    if (walletType === 'EVM') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const challengeMessage =
          'Please sign this message to verify wallet ownership for registration.';
        registrationSignature = await signer.signMessage(challengeMessage);
      } catch (error: any) {
        console.log(error);
        setMessage('Error signing registration message.');
        return;
      }
    }

    // Call the API route to register the wallet
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletType,
          address,
          connectionSignature,
          registrationSignature,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Success: ${data.message}`);
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error: any) {
      console.log(error);
      setMessage('Error registering wallet.');
    }
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4'>
      <div className='bg-white p-6 rounded shadow-md w-full max-w-md'>
        <h1 className='text-2xl font-bold mb-4'>Register Your Wallet</h1>

        {/* Wallet type selection */}
        <div className='mb-4'>
          <label className='block mb-2 font-semibold'>
            Select Wallet Type:
          </label>
          <select
            className='w-full border p-2 rounded'
            value={walletType}
            onChange={(e) => setWalletType(e.target.value as WalletType)}
          >
            <option value='EVM'>EVM Wallet</option>
            <option value='Movement'>Movement Wallet</option>
          </select>
        </div>

        {/* Connect wallet button */}
        <button
          className='w-full bg-blue-500 text-white py-2 rounded mb-4'
          onClick={handleConnect}
        >
          Connect Wallet
        </button>

        {/* Display connected wallet address */}
        {address && (
          <div className='mb-4'>
            <p>
              <strong>Connected Address:</strong> {address}
            </p>
          </div>
        )}

        {/* Registration button */}
        <button
          className='w-full bg-green-500 text-white py-2 rounded'
          onClick={handleRegister}
          disabled={!address}
        >
          Register Wallet
        </button>

        {/* Message display */}
        {message && (
          <div className='mt-4 p-2 bg-gray-200 rounded'>{message}</div>
        )}
      </div>
    </div>
  );
}
