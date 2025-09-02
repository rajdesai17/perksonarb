'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  CacheManager, 
  OptimisticUpdateManager, 
  BackgroundSync 
} from './cacheStrategies';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './useContract';

/**
 * Comprehensive performance optimization hook
 * This hook manages caching, background sync, and performance monitoring
 */
export function usePerformanceOptimizations() {
  const queryClient = useQueryClient();
  const cacheManagerRef = useRef<CacheManager | null>(null);
  const optimisticManagerRef = useRef<OptimisticUpdateManager | null>(null);
  const backgroundSyncRef = useRef<BackgroundSync | null>(null);

  // Initialize managers
  useEffect(() => {
    cacheManagerRef.current = new CacheManager(queryClient);
    optimisticManagerRef.current = new OptimisticUpdateManager(queryClient);
    backgroundSyncRef.current = new BackgroundSync(queryClient);

    return () => {
      backgroundSyncRef.current?.cleanup();
    };
  }, [queryClient]);

  // Start background sync for real-time updates
  useEffect(() => {
    const backgroundSync = backgroundSyncRef.current;
    if (!backgroundSync) return;

    // Start syncing coffee data every 15 seconds
    const coffeeSync = backgroundSync.startCoffeeSync(
      CONTRACT_ADDRESS, 
      CONTRACT_ABI, 
      15000
    );

    // Start syncing balance data every 30 seconds
    const balanceSync = backgroundSync.startBalanceSync(
      CONTRACT_ADDRESS, 
      CONTRACT_ABI, 
      30000
    );

    return () => {
      clearInterval(coffeeSync);
      clearInterval(balanceSync);
    };
  }, []);

  // Prefetch data on mount
  useEffect(() => {
    const cacheManager = cacheManagerRef.current;
    if (!cacheManager) return;

    // Prefetch coffee data for better initial load
    cacheManager.prefetchCoffeeData(CONTRACT_ADDRESS, CONTRACT_ABI);
  }, []);

  // Performance monitoring
  const getPerformanceStats = useCallback(() => {
    const cacheManager = cacheManagerRef.current;
    if (!cacheManager) return null;

    return cacheManager.getCacheStats();
  }, []);

  // Cache management functions
  const invalidateCoffeeData = useCallback(() => {
    cacheManagerRef.current?.invalidateCoffeeData();
  }, []);

  const invalidateBalanceData = useCallback(() => {
    cacheManagerRef.current?.invalidateBalanceData();
  }, []);

  const clearAllCache = useCallback(() => {
    cacheManagerRef.current?.clearAllCache();
  }, []);

  // Optimistic update functions
  const addOptimisticCoffee = useCallback((coffee: {
    from: `0x${string}`;
    name: string;
    message: string;
    amount: bigint;
  }) => {
    return optimisticManagerRef.current?.addOptimisticCoffee(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      coffee
    );
  }, []);

  const revertOptimisticCoffee = useCallback(() => {
    optimisticManagerRef.current?.revertOptimisticCoffee(
      CONTRACT_ADDRESS,
      CONTRACT_ABI
    );
  }, []);

  return {
    // Performance monitoring
    getPerformanceStats,
    
    // Cache management
    invalidateCoffeeData,
    invalidateBalanceData,
    clearAllCache,
    
    // Optimistic updates
    addOptimisticCoffee,
    revertOptimisticCoffee,
  };
}

/**
 * Hook for component-level performance monitoring
 */
export function useComponentPerformance(componentName: string) {
  const renderStartTime = useRef<number | undefined>(undefined);
  const mountTime = useRef<number | undefined>(undefined);

  useEffect(() => {
    mountTime.current = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} mounted`);
    }

    return () => {
      if (process.env.NODE_ENV === 'development' && mountTime.current) {
        const totalTime = performance.now() - mountTime.current;
        console.log(`${componentName} was mounted for ${totalTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);

  // Track render performance
  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      if (renderTime > 16) { // Warn if render takes longer than 16ms (60fps)
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    }
  });
}

/**
 * Hook for lazy loading optimization
 */
export function useLazyLoading() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const createObserver = useCallback((callback: () => void) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before element comes into view
        threshold: 0.1,
      }
    );

    return observerRef.current;
  }, []);

  const observe = useCallback((element: Element, callback: () => void) => {
    const observer = createObserver(callback);
    observer.observe(element);
  }, [createObserver]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { observe };
}

/**
 * Hook for memory usage monitoring
 */
export function useMemoryMonitoring() {
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };

      // Warn if memory usage is high
      if (usage.used > usage.limit * 0.8) {
        console.warn('High memory usage detected:', usage);
      }

      return usage;
    }
    return null;
  }, []);

  // Monitor memory usage periodically
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(checkMemoryUsage, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [checkMemoryUsage]);

  return { checkMemoryUsage };
}

/**
 * Hook for network performance monitoring
 */
export function useNetworkPerformance() {
  const measureNetworkLatency = useCallback(async () => {
    const start = performance.now();
    
    try {
      // Use a small request to measure network latency
      await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-cache' 
      });
      
      const latency = performance.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Network latency: ${latency.toFixed(2)}ms`);
      }
      
      return latency;
    } catch (error) {
      console.warn('Failed to measure network latency:', error);
      return null;
    }
  }, []);

  return { measureNetworkLatency };
}