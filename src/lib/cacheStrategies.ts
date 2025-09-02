'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * Advanced caching strategies for blockchain data
 */

// Cache keys for different types of data
export const CACHE_KEYS = {
  COFFEE_LIST: 'coffee-list',
  RECENT_COFFEES: 'recent-coffees',
  CONTRACT_BALANCE: 'contract-balance',
  USER_BALANCE: 'user-balance',
  NETWORK_STATUS: 'network-status',
} as const;

// Cache durations in milliseconds
export const CACHE_DURATIONS = {
  // Coffee data changes frequently, shorter cache
  COFFEE_DATA: 30 * 1000, // 30 seconds
  // Balance data changes less frequently
  BALANCE_DATA: 60 * 1000, // 1 minute
  // Network status rarely changes
  NETWORK_DATA: 5 * 60 * 1000, // 5 minutes
  // Static contract data
  CONTRACT_DATA: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Create optimized query client with advanced caching
 */
export function createOptimizedQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Global cache settings
        staleTime: CACHE_DURATIONS.COFFEE_DATA,
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        
        // Retry configuration with exponential backoff
        retry: (failureCount, error) => {
          // Don't retry certain types of errors
          const errorMessage = error?.message?.toLowerCase() || '';
          
          if (
            errorMessage.includes('user rejected') ||
            errorMessage.includes('user denied') ||
            errorMessage.includes('cancelled')
          ) {
            return false;
          }
          
          // Retry network/contract errors up to 3 times
          return failureCount < 3;
        },
        
        retryDelay: (attemptIndex) => {
          // Exponential backoff: 1s, 2s, 4s, max 30s
          return Math.min(1000 * 2 ** attemptIndex, 30000);
        },
        
        // Background refetching for real-time feel
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchInterval: false, // Controlled per query
        
        // Network mode for offline support
        networkMode: 'online',
      },
      mutations: {
        // Retry failed transactions
        retry: 1,
        networkMode: 'online',
      },
    },
  });
}

/**
 * Cache invalidation strategies
 */
export class CacheManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invalidate all coffee-related data
   */
  invalidateCoffeeData() {
    this.queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey as any[];
        return queryKey.some(key => 
          typeof key === 'object' && 
          key?.functionName && 
          (key.functionName === 'getAllCoffees' || 
           key.functionName === 'getRecentCoffees')
        );
      },
    });
  }

  /**
   * Invalidate balance data
   */
  invalidateBalanceData() {
    this.queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey as any[];
        return queryKey.some(key => 
          typeof key === 'object' && 
          key?.functionName && 
          key.functionName === 'getBalance'
        );
      },
    });
  }

  /**
   * Prefetch coffee data for better performance
   */
  async prefetchCoffeeData(contractAddress: string, abi: any) {
    // Prefetch recent coffees
    await this.queryClient.prefetchQuery({
      queryKey: ['readContract', { 
        address: contractAddress, 
        abi, 
        functionName: 'getRecentCoffees' 
      }],
      staleTime: CACHE_DURATIONS.COFFEE_DATA,
    });

    // Prefetch contract balance
    await this.queryClient.prefetchQuery({
      queryKey: ['readContract', { 
        address: contractAddress, 
        abi, 
        functionName: 'getBalance' 
      }],
      staleTime: CACHE_DURATIONS.BALANCE_DATA,
    });
  }

  /**
   * Clear all cache data
   */
  clearAllCache() {
    this.queryClient.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      staleQueries: queries.filter(q => q.isStale()).length,
      cacheSize: this.estimateCacheSize(queries),
    };
  }

  private estimateCacheSize(queries: any[]): string {
    // Rough estimation of cache size
    const totalEntries = queries.reduce((total, query) => {
      return total + (query.state.data ? 1 : 0);
    }, 0);
    
    // Estimate ~1KB per entry (very rough)
    const estimatedKB = totalEntries * 1;
    
    if (estimatedKB > 1024) {
      return `${(estimatedKB / 1024).toFixed(1)} MB`;
    }
    return `${estimatedKB} KB`;
  }
}

/**
 * Optimistic update helpers
 */
export class OptimisticUpdateManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Add optimistic coffee purchase
   */
  addOptimisticCoffee(
    contractAddress: string,
    abi: any,
    coffee: {
      from: `0x${string}`;
      name: string;
      message: string;
      amount: bigint;
    }
  ) {
    const optimisticCoffee = {
      ...coffee,
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
    };

    // Update recent coffees
    this.queryClient.setQueryData(
      ['readContract', { 
        address: contractAddress, 
        abi, 
        functionName: 'getRecentCoffees' 
      }],
      (oldData: any) => {
        if (!oldData) return [optimisticCoffee];
        return [optimisticCoffee, ...oldData.slice(0, 9)];
      }
    );

    // Update all coffees
    this.queryClient.setQueryData(
      ['readContract', { 
        address: contractAddress, 
        abi, 
        functionName: 'getAllCoffees' 
      }],
      (oldData: any) => {
        if (!oldData) return [optimisticCoffee];
        return [optimisticCoffee, ...oldData];
      }
    );

    return optimisticCoffee;
  }

  /**
   * Revert optimistic update on failure
   */
  revertOptimisticCoffee(contractAddress: string, abi: any) {
    // Simply invalidate to refetch real data
    this.queryClient.invalidateQueries({
      queryKey: ['readContract', { 
        address: contractAddress, 
        abi, 
        functionName: 'getRecentCoffees' 
      }],
    });

    this.queryClient.invalidateQueries({
      queryKey: ['readContract', { 
        address: contractAddress, 
        abi, 
        functionName: 'getAllCoffees' 
      }],
    });
  }
}

/**
 * Background sync for real-time updates
 */
export class BackgroundSync {
  private intervals: NodeJS.Timeout[] = [];

  constructor(private queryClient: QueryClient) {}

  /**
   * Start background sync for coffee data
   */
  startCoffeeSync(contractAddress: string, abi: any, intervalMs = 15000) {
    const interval = setInterval(() => {
      // Only sync if page is visible
      if (!document.hidden) {
        this.queryClient.invalidateQueries({
          queryKey: ['readContract', { 
            address: contractAddress, 
            abi, 
            functionName: 'getRecentCoffees' 
          }],
        });
      }
    }, intervalMs);

    this.intervals.push(interval);
    return interval;
  }

  /**
   * Start background sync for balance data
   */
  startBalanceSync(contractAddress: string, abi: any, intervalMs = 30000) {
    const interval = setInterval(() => {
      if (!document.hidden) {
        this.queryClient.invalidateQueries({
          queryKey: ['readContract', { 
            address: contractAddress, 
            abi, 
            functionName: 'getBalance' 
          }],
        });
      }
    }, intervalMs);

    this.intervals.push(interval);
    return interval;
  }

  /**
   * Stop all background sync
   */
  stopAllSync() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  /**
   * Cleanup on unmount
   */
  cleanup() {
    this.stopAllSync();
  }
}