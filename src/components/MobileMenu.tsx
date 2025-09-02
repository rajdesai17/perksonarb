'use client';

import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface MobileMenuProps {
  isContractDeployed: boolean;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isContractDeployed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected } = useAccount();

  return (
    <div className="sm:hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-coffee-700 hover:text-coffee-900 hover:bg-coffee-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-coffee-500"
        aria-expanded="false"
      >
        <span className="sr-only">Open main menu</span>
        {!isOpen ? (
          <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        ) : (
          <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      {/* Mobile menu panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-coffee-200 shadow-lg z-50">
          <div className="px-4 py-6 space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-coffee-800">Wallet Status:</span>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-800">Connected</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600">Not Connected</span>
                  </>
                )}
              </div>
            </div>

            {/* Connect Button */}
            <div className="pt-2">
              <ConnectButton />
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-coffee-200">
              <h4 className="text-sm font-semibold text-coffee-800 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    document.getElementById('buy-coffee-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mobile-nav-item w-full text-left"
                  disabled={!isConnected || !isContractDeployed}
                >
                  ☕ Buy Coffee
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    document.getElementById('coffee-history')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mobile-nav-item w-full text-left"
                >
                  🏆 View Supporters
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    document.getElementById('network-info')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mobile-nav-item w-full text-left"
                >
                  🌐 Network Info
                </button>
              </div>
            </div>

            {/* Contract Status */}
            <div className="pt-4 border-t border-coffee-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-coffee-800">Contract:</span>
                <div className="flex items-center space-x-2">
                  {isContractDeployed ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium text-green-800">Deployed</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs font-medium text-red-800">Not Deployed</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;