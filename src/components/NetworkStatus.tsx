'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { arbitrum, arbitrumSepolia } from 'wagmi/chains';

const NetworkStatus: React.FC = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [isOnline, setIsOnline] = useState(true);
  const [networkHealth, setNetworkHealth] = useState<'good' | 'slow' | 'poor'>('good');

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simple network health check (could be enhanced with actual RPC calls)
  useEffect(() => {
    if (!isOnline) {
      setNetworkHealth('poor');
      return;
    }

    const checkNetworkHealth = async () => {
      const start = Date.now();
      try {
        // Simple connectivity test
        await fetch('https://arb1.arbitrum.io/rpc', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          })
        });
        
        const responseTime = Date.now() - start;
        if (responseTime < 1000) {
          setNetworkHealth('good');
        } else if (responseTime < 3000) {
          setNetworkHealth('slow');
        } else {
          setNetworkHealth('poor');
        }
      } catch {
        setNetworkHealth('poor');
      }
    };

    checkNetworkHealth();
    const interval = setInterval(checkNetworkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline]);

  const getNetworkName = () => {
    if (chainId === arbitrum.id) return 'Arbitrum One';
    if (chainId === arbitrumSepolia.id) return 'Arbitrum Sepolia';
    return 'Unknown Network';
  };

  const getNetworkStatus = () => {
    if (!isOnline) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        dotColor: 'bg-red-500',
        text: 'Offline',
        description: 'No internet connection'
      };
    }

    if (!isConnected) {
      return {
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        dotColor: 'bg-gray-400',
        text: 'Not Connected',
        description: 'Wallet not connected'
      };
    }

    if (chainId !== arbitrum.id && chainId !== arbitrumSepolia.id) {
      return {
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        dotColor: 'bg-amber-500',
        text: 'Wrong Network',
        description: 'Please switch to Arbitrum'
      };
    }

    switch (networkHealth) {
      case 'good':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          dotColor: 'bg-green-500',
          text: 'Connected',
          description: `${getNetworkName()} - Good connection`
        };
      case 'slow':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          dotColor: 'bg-yellow-500',
          text: 'Slow Connection',
          description: `${getNetworkName()} - Network congested`
        };
      case 'poor':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          dotColor: 'bg-red-500',
          text: 'Poor Connection',
          description: `${getNetworkName()} - Connection issues`
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          dotColor: 'bg-gray-400',
          text: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  const status = getNetworkStatus();

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
      <div className={`w-2 h-2 rounded-full ${status.dotColor} ${networkHealth === 'good' ? 'animate-pulse' : ''}`}></div>
      <span className="hidden sm:inline">{status.text}</span>
      <span className="sm:hidden">●</span>
      <span className="hidden md:inline text-xs opacity-75">
        {status.description}
      </span>
    </div>
  );
};

export default NetworkStatus;