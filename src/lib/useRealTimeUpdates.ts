'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWatchContractEvent, useBlockNumber } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './useContract';

/**
 * Enhanced real-time updates with multiple fallback strategies
 */
export function useRealTimeUpdates() {
  const queryClient = useQueryClient();
  const lastUpdateRef = useRef<number>(0);
  const updateThrottleRef = useRef<NodeJS.Timeout | null>(null);

  // Throttled invalidation to prevent excessive updates
  const throttledInvalidation = useCallback(() => {
    if (updateThrottleRef.current) {
      clearTimeout(updateThrottleRef.current);
    }

    updateThrottleRef.current = setTimeout(() => {
      const now = Date.now();
      
      // Only update if it's been at least 2 seconds since last update
      if (now - lastUpdateRef.current > 2000) {
        lastUpdateRef.current = now;
        
        console.log('Invalidating coffee data due to real-time update');
        
        // Invalidate coffee-related queries
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey as any[];
            return queryKey.some(key => 
              typeof key === 'object' && 
              key?.functionName && 
              (key.functionName === 'getAllCoffees' || 
               key.functionName === 'getRecentCoffees' ||
               key.functionName === 'getBalance')
            );
          },
        });
      }
    }, 500); // 500ms debounce
  }, [queryClient]);

  // Primary: Watch for NewCoffee events from the smart contract
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'NewCoffee',
    onLogs: (logs) => {
      console.log('New coffee purchase detected via event:', logs);
      throttledInvalidation();
    },
    // Enable polling as fallback for networks that don't support event subscriptions
    poll: true,
    pollingInterval: 8000, // Poll every 8 seconds as fallback
  });

  // Secondary: Watch for block number changes as additional fallback
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    query: {
      refetchInterval: 12000, // Check every 12 seconds
    },
  });

  useEffect(() => {
    if (blockNumber) {
      // On new blocks, occasionally refresh data (every 3rd block approximately)
      if (blockNumber % 3n === 0n) {
        throttledInvalidation();
      }
    }
  }, [blockNumber, throttledInvalidation]);

  // Tertiary: Page visibility and focus handling
  useEffect(() => {
    const handleFocus = () => {
      console.log('Page focused - refreshing coffee data');
      throttledInvalidation();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible - refreshing coffee data');
        throttledInvalidation();
      }
    };

    // Online/offline handling
    const handleOnline = () => {
      console.log('Connection restored - refreshing coffee data');
      throttledInvalidation();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      
      if (updateThrottleRef.current) {
        clearTimeout(updateThrottleRef.current);
      }
    };
  }, [throttledInvalidation]);

  // Quaternary: Periodic background refresh (when page is active)
  useEffect(() => {
    const backgroundRefresh = setInterval(() => {
      if (!document.hidden && document.hasFocus()) {
        console.log('Background refresh - updating coffee data');
        throttledInvalidation();
      }
    }, 30000); // Every 30 seconds when active

    return () => clearInterval(backgroundRefresh);
  }, [throttledInvalidation]);
}

/**
 * Enhanced optimistic updates with rollback capability
 */
