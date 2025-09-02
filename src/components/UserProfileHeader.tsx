'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function UserProfileHeader() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-gray-600 mb-6">
          Connect your Web3 wallet to start supporting creators
        </p>
        <ConnectButton />
      </div>
    );
  }

  // Mock user data - in real app this would come from user profile
  const userProfile = {
    name: 'Julie Peter',
    handle: 'buymeacoffee.com/julie',
    avatar: '👩‍💻',
    bio: 'Building amazing Web3 experiences',
    followers: 1250,
    following: 340
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-primary-gradient rounded-2xl flex items-center justify-center text-2xl">
          {userProfile.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">{userProfile.name}</h2>
            <ConnectButton />
          </div>
          <p className="text-sm text-gray-600 mb-3">{userProfile.handle}</p>
          <p className="text-gray-700 mb-4">{userProfile.bio}</p>
          
          <div className="flex items-center space-x-6 text-sm">
            <div>
              <span className="font-semibold text-gray-900">{userProfile.followers}</span>
              <span className="text-gray-600 ml-1">followers</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">{userProfile.following}</span>
              <span className="text-gray-600 ml-1">following</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Wallet Address</span>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          </code>
        </div>
      </div>
    </div>
  );
}
