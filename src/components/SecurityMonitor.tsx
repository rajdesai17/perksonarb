'use client';

import React, { useEffect } from 'react';
import { securityAuditLog, containsSensitiveData } from '../lib/security';

/**
 * Security Monitor component to prevent sensitive data storage and monitor security events
 * Implements requirements 7.5 - ensure no sensitive data is stored in localStorage
 */
export const SecurityMonitor: React.FC = () => {
  useEffect(() => {
    // Monitor localStorage for sensitive data
    const monitorLocalStorage = () => {
      try {
        const keys = Object.keys(localStorage);
        
        for (const key of keys) {
          const value = localStorage.getItem(key);
          if (value && containsSensitiveData(value)) {
            // Log security violation
            securityAuditLog.log(
              'sensitive_data_in_localstorage',
              'high',
              {
                key,
                timestamp: new Date().toISOString(),
              }
            );
            
            // Remove sensitive data immediately
            localStorage.removeItem(key);
            console.warn(`Removed sensitive data from localStorage key: ${key}`);
          }
        }
      } catch (error) {
        console.error('Error monitoring localStorage:', error);
      }
    };

    // Initial check
    monitorLocalStorage();

    // Set up periodic monitoring
    const interval = setInterval(monitorLocalStorage, 30000); // Check every 30 seconds

    // Monitor storage events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.newValue && containsSensitiveData(event.newValue)) {
        securityAuditLog.log(
          'sensitive_data_storage_attempt',
          'high',
          {
            key: event.key,
            timestamp: new Date().toISOString(),
          }
        );
        
        // Prevent storage of sensitive data
        if (event.key) {
          localStorage.removeItem(event.key);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Override localStorage methods to add security checks
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key: string, value: string) {
      if (containsSensitiveData(value)) {
        securityAuditLog.log(
          'blocked_sensitive_data_storage',
          'high',
          {
            key,
            timestamp: new Date().toISOString(),
          }
        );
        console.warn(`Blocked attempt to store sensitive data in localStorage key: ${key}`);
        return;
      }
      return originalSetItem.call(this, key, value);
    };

    // Monitor for suspicious activities
    const monitorSuspiciousActivity = () => {
      // Check for multiple failed transactions
      const logs = securityAuditLog.getLogs();
      const recentFailures = logs.filter(
        log => 
          log.event.includes('transaction') && 
          log.event.includes('failed') &&
          Date.now() - log.timestamp < 300000 // Last 5 minutes
      );

      if (recentFailures.length >= 3) {
        securityAuditLog.log(
          'suspicious_activity_detected',
          'high',
          {
            failureCount: recentFailures.length,
            timestamp: new Date().toISOString(),
          }
        );
      }
    };

    const suspiciousActivityInterval = setInterval(monitorSuspiciousActivity, 60000); // Check every minute

    // Cleanup
    return () => {
      clearInterval(interval);
      clearInterval(suspiciousActivityInterval);
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  // Monitor for XSS attempts
  useEffect(() => {
    const detectXSSAttempts = () => {
      // Monitor for script injection attempts
      const scripts = document.querySelectorAll('script');
      scripts.forEach((script) => {
        if (script.src && !script.src.startsWith(window.location.origin)) {
          // External script detected
          securityAuditLog.log(
            'external_script_detected',
            'medium',
            {
              src: script.src,
              timestamp: new Date().toISOString(),
            }
          );
        }
      });

      // Monitor for inline event handlers
      const elementsWithEvents = document.querySelectorAll('[onclick], [onload], [onerror]');
      if (elementsWithEvents.length > 0) {
        securityAuditLog.log(
          'inline_event_handlers_detected',
          'medium',
          {
            count: elementsWithEvents.length,
            timestamp: new Date().toISOString(),
          }
        );
      }
    };

    // Initial check
    detectXSSAttempts();

    // Set up mutation observer to monitor DOM changes
    const observer = new MutationObserver(() => {
      detectXSSAttempts();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['onclick', 'onload', 'onerror', 'src'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Monitor network requests for security
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const [resource, config] = args;
      const url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : resource.toString());
      
      // Log external requests
      if (url && !url.startsWith(window.location.origin) && !url.startsWith('/')) {
        securityAuditLog.log(
          'external_request',
          'low',
          {
            url,
            method: config?.method || 'GET',
            timestamp: new Date().toISOString(),
          }
        );
      }
      
      return originalFetch.apply(this, args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null; // This component doesn't render anything
};

/**
 * Security Dashboard component for development/debugging
 */
export const SecurityDashboard: React.FC = () => {
  const [logs, setLogs] = React.useState(securityAuditLog.getLogs());
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(securityAuditLog.getLogs());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const highSeverityLogs = logs.filter(log => log.severity === 'high');

  return (
    <>
      {/* Security Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
            highSeverityLogs.length > 0
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-green-500 text-white'
          }`}
        >
          Security {highSeverityLogs.length > 0 ? `(${highSeverityLogs.length})` : '✓'}
        </button>
      </div>

      {/* Security Dashboard Modal */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Security Dashboard</h2>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-96">
              <div className="mb-4">
                <h3 className="font-medium mb-2">Security Status</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-green-800 font-medium">Total Events</div>
                    <div className="text-green-600">{logs.length}</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="text-yellow-800 font-medium">Medium Severity</div>
                    <div className="text-yellow-600">
                      {logs.filter(log => log.severity === 'medium').length}
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <div className="text-red-800 font-medium">High Severity</div>
                    <div className="text-red-600">{highSeverityLogs.length}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Recent Security Events</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logs.slice(-10).reverse().map((log, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded text-sm ${
                        log.severity === 'high'
                          ? 'bg-red-50 border-l-4 border-red-500'
                          : log.severity === 'medium'
                          ? 'bg-yellow-50 border-l-4 border-yellow-500'
                          : 'bg-gray-50 border-l-4 border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{log.event}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      {Object.keys(log.details).length > 0 && (
                        <div className="mt-1 text-xs text-gray-600">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};