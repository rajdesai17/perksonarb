'use client';

import { useEffect } from 'react';

/**
 * Service Worker registration component for advanced caching
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register in production and if service workers are supported
    if (
      process.env.NODE_ENV === 'production' &&
      'serviceWorker' in navigator &&
      typeof window !== 'undefined'
    ) {
      registerServiceWorker();
    }

    // Preload critical resources with delay to avoid conflicts with Next.js
    const preloadTimer = setTimeout(() => {
      preloadCriticalResources();
    }, 1000); // 1 second delay to ensure Next.js has finished initial loading

    return () => clearTimeout(preloadTimer);
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New version available! Please refresh.');
              
              // You could show a notification to the user here
              if (confirm('A new version is available. Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      // Handle controller change (when new SW takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        window.location.reload();
      });

      // Register for background sync (if supported)
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        (registration as any).sync?.register('background-sync');
      }

      // Request persistent storage for better caching
      if ('storage' in navigator && 'persist' in navigator.storage) {
        const persistent = await navigator.storage.persist();
        console.log('Persistent storage:', persistent);
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  // This component doesn't render anything
  return null;
}

/**
 * Hook to check if app is running from cache (offline-first)
 */
export function useOfflineStatus() {
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is online');
      // Trigger cache refresh for critical data
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'REFRESH_CACHE'
        });
      }
    };

    const handleOffline = () => {
      console.log('App is offline - using cached data');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}

/**
 * Preload critical resources (only non-automatic ones)
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  // Only preload resources that actually exist
  // Remove hardcoded paths that cause 404s
  
  // Preload contract data if it exists
  fetch('/contract.json')
    .then(response => {
      if (response.ok) {
        const contractData = document.createElement('link');
        contractData.rel = 'preload';
        contractData.as = 'fetch';
        contractData.href = '/contract.json';
        contractData.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(contractData);
      }
    })
    .catch(() => {
      // Contract data doesn't exist yet, skip preloading
    });
}