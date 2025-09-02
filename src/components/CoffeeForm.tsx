'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { useBuyCoffee } from '../lib/useContract';
import { ethers } from 'ethers';

interface CoffeeFormProps {
  username?: string;
}

export function CoffeeForm({ username }: CoffeeFormProps) {
  const { isConnected } = useAppSelector((state) => state.wallet);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('0.001');
  const { buyCoffee, isPending, isConfirming, isConfirmed, error, reset, hash } = useBuyCoffee();
  const [showSuccess, setShowSuccess] = useState(false);

  const explorerBase = useMemo(() => {
    const network = (process.env.NEXT_PUBLIC_NETWORK || 'arbitrumSepolia').toLowerCase();
    return network === 'arbitrum'
      ? 'https://arbiscan.io/tx'
      : 'https://sepolia.arbiscan.io/tx';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !username) return;

    // Check if contract is deployed
    if (!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
      alert('Contract not deployed yet. Please deploy the contract first.');
      return;
    }

    try {
      const fullMessage = name ? `${name}: ${message}` : message;
      const value = ethers.parseEther(amount);
      reset();
      buyCoffee(username, fullMessage, value);
    } catch (error) {
      console.error('Error buying coffee:', error);
    }
  };

  // Show success state when confirmed
  useEffect(() => {
    if (isConfirmed) {
      setShowSuccess(true);
      // reset local form fields
      setName('');
      setMessage('');
      setAmount('0.001');
      // hide success after a short delay
      const t = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(t);
    }
  }, [isConfirmed]);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Buy {username ? `@${username}` : 'Me'} a Coffee
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <p className="text-gray-600 mb-4">Connect your wallet to buy a coffee</p>
          <p className="text-sm text-gray-500">
            You'll need to connect your wallet to send transactions on Arbitrum
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Buy {username ? `@${username}` : 'Me'} a Coffee
      </h3>
      {showSuccess && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Coffee purchased successfully!
          {hash && (
            <a
              href={`${explorerBase}/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 underline"
            >
              View transaction
            </a>
          )}
        </div>
      )}
      
      {!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-700 text-sm">
            ⚠️ Contract not deployed yet. Coffee purchases will be available after deployment.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            required
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message (Optional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a nice message..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (ETH)
          </label>
          <div className="relative">
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.001"
              step="0.001"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="text-gray-500 text-sm">ETH</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minimum: 0.001 ETH (~$3)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{(error as Error).message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-amber-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isPending || isConfirming ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{isConfirming ? 'Confirming...' : 'Buying Coffee...'}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>☕</span>
              <span>Buy Coffee ({amount} ETH)</span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
}
