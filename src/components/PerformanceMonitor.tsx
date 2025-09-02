'use client';

import { useEffect } from 'react';

/**
 * Performance monitoring component to track Core Web Vitals and other metrics
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production and if performance API is available
    if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') {
      return;
    }

    // Track Core Web Vitals
    const trackWebVitals = async () => {
      try {
        const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals');
        
        // Cumulative Layout Shift
        onCLS((metric) => {
          console.log('CLS:', metric);
          // You can send this to analytics service
        });

        // Interaction to Next Paint (replaces FID)
        onINP((metric) => {
          console.log('INP:', metric);
        });

        // First Contentful Paint
        onFCP((metric) => {
          console.log('FCP:', metric);
        });

        // Largest Contentful Paint
        onLCP((metric) => {
          console.log('LCP:', metric);
        });

        // Time to First Byte
        onTTFB((metric) => {
          console.log('TTFB:', metric);
        });
      } catch (error) {
        console.warn('Web Vitals not available:', error);
      }
    };

    // Track bundle loading performance
    const trackBundlePerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const metrics = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            load: navigation.loadEventEnd - navigation.loadEventStart,
            total: navigation.loadEventEnd - navigation.fetchStart,
          };
          
          console.log('Bundle Performance Metrics:', metrics);
        }
      }
    };

    // Track resource loading
    const trackResourcePerformance = () => {
      if ('performance' in window) {
        const resources = performance.getEntriesByType('resource');
        const jsResources = resources.filter(resource => 
          resource.name.includes('.js') || resource.name.includes('/_next/')
        );
        
        const totalJSSize = jsResources.reduce((total, resource) => {
          return total + ((resource as any).transferSize || 0);
        }, 0);
        
        console.log('JavaScript Bundle Size:', Math.round(totalJSSize / 1024), 'KB');
        console.log('Total Resources:', resources.length);
      }
    };

    // Track memory usage (if available)
    const trackMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('Memory Usage:', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        }, 'MB');
      }
    };

    // Run performance tracking
    trackWebVitals();
    
    // Track other metrics after page load
    setTimeout(() => {
      trackBundlePerformance();
      trackResourcePerformance();
      trackMemoryUsage();
    }, 1000);

    // Track memory usage periodically
    const memoryInterval = setInterval(trackMemoryUsage, 30000); // Every 30 seconds

    return () => {
      clearInterval(memoryInterval);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Hook to track component render performance
 */
export function useRenderPerformance(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > 16) { // Warn if render takes longer than 16ms (60fps)
          console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
        }
      };
    }
  });
}

/**
 * Hook to track blockchain query performance
 */
export function useQueryPerformance(queryName: string, isLoading: boolean, error: any) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = Date.now();
      
      if (!isLoading && !error) {
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        console.log(`${queryName} query completed in ${queryTime}ms`);
      }
      
      if (error) {
        console.warn(`${queryName} query failed:`, error);
      }
    }
  }, [queryName, isLoading, error]);
}