'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { 
  usePerformanceOptimizations,
  useMemoryMonitoring,
  useNetworkPerformance 
} from '../lib/usePerformanceOptimizations';
import { connectorPerformanceMonitor } from '../lib/walletConnectors';

/**
 * Performance testing component for development and monitoring
 * This component helps test and monitor the performance optimizations
 */
export const PerformanceTest: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  
  const queryClient = useQueryClient();
  const { isConnected } = useAccount();
  const { getPerformanceStats, invalidateCoffeeData, clearAllCache } = usePerformanceOptimizations();
  const { checkMemoryUsage } = useMemoryMonitoring();
  const { measureNetworkLatency } = useNetworkPerformance();

  // Only show in development mode
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  const runPerformanceTests = async () => {
    setIsRunningTests(true);
    const results: any = {};

    try {
      // Test 1: Cache performance
      console.log('Testing cache performance...');
      const cacheStats = getPerformanceStats();
      results.cache = cacheStats;

      // Test 2: Memory usage
      console.log('Testing memory usage...');
      const memoryUsage = checkMemoryUsage();
      results.memory = memoryUsage;

      // Test 3: Network latency
      console.log('Testing network latency...');
      const networkLatency = await measureNetworkLatency();
      results.network = { latency: networkLatency };

      // Test 4: Wallet connector performance
      console.log('Testing wallet connector performance...');
      const connectorStats = connectorPerformanceMonitor.getStats();
      results.connectors = connectorStats;

      // Test 5: Query cache size and efficiency
      console.log('Testing query cache efficiency...');
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      results.queryCache = {
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
        staleQueries: queries.filter(q => q.isStale()).length,
        errorQueries: queries.filter(q => q.state.status === 'error').length,
      };

      // Test 6: Bundle size estimation (rough)
      console.log('Estimating bundle performance...');
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType('resource');
        
        results.bundle = {
          loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
          totalResources: resources.length,
          jsResources: resources.filter(r => r.name.includes('.js')).length,
        };
      }

      setTestResults(results);
      console.log('Performance test results:', results);
      
    } catch (error) {
      console.error('Performance test failed:', error);
      results.error = error;
      setTestResults(results);
    } finally {
      setIsRunningTests(false);
    }
  };

  const testCacheInvalidation = () => {
    console.log('Testing cache invalidation...');
    const startTime = performance.now();
    invalidateCoffeeData();
    const endTime = performance.now();
    
    console.log(`Cache invalidation took ${endTime - startTime}ms`);
    setTestResults((prev: Record<string, any>) => ({
      ...prev,
      cacheInvalidation: { time: endTime - startTime }
    }));
  };

  const testCacheClear = () => {
    console.log('Testing cache clear...');
    const startTime = performance.now();
    clearAllCache();
    const endTime = performance.now();
    
    console.log(`Cache clear took ${endTime - startTime}ms`);
    setTestResults((prev: Record<string, any>) => ({
      ...prev,
      cacheClear: { time: endTime - startTime }
    }));
  };

  const stressTestQueries = async () => {
    console.log('Running query stress test...');
    setIsRunningTests(true);
    
    const startTime = performance.now();
    const promises = [];
    
    // Simulate multiple rapid queries
    for (let i = 0; i < 10; i++) {
      promises.push(
        queryClient.fetchQuery({
          queryKey: ['stress-test', i],
          queryFn: () => new Promise(resolve => setTimeout(resolve, 100)),
        })
      );
    }
    
    try {
      await Promise.all(promises);
      const endTime = performance.now();
      
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        stressTest: { 
          time: endTime - startTime,
          queriesCount: 10,
          avgTimePerQuery: (endTime - startTime) / 10
        }
      }));
      
      console.log(`Stress test completed in ${endTime - startTime}ms`);
    } catch (error) {
      console.error('Stress test failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Performance Monitor</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={runPerformanceTests}
            disabled={isRunningTests}
            className="w-full px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunningTests ? 'Running Tests...' : 'Run Performance Tests'}
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={testCacheInvalidation}
              className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
            >
              Test Cache Invalidation
            </button>
            
            <button
              onClick={testCacheClear}
              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Clear Cache
            </button>
          </div>
          
          <button
            onClick={stressTestQueries}
            disabled={isRunningTests}
            className="w-full px-3 py-2 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {isRunningTests ? 'Running Stress Test...' : 'Query Stress Test'}
          </button>
        </div>

        {/* Test Results Display */}
        {Object.keys(testResults).length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
            <h4 className="font-semibold mb-2">Latest Results:</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {testResults.cache && (
                <div>
                  <strong>Cache:</strong> {testResults.cache.totalQueries} queries, 
                  {testResults.cache.cacheSize}
                </div>
              )}
              
              {testResults.memory && (
                <div>
                  <strong>Memory:</strong> {testResults.memory.used}MB / {testResults.memory.total}MB
                </div>
              )}
              
              {testResults.network?.latency && (
                <div>
                  <strong>Network:</strong> {testResults.network.latency.toFixed(2)}ms
                </div>
              )}
              
              {testResults.bundle && (
                <div>
                  <strong>Load Time:</strong> {testResults.bundle.loadTime.toFixed(2)}ms
                </div>
              )}
              
              {testResults.connectors && (
                <div>
                  <strong>Connectors:</strong> Avg load {testResults.connectors.averageLoadTime?.toFixed(2)}ms
                </div>
              )}
              
              {testResults.cacheInvalidation && (
                <div>
                  <strong>Cache Invalidation:</strong> {testResults.cacheInvalidation.time.toFixed(2)}ms
                </div>
              )}
              
              {testResults.stressTest && (
                <div>
                  <strong>Stress Test:</strong> {testResults.stressTest.time.toFixed(2)}ms 
                  ({testResults.stressTest.avgTimePerQuery.toFixed(2)}ms avg)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-time Stats */}
        <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
          <div className="flex justify-between">
            <span>Connected:</span>
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Queries:</span>
            <span>{queryClient.getQueryCache().getAll().length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTest;