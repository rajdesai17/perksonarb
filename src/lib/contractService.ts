import { ethers } from 'ethers';
import { createPublicClient, http, getContract } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

// Import the simple MVP contract ABI
const SimpleBuyMeACoffeeArtifact = require('../../artifacts/contracts/SimpleBuyMeACoffee.sol/SimpleBuyMeACoffee.json');

// Contract ABIs and addresses
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x4CAbc1d52830ad9e6d3773f05504a804c1152ed5';
const CONTRACT_ABI = SimpleBuyMeACoffeeArtifact.abi;

// Check if contract is deployed
const isContractDeployed = () => {
  return CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '';
};

// Create a public client for read operations
const getPublicClient = () => {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc')
  });
};

// Get read-only contract instance using viem
const getReadOnlyContract = () => {
  const publicClient = getPublicClient();
  console.log('🔍 Contract Service Debug:');
  console.log('  Contract Address:', CONTRACT_ADDRESS);
  console.log('  Network:', arbitrumSepolia.name);
  
  return getContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    client: publicClient,
  });
};

// Contract interaction functions
export const contractService = {
  // Register a creator - This should be handled by wagmi hooks in components
  async registerCreator(username: string): Promise<boolean> {
    console.warn('registerCreator should be called via wagmi hooks in components');
    throw new Error('Use wagmi useWriteContract hook for write operations');
  },

  // Buy coffee for any creator - This should be handled by wagmi hooks in components
  async buyCoffee(username: string, message: string, amount: string): Promise<boolean> {
    console.warn('buyCoffee should be called via wagmi hooks in components');
    throw new Error('Use wagmi useWriteContract hook for write operations');
  },

  // Check if username is available
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      if (!isContractDeployed()) {
        console.error('Contract not deployed');
        return false;
      }
      
      const contract = getReadOnlyContract();
      console.log('🔍 Calling isUsernameAvailable for:', username);
      const result = await contract.read.isUsernameAvailable([username]);
      console.log('✅ Username availability result:', result);
      return result as boolean;
    } catch (error) {
      console.error('❌ Error checking username availability:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        name: (error as Error).name,
        stack: (error as Error).stack
      });
      return false;
    }
  },

  // Get coffees for a specific creator
  async getCoffeesForCreator(username: string): Promise<any[]> {
    try {
      const contract = getReadOnlyContract();
      const coffees = await contract.read.getCoffeesForCreator([username]) as any[];

      return coffees.map((coffee: any, index: number) => ({
        id: index,
        creatorUsername: coffee.creatorUsername,
        supporter: coffee.supporter,
        message: coffee.message,
        timestamp: Number(coffee.timestamp),
        amount: ethers.formatEther(coffee.amount)
      }));
    } catch (error) {
      console.error('Error getting coffees for creator:', error);
      return [];
    }
  },

  // Get recent coffees for a creator
  async getRecentCoffeesForCreator(username: string, limit: number = 10): Promise<any[]> {
    try {
      if (!isContractDeployed()) {
        console.log('Contract not deployed yet, returning empty array');
        return [];
      }

      const contract = getReadOnlyContract();
      const coffees = await contract.read.getRecentCoffeesForCreator([username, limit]) as any[];

      return coffees.map((coffee: any, index: number) => ({
        id: index,
        creatorUsername: coffee.creatorUsername,
        supporter: coffee.supporter,
        message: coffee.message,
        timestamp: Number(coffee.timestamp),
        amount: ethers.formatEther(coffee.amount)
      }));
    } catch (error) {
      console.error('Error getting recent coffees:', error);
      return [];
    }
  },

  // Get total coffees for a creator
  async getTotalCoffeesForCreator(username: string): Promise<number> {
    try {
      if (!isContractDeployed()) {
        return 0;
      }

      const contract = getReadOnlyContract();
      const count = await contract.read.getTotalCoffeesForCreator([username]);
      return Number(count);
    } catch (error) {
      console.error('Error getting total coffees:', error);
      return 0;
    }
  },

  // Get total amount raised for a creator
  async getTotalRaisedForCreator(username: string): Promise<string> {
    try {
      if (!isContractDeployed()) {
        return '0';
      }

      const contract = getReadOnlyContract();
      const total = await contract.read.getTotalRaisedForCreator([username]) as bigint;
      return ethers.formatEther(total);
    } catch (error) {
      console.error('Error getting total raised:', error);
      return '0';
    }
  },

  // Get creator info
  async getCreatorInfo(username: string): Promise<any> {
    try {
      const contract = getReadOnlyContract();
      const info = await contract.read.getCreatorInfo([username]) as any;
      return {
        wallet: info.wallet,
        username: info.username,
        registeredAt: Number(info.registeredAt),
        exists: info.exists
      };
    } catch (error) {
      console.error('Error getting creator info:', error);
      return null;
    }
  },

  // Get total number of coffees (all time)
  async getTotalCoffees(): Promise<number> {
    try {
      const contract = getReadOnlyContract();
      const count = await contract.read.getTotalCoffees([]) as bigint;
      return Number(count);
    } catch (error) {
      console.error('Error getting total coffees:', error);
      return 0;
    }
  },

  // Get all coffees (for admin/stats)
  async getAllCoffees(): Promise<any[]> {
    try {
      const contract = getReadOnlyContract();
      const coffees = await contract.read.getAllCoffees([]) as any[];

      return coffees.map((coffee: any, index: number) => ({
        id: index,
        creatorUsername: coffee.creatorUsername,
        supporter: coffee.supporter,
        message: coffee.message,
        timestamp: Number(coffee.timestamp),
        amount: ethers.formatEther(coffee.amount)
      }));
    } catch (error) {
      console.error('Error getting all coffees:', error);
      return [];
    }
  }
};
