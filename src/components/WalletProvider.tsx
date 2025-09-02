'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { getWagmiConfig } from '../wagmi';
import { useState, useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { WalletSync } from './WalletSync';

interface WalletProviderProps {
  children: React.ReactNode;
}

// Global instances to prevent recreation
let globalQueryClient: QueryClient | null = null;
let globalConfig: any = null;

export function WalletProvider({ children }: WalletProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Create QueryClient only once
  const queryClient = useMemo(() => {
    if (!globalQueryClient) {
      globalQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      });
    }
    return globalQueryClient;
  }, []);

  // Create config only once
  const config = useMemo(() => {
    if (!globalConfig) {
      globalConfig = getWagmiConfig();
    }
    return globalConfig;
  }, []);

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
    
    // Cleanup function
    return () => {
      // Don't actually cleanup the global instances here
      // as they should persist across re-renders
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Provider store={store}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <WalletSync />
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </Provider>
  );
}
