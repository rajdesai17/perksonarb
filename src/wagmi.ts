import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, arbitrumSepolia } from 'wagmi/chains';

// Prevent multiple WalletConnect initializations
let wagmiConfig: any = null;

export function getWagmiConfig() {
  if (!wagmiConfig) {
    // Use a proper project ID or generate one for development
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 
                     '841390fd2274e8cc0217a585ce26d907';
    
    wagmiConfig = getDefaultConfig({
      appName: 'Buy Me a Coffee Dapp',
      projectId,
      chains: [arbitrum, arbitrumSepolia],
      ssr: true,

    });
  }
  return wagmiConfig;
}

export const config = getWagmiConfig();
