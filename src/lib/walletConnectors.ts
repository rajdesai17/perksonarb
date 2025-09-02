'use client';

import { Connector } from 'wagmi';

/**
 * Lazy-loaded wallet connectors for better performance
 * This reduces the initial bundle size by loading wallet connectors only when needed
 */

// Cache for loaded connectors
const connectorCache = new Map<string, Promise<any>>();

/**
 * Lazy load MetaMask connector
 */
export const loadMetaMaskConnector = async () => {
  if (connectorCache.has('metamask')) {
    return connectorCache.get('metamask');
  }

  const promise = import('@rainbow-me/rainbowkit/wallets').then(
    ({ metaMaskWallet }) => metaMaskWallet
  );
  
  connectorCache.set('metamask', promise);
  return promise;
};

/**
 * Lazy load WalletConnect connector
 */
export const loadWalletConnectConnector = async () => {
  if (connectorCache.has('walletconnect')) {
    return connectorCache.get('walletconnect');
  }

  const promise = import('@rainbow-me/rainbowkit/wallets').then(
    ({ walletConnectWallet }) => walletConnectWallet
  );
  
  connectorCache.set('walletconnect', promise);
  return promise;
};

/**
 * Lazy load Coinbase Wallet connector
 */
export const loadCoinbaseConnector = async () => {
  if (connectorCache.has('coinbase')) {
    return connectorCache.get('coinbase');
  }

  const promise = import('@rainbow-me/rainbowkit/wallets').then(
    ({ coinbaseWallet }) => coinbaseWallet
  );
  
  connectorCache.set('coinbase', promise);
  return promise;
};

/**
 * Lazy load Rainbow Wallet connector
 */
export const loadRainbowConnector = async () => {
  if (connectorCache.has('rainbow')) {
    return connectorCache.get('rainbow');
  }

  const promise = import('@rainbow-me/rainbowkit/wallets').then(
    ({ rainbowWallet }) => rainbowWallet
  );
  
  connectorCache.set('rainbow', promise);
  return promise;
};

/**
 * Lazy load Injected Wallet connector
 */
export const loadInjectedConnector = async () => {
  if (connectorCache.has('injected')) {
    return connectorCache.get('injected');
  }

  const promise = import('@rainbow-me/rainbowkit/wallets').then(
    ({ injectedWallet }) => injectedWallet
  );
  
  connectorCache.set('injected', promise);
  return promise;
};

/**
 * Preload popular wallet connectors
 * Call this function to preload connectors that are likely to be used
 */
export const preloadPopularConnectors = async () => {
  // Preload MetaMask and WalletConnect as they are most popular
  const promises = [
    loadMetaMaskConnector(),
    loadWalletConnectConnector(),
  ];

  try {
    await Promise.all(promises);
    console.log('Popular wallet connectors preloaded');
  } catch (error) {
    console.warn('Failed to preload some wallet connectors:', error);
  }
};

/**
 * Load all wallet connectors
 * Use this when you need all connectors available
 */
export const loadAllConnectors = async () => {
  const promises = [
    loadMetaMaskConnector(),
    loadWalletConnectConnector(),
    loadCoinbaseConnector(),
    loadRainbowConnector(),
    loadInjectedConnector(),
  ];

  try {
    const connectors = await Promise.all(promises);
    console.log('All wallet connectors loaded');
    return connectors;
  } catch (error) {
    console.error('Failed to load wallet connectors:', error);
    throw error;
  }
};

/**
 * Detect available wallets in the browser
 * This helps prioritize which connectors to load first
 */
export const detectAvailableWallets = () => {
  const available = {
    metamask: false,
    coinbase: false,
    rainbow: false,
    injected: false,
  };

  if (typeof window !== 'undefined') {
    // Check for MetaMask
    available.metamask = !!(window as any).ethereum?.isMetaMask;
    
    // Check for Coinbase Wallet
    available.coinbase = !!(window as any).ethereum?.isCoinbaseWallet;
    
    // Check for Rainbow
    available.rainbow = !!(window as any).ethereum?.isRainbow;
    
    // Check for any injected wallet
    available.injected = !!(window as any).ethereum;
  }

  return available;
};

/**
 * Smart connector loading based on detected wallets
 * This loads only the connectors for wallets that are actually available
 */
export const loadSmartConnectors = async () => {
  const available = detectAvailableWallets();
  const promises: Promise<any>[] = [];

  // Always load WalletConnect as it works universally
  promises.push(loadWalletConnectConnector());

  // Load specific connectors based on what's available
  if (available.metamask) {
    promises.push(loadMetaMaskConnector());
  }
  
  if (available.coinbase) {
    promises.push(loadCoinbaseConnector());
  }
  
  if (available.rainbow) {
    promises.push(loadRainbowConnector());
  }
  
  // If no specific wallet detected but ethereum is available, load injected
  if (available.injected && !available.metamask && !available.coinbase && !available.rainbow) {
    promises.push(loadInjectedConnector());
  }

  try {
    const connectors = await Promise.all(promises);
    console.log('Smart connectors loaded based on available wallets');
    return connectors;
  } catch (error) {
    console.error('Failed to load smart connectors:', error);
    // Fallback to basic connectors
    return [await loadWalletConnectConnector(), await loadInjectedConnector()];
  }
};

/**
 * Connector performance monitoring
 */
export class ConnectorPerformanceMonitor {
  private loadTimes = new Map<string, number>();
  private connectionTimes = new Map<string, number>();

  /**
   * Track connector load time
   */
  trackLoadTime(connectorName: string, startTime: number) {
    const loadTime = performance.now() - startTime;
    this.loadTimes.set(connectorName, loadTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${connectorName} connector loaded in ${loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Track connection time
   */
  trackConnectionTime(connectorName: string, startTime: number) {
    const connectionTime = performance.now() - startTime;
    this.connectionTimes.set(connectorName, connectionTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${connectorName} connected in ${connectionTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance stats
   */
  getStats() {
    return {
      loadTimes: Object.fromEntries(this.loadTimes),
      connectionTimes: Object.fromEntries(this.connectionTimes),
      averageLoadTime: this.calculateAverage(this.loadTimes),
      averageConnectionTime: this.calculateAverage(this.connectionTimes),
    };
  }

  private calculateAverage(map: Map<string, number>): number {
    if (map.size === 0) return 0;
    const sum = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return sum / map.size;
  }
}

// Global performance monitor instance
export const connectorPerformanceMonitor = new ConnectorPerformanceMonitor();