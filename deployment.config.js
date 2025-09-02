/**
 * Deployment Configuration for Buy Me a Coffee Dapp
 * This file contains network-specific configurations for deployment
 */

const deploymentConfig = {
  // Arbitrum Sepolia Testnet Configuration
  testnet: {
    networkName: 'arbitrumSepolia',
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    explorerApiUrl: 'https://api-sepolia.arbiscan.io/api',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    // Testnet contract addresses (to be updated after deployment)
    contracts: {
      buyMeACoffee: '0x0000000000000000000000000000000000000000'
    },
    // Gas settings for testnet
    gasSettings: {
      gasPrice: '100000000', // 0.1 gwei
      gasLimit: '500000'
    }
  },

  // Arbitrum One Mainnet Configuration
  mainnet: {
    networkName: 'arbitrumOne',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    explorerApiUrl: 'https://api.arbiscan.io/api',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    // Mainnet contract addresses (to be updated after deployment)
    contracts: {
      buyMeACoffee: '0x0000000000000000000000000000000000000000'
    },
    // Gas settings for mainnet
    gasSettings: {
      gasPrice: '100000000', // 0.1 gwei
      gasLimit: '500000'
    }
  },

  // Deployment settings
  deployment: {
    // Contract constructor parameters
    constructorArgs: {
      // Initial owner will be the deployer address
      initialOwner: null // Will be set to deployer address during deployment
    },
    
    // Verification settings
    verification: {
      enabled: true,
      retries: 3,
      delay: 30000 // 30 seconds delay before verification
    },

    // Post-deployment actions
    postDeploy: {
      updateContractConfig: true,
      updateEnvironmentVars: true,
      runTests: true
    }
  },

  // Frontend build settings
  frontend: {
    // Environment-specific settings
    production: {
      enableTestnets: false,
      enableAnalytics: true,
      enableErrorReporting: true,
      optimizeBundle: true
    },
    staging: {
      enableTestnets: true,
      enableAnalytics: false,
      enableErrorReporting: true,
      optimizeBundle: true
    },
    development: {
      enableTestnets: true,
      enableAnalytics: false,
      enableErrorReporting: false,
      optimizeBundle: false
    }
  }
};

module.exports = deploymentConfig;