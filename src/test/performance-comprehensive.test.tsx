import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '../wagmi';
import { createOptimizedQueryClient } from '../lib/cacheStrategies';
import { usePerformanceOptimizations } from '../lib/usePerformanceOptimizations';
import { useRealTimeUpdates, useOptimisticUpdates } from '../lib/useRealTimeUpdates';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    totalJSHeapSize: 1024 * 1024 * 20, // 20MB
    jsHeapSizeLimit: 1024 * 1024 * 100, // 100MB
  },
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Test component that uses performance hooks
function TestComponent() {
  const { getPerformanceStats, addOptimisticCoffee } = usePerformanceOptimizations();
  useRealTimeUpdates();
  
  const handleOptimisticUpdate = () => {
    addOptimisticCoffee({
      from: '0x1234567890123456789012345678901234567890',
      name: 'Test User',
      message: 'Test message',
      amount: BigInt('1000000000000000'), // 0.001 ETH
    });
  };

  return (
    <div>
      <button onClick={handleOptimisticUpdate}>Add Optimistic Coffee</button>
      <div data-testid="performance-stats">
        {JSON.stringify(getPerformanceStats())}
      </div>
    </div>
  );
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createOptimizedQueryClient();
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

describe('Performance Optimizations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createOptimizedQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Cache Strategies', () => {
    it('should create optimized query client with correct settings', () => {
      const client = createOptimizedQueryClient();
      
      expect(client).toBeDefined();
      expect(client.getDefaultOptions().queries?.staleTime).toBe(30000); // 30 seconds
      expect(client.getDefaultOptions().queries?.gcTime).toBe(600000); // 10 minutes
    });

    it('should handle cache invalidation efficiently', async () => {
      const startTime = performance.now();
      
      // Simulate cache invalidation
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as any[];
          return queryKey.some(key => 
            typeof key === 'object' && 
            key?.functionName === 'getAllCoffees'
          );
        },
      });
      
      const endTime = performance.now();
      const invalidationTime = endTime - startTime;
      
      // Cache invalidation should be fast (< 10ms)
      expect(invalidationTime).toBeLessThan(10);
    });

    it('should implement proper retry logic', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const retryFn = defaultOptions.queries?.retry as Function;
      
      // Should not retry user rejection errors
      expect(retryFn(1, { message: 'user rejected' })).toBe(false);
      expect(retryFn(1, { message: 'user denied' })).toBe(false);
      
      // Should retry network errors up to 3 times
      expect(retryFn(1, { message: 'network error' })).toBe(true);
      expect(retryFn(2, { message: 'network error' })).toBe(true);
      expect(retryFn(3, { message: 'network error' })).toBe(false);
    });
  });

  describe('Bundle Optimization', () => {
    it('should load components lazily', async () => {
      const { BuyCoffeeForm, CoffeeList } = await import('../components/LazyComponents');
      
      expect(BuyCoffeeForm).toBeDefined();
      expect(CoffeeList).toBeDefined();
    });

    it('should preload wallet connectors efficiently', async () => {
      const { preloadPopularConnectors } = await import('../lib/walletConnectors');
      
      const startTime = performance.now();
      await preloadPopularConnectors();
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      
      // Preloading should complete within reasonable time
      expect(loadTime).toBeLessThan(1000); // 1 second
    });
  });

  describe('Real-time Updates', () => {
    it('should throttle updates properly', async () => {
      let updateCount = 0;
      const mockInvalidate = vi.fn(() => updateCount++);
      
      // Mock query client invalidation
      vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(mockInvalidate);
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // Simulate rapid updates
      for (let i = 0; i < 5; i++) {
        act(() => {
          // Trigger multiple updates quickly
          window.dispatchEvent(new Event('focus'));
        });
      }
      
      // Wait for throttling to settle
      await waitFor(() => {
        // Should be throttled to prevent excessive updates
        expect(updateCount).toBeLessThan(5);
      }, { timeout: 3000 });
    });

    it('should handle optimistic updates correctly', async () => {
      const { addOptimisticCoffee, removeOptimisticCoffee } = useOptimisticUpdates();
      
      const testCoffee = {
        from: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        name: 'Test User',
        message: 'Test message',
        amount: BigInt('1000000000000000'),
      };
      
      // Add optimistic update
      const optimisticCoffee = addOptimisticCoffee(testCoffee);
      
      expect(optimisticCoffee).toMatchObject({
        ...testCoffee,
        isOptimistic: true,
      });
      
      // Remove optimistic update
      removeOptimisticCoffee();
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should monitor memory usage', () => {
      const { checkMemoryUsage } = require('../lib/usePerformanceOptimizations');
      
      const memoryStats = checkMemoryUsage();
      
      expect(memoryStats).toMatchObject({
        used: expect.any(Number),
        total: expect.any(Number),
        limit: expect.any(Number),
      });
      
      expect(memoryStats.used).toBeGreaterThan(0);
      expect(memoryStats.total).toBeGreaterThan(memoryStats.used);
      expect(memoryStats.limit).toBeGreaterThan(memoryStats.total);
    });

    it('should warn on high memory usage', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock high memory usage
      mockPerformance.memory.usedJSHeapSize = mockPerformance.memory.jsHeapSizeLimit * 0.9;
      
      const { checkMemoryUsage } = require('../lib/usePerformanceOptimizations');
      checkMemoryUsage();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'High memory usage detected:',
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Network Performance', () => {
    it('should measure network latency', async () => {
      // Mock fetch for latency test
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      
      const { measureNetworkLatency } = require('../lib/usePerformanceOptimizations');
      
      const latency = await measureNetworkLatency();
      
      expect(latency).toBeGreaterThanOrEqual(0);
      expect(typeof latency).toBe('number');
    });

    it('should handle network errors gracefully', async () => {
      // Mock fetch failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const { measureNetworkLatency } = require('../lib/usePerformanceOptimizations');
      
      const latency = await measureNetworkLatency();
      
      expect(latency).toBeNull();
    });
  });

  describe('Component Performance', () => {
    it('should track component render times', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock slow render
      const originalNow = performance.now;
      let callCount = 0;
      mockPerformance.now.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0 : 20; // 20ms render time
      });
      
      const { useComponentPerformance } = require('../lib/usePerformanceOptimizations');
      
      function TestComponent() {
        useComponentPerformance('TestComponent');
        return <div>Test</div>;
      }
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // Should warn about slow render
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent render took')
      );
      
      consoleSpy.mockRestore();
      performance.now = originalNow;
    });
  });

  describe('Lazy Loading', () => {
    it('should implement intersection observer for lazy loading', () => {
      const mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
      
      global.IntersectionObserver = vi.fn().mockImplementation(() => mockObserver);
      
      const { useLazyLoading } = require('../lib/usePerformanceOptimizations');
      
      const { observe } = useLazyLoading();
      const mockElement = document.createElement('div');
      const mockCallback = vi.fn();
      
      observe(mockElement, mockCallback);
      
      expect(mockObserver.observe).toHaveBeenCalledWith(mockElement);
    });
  });

  describe('Performance Metrics', () => {
    it('should collect comprehensive performance stats', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      const statsElement = screen.getByTestId('performance-stats');
      const stats = JSON.parse(statsElement.textContent || '{}');
      
      expect(stats).toMatchObject({
        totalQueries: expect.any(Number),
        activeQueries: expect.any(Number),
        staleQueries: expect.any(Number),
        cacheSize: expect.any(String),
      });
    });

    it('should estimate cache size accurately', () => {
      // Add some queries to cache
      queryClient.setQueryData(['test1'], { data: 'test1' });
      queryClient.setQueryData(['test2'], { data: 'test2' });
      queryClient.setQueryData(['test3'], { data: 'test3' });
      
      const { CacheManager } = require('../lib/cacheStrategies');
      const cacheManager = new CacheManager(queryClient);
      
      const stats = cacheManager.getCacheStats();
      
      expect(stats.totalQueries).toBe(3);
      expect(stats.cacheSize).toMatch(/\d+\s*(KB|MB)/);
    });
  });
});

