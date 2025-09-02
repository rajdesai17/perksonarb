import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { arbitrum, arbitrumSepolia } from 'wagmi/chains';
import contractConfig from './contract.json';
import { securityAuditLog } from './security';

// Contract configuration
export const CONTRACT_ADDRESS = contractConfig.address as `0x${string}`;
export const CONTRACT_ABI = contractConfig.abi;

// Select active chain from environment (default to Arbitrum Sepolia for safety)
const NETWORK = (process.env.NEXT_PUBLIC_NETWORK || 'arbitrumSepolia').toLowerCase();
const ACTIVE_CHAIN = NETWORK === 'arbitrum' ? arbitrum : arbitrumSepolia;
const ACTIVE_CHAIN_ID = ACTIVE_CHAIN.id;

// Coffee struct type for TypeScript
export interface Coffee {
  from: `0x${string}`;
  timestamp: bigint;
  name: string;
  message: string;
  amount: bigint;
}

// Coffee size prices (in wei) - matching the smart contract constants
export const COFFEE_PRICES = {
  small: BigInt('1000000000000000'),   // 0.001 ETH
  medium: BigInt('3000000000000000'),  // 0.003 ETH
  large: BigInt('5000000000000000'),   // 0.005 ETH
} as const

export type CoffeeSize = keyof typeof COFFEE_PRICES

/**
 * Hook to get all coffee purchases from the smart contract
 */
export function useGetAllCoffees() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllCoffees',
    chainId: ACTIVE_CHAIN_ID,
    query: {
      // Cache for 45 seconds, refetch every 30 seconds
      staleTime: 45 * 1000,
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchInterval: 30000,
      // Enable background refetching for real-time updates
      refetchIntervalInBackground: true,
      // Retry on failure with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry if it's a contract/network error
        if (error?.message?.includes('contract') || error?.message?.includes('network')) {
          return failureCount < 2;
        }
        return failureCount < 3;
      },
    }
  });
}

/**
 * Hook to buy coffee with enhanced transaction handling and optimistic updates
 */
export function useBuyCoffee() {
  const { 
    writeContract, 
    data: hash, 
    isPending,
    error: writeError,
    reset,
    ...rest 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: receiptError
  } = useWaitForTransactionReceipt({ 
    hash,
    query: {
      enabled: !!hash,
      // Retry transaction receipt checks
      retry: 5,
      retryDelay: 2000,
    }
  });

  const buyCoffee = (name: string, message: string, value: bigint, userAddress?: `0x${string}`) => {
    // Reset any previous errors before starting new transaction
    reset();
    
    try {
      // Log transaction attempt for security monitoring
      securityAuditLog.log(
        'contract_interaction_attempt',
        'low',
        {
          functionName: 'buyCoffee',
          value: value.toString(),
          nameLength: name.length,
          messageLength: message.length,
          timestamp: new Date().toISOString(),
        }
      );

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'buyCoffee',
        args: [name, message],
        value,
        chainId: ACTIVE_CHAIN_ID,
        // Add gas estimation buffer
        gas: undefined, // Let wagmi estimate
      });
    } catch (error) {
      console.error('Error initiating coffee purchase:', error);
      
      // Log contract interaction error
      securityAuditLog.log(
        'contract_interaction_error',
        'medium',
        {
          functionName: 'buyCoffee',
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        }
      );
    }
  };

  // Combine and prioritize errors
  const combinedError = writeError || receiptError;

  return {
    buyCoffee,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: combinedError,
    reset,
    ...rest
  };
}

/**
 * Hook to get the contract balance
 */
export function useGetBalance() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getBalance',
    chainId: ACTIVE_CHAIN_ID,
    query: {
      // Cache balance for 15 seconds, refetch every 10 seconds
      staleTime: 15 * 1000,
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchInterval: 10000,
      refetchIntervalInBackground: true,
      // Balance queries are less critical, fewer retries
      retry: 2,
    }
  });
}

/**
 * Hook to get recent coffee purchases (last 10)
 */
export function useGetRecentCoffees() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getRecentCoffees',
    chainId: ACTIVE_CHAIN_ID,
    query: {
      // Cache recent coffees for 20 seconds, refetch every 15 seconds
      staleTime: 20 * 1000,
      gcTime: 8 * 60 * 1000, // Keep in cache for 8 minutes
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
      // Recent coffees are important for UX, more retries
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    }
  });
}

/**
 * Hook to register a creator
 */
export function useRegisterCreator() {
  const { 
    writeContract, 
    data: hash, 
    isPending,
    error: writeError,
    reset,
    ...rest 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: receiptError
  } = useWaitForTransactionReceipt({ 
    hash,
    query: {
      enabled: !!hash,
      retry: 5,
      retryDelay: 2000,
    }
  });

  const registerCreator = (username: string) => {
    reset();
    
    try {
      securityAuditLog.log(
        'contract_interaction_attempt',
        'low',
        {
          functionName: 'registerCreator',
          username,
          timestamp: new Date().toISOString(),
        }
      );

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'registerCreator',
        args: [username],
        chainId: ACTIVE_CHAIN_ID,
      });
    } catch (error) {
      console.error('Error initiating creator registration:', error);
      
      securityAuditLog.log(
        'contract_interaction_error',
        'medium',
        {
          functionName: 'registerCreator',
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        }
      );
    }
  };

  const combinedError = writeError || receiptError;

  return {
    registerCreator,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error: combinedError,
    reset,
    ...rest
  };
}