export function useOptimisticUpdates() {
  const queryClient = useQueryClient();
  const rollbackDataRef = useRef<Map<string, any>>(new Map());

  const addOptimisticCoffee = useCallback((coffee: {
    from: `0x${string}`;
    name: string;
    message: string;
    amount: bigint;
  }) => {
    const optimisticCoffee = {
      ...coffee,
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      isOptimistic: true, // Mark as optimistic for UI feedback
    };

    const recentCoffeesKey = ['readContract', { 
      address: CONTRACT_ADDRESS, 
      abi: CONTRACT_ABI, 
      functionName: 'getRecentCoffees' 
    }];

    const allCoffeesKey = ['readContract', { 
      address: CONTRACT_ADDRESS, 
      abi: CONTRACT_ABI, 
      functionName: 'getAllCoffees' 
    }];

    // Store rollback data
    const recentCoffeesRollback = queryClient.getQueryData(recentCoffeesKey);
    const allCoffeesRollback = queryClient.getQueryData(allCoffeesKey);
    
    rollbackDataRef.current.set('recentCoffees', recentCoffeesRollback);
    rollbackDataRef.current.set('allCoffees', allCoffeesRollback);

    // Add optimistic updates
    queryClient.setQueryData(recentCoffeesKey, (oldData: any) => {
      if (!oldData) return [optimisticCoffee];
      return [optimisticCoffee, ...oldData.slice(0, 9)]; // Keep only 10 items
    });

    queryClient.setQueryData(allCoffeesKey, (oldData: any) => {
      if (!oldData) return [optimisticCoffee];
      return [optimisticCoffee, ...oldData];
    });

    console.log('Added optimistic coffee update');
    return optimisticCoffee;
  }, [queryClient]);

  const confirmOptimisticCoffee = useCallback(() => {
    // Clear rollback data on successful confirmation
    rollbackDataRef.current.clear();
    
    // Remove optimistic flag from cached data
    const recentCoffeesKey = ['readContract', { 
      address: CONTRACT_ADDRESS, 
      abi: CONTRACT_ABI, 
      functionName: 'getRecentCoffees' 
    }];

    queryClient.setQueryData(recentCoffeesKey, (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.map((coffee: any) => ({
        ...coffee,
        isOptimistic: false
      }));
    });

    console.log('Confirmed optimistic coffee update');
  }, [queryClient]);

  const removeOptimisticCoffee = useCallback(() => {
    console.log('Rolling back optimistic coffee update');
    
    // Restore from rollback data
    const recentCoffeesRollback = rollbackDataRef.current.get('recentCoffees');
    const allCoffeesRollback = rollbackDataRef.current.get('allCoffees');

    if (recentCoffeesRollback !== undefined) {
      queryClient.setQueryData(['readContract', { 
        address: CONTRACT_ADDRESS, 
        abi: CONTRACT_ABI, 
        functionName: 'getRecentCoffees' 
      }], recentCoffeesRollback);
    }

    if (allCoffeesRollback !== undefined) {
      queryClient.setQueryData(['readContract', { 
        address: CONTRACT_ADDRESS, 
        abi: CONTRACT_ABI, 
        functionName: 'getAllCoffees' 
      }], allCoffeesRollback);
    }

    // Clear rollback data
    rollbackDataRef.current.clear();
  }, [queryClient]);

  return {
    addOptimisticCoffee,
    confirmOptimisticCoffee,
    removeOptimisticCoffee,
  };
}

/**
 * Real-time performance monitoring for updates
 */
export function useRealTimePerformance() {
  const updateTimesRef = useRef<number[]>([]);
  const lastEventTimeRef = useRef<number>(0);

  const trackUpdatePerformance = useCallback((eventType: string) => {
    const now = performance.now();
    const timeSinceLastEvent = now - lastEventTimeRef.current;
    
    updateTimesRef.current.push(timeSinceLastEvent);
    
    // Keep only last 10 measurements
    if (updateTimesRef.current.length > 10) {
      updateTimesRef.current.shift();
    }
    
    lastEventTimeRef.current = now;
    
    if (process.env.NODE_ENV === 'development') {
      const avgUpdateTime = updateTimesRef.current.reduce((a, b) => a + b, 0) / updateTimesRef.current.length;
      console.log(`Real-time update (${eventType}): ${timeSinceLastEvent.toFixed(2)}ms, avg: ${avgUpdateTime.toFixed(2)}ms`);
    }
  }, []);

  const getUpdateStats = useCallback(() => {
    if (updateTimesRef.current.length === 0) return null;
    
    const times = updateTimesRef.current;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return { avg, min, max, count: times.length };
  }, []);

  return { trackUpdatePerformance, getUpdateStats };
}