describe('Integration Performance Tests', () => {
  it('should handle concurrent operations efficiently', async () => {
    const queryClient = createOptimizedQueryClient();
    
    const startTime = performance.now();
    
    // Simulate concurrent operations
    const promises = Array.from({ length: 10 }, (_, i) => 
      queryClient.fetchQuery({
        queryKey: ['concurrent-test', i],
        queryFn: () => Promise.resolve({ id: i, data: `test-${i}` }),
      })
    );
    
    await Promise.all(promises);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Should handle concurrent operations efficiently
    expect(totalTime).toBeLessThan(1000); // 1 second
    expect(queryClient.getQueryCache().getAll()).toHaveLength(10);
  });

  it('should maintain performance under stress', async () => {
    const queryClient = createOptimizedQueryClient();
    
    // Stress test with many rapid operations
    const operations = [];
    
    for (let i = 0; i < 100; i++) {
      operations.push(
        queryClient.setQueryData(['stress-test', i], { data: i })
      );
    }
    
    const startTime = performance.now();
    
    // Perform rapid invalidations
    for (let i = 0; i < 10; i++) {
      queryClient.invalidateQueries({
        queryKey: ['stress-test'],
      });
    }
    
    const endTime = performance.now();
    const stressTime = endTime - startTime;
    
    // Should handle stress operations within reasonable time
    expect(stressTime).toBeLessThan(100); // 100ms
  });
});