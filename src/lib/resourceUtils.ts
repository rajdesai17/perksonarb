/**
 * Resource utilities to handle preloading efficiently and prevent warnings
 */

interface PreloadOptions {
  as: 'style' | 'script' | 'font' | 'fetch' | 'image';
  crossorigin?: boolean;
  critical?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Smart preload function that prevents duplicate preloads and warnings
 */
export function smartPreload(href: string, options: PreloadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    // Check if resource is already preloaded
    const existingPreload = document.querySelector(`link[rel="preload"][href="${href}"]`);
    if (existingPreload) {
      resolve();
      return;
    }

    // Check if resource is already loaded
    const existingResource = document.querySelector(`link[href="${href}"], script[src="${href}"]`);
    if (existingResource) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.setAttribute('as', options.as);

    // Set fetchPriority if supported
    if (options.fetchPriority && 'fetchPriority' in link) {
      (link as any).fetchPriority = options.fetchPriority;
    }

    // Set crossorigin for fonts and external resources
    if (options.crossorigin || options.as === 'font') {
      link.crossOrigin = 'anonymous';
    }

    // Mark as critical for ResourceOptimizer
    if (options.critical) {
      link.setAttribute('data-critical', 'true');
    }

    // Add event listeners
    link.onload = () => {
      if (options.onLoad) options.onLoad();
      resolve();
    };

    link.onerror = () => {
      if (options.onError) options.onError();
      reject(new Error(`Failed to preload ${href}`));
    };

    // Add to document
    document.head.appendChild(link);

    // Set a timeout to prevent hanging promises
    setTimeout(() => {
      if (link.parentNode) {
        resolve(); // Consider it loaded even if event didn't fire
      }
    }, 10000); // 10 second timeout
  });
}

/**
 * Preload CSS with automatic conversion to stylesheet
 */
export function preloadCSS(href: string, critical = false): Promise<void> {
  return smartPreload(href, {
    as: 'style',
    critical,
    fetchPriority: critical ? 'high' : 'low',
    onLoad: () => {
      // Convert preload to stylesheet after loading
      const link = document.querySelector(`link[rel="preload"][href="${href}"]`) as HTMLLinkElement;
      if (link) {
        link.rel = 'stylesheet';
      }
    }
  });
}

/**
 * Preload JavaScript with smart loading
 */
export function preloadJS(src: string, critical = false): Promise<void> {
  return smartPreload(src, {
    as: 'script',
    critical,
    fetchPriority: critical ? 'high' : 'low'
  });
}

/**
 * Preload font with proper attributes
 */
export function preloadFont(href: string, type = 'font/woff2'): Promise<void> {
  return smartPreload(href, {
    as: 'font',
    crossorigin: true,
    fetchPriority: 'high' // Fonts are usually critical
  });
}

/**
 * Preload API data
 */
export function preloadData(url: string): Promise<void> {
  return smartPreload(url, {
    as: 'fetch',
    crossorigin: true,
    fetchPriority: 'low'
  });
}

/**
 * Clean up unused preloads after a delay
 */
export function cleanupUnusedPreloads(delay = 5000): void {
  if (typeof window === 'undefined') return;

  setTimeout(() => {
    const preloads = document.querySelectorAll('link[rel="preload"]');
    
    preloads.forEach((preload) => {
      const link = preload as HTMLLinkElement;
      const href = link.href;
      const as = link.getAttribute('as');
      
      let isUsed = false;
      
      // Check if CSS is used
      if (as === 'style') {
        isUsed = !!document.querySelector(`link[rel="stylesheet"][href="${href}"]`);
      }
      
      // Check if JS is used
      if (as === 'script') {
        isUsed = !!document.querySelector(`script[src="${href}"]`);
      }
      
      // Check if font is used (more complex check)
      if (as === 'font') {
        // Fonts are typically used by CSS, so keep them
        isUsed = true;
      }
      
      // Check if fetch data is used (keep for now)
      if (as === 'fetch') {
        isUsed = true;
      }
      
      // Remove unused preloads
      if (!isUsed && !link.hasAttribute('data-critical')) {
        console.log(`Cleaning up unused preload: ${href}`);
        link.remove();
      }
    });
  }, delay);
}

/**
 * Get effective connection type for adaptive loading
 */
export function getConnectionType(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const connection = (navigator as any).connection;
  if (!connection) return 'unknown';
  
  return connection.effectiveType || 'unknown';
}

/**
 * Adaptive preloading based on connection speed
 */
export function adaptivePreload(href: string, options: PreloadOptions): Promise<void> {
  const connectionType = getConnectionType();
  
  // Skip non-critical preloads on slow connections
  if ((connectionType === 'slow-2g' || connectionType === '2g') && !options.critical) {
    return Promise.resolve();
  }
  
  return smartPreload(href, options);
}

/**
 * Batch preload multiple resources
 */
export function batchPreload(resources: Array<{ href: string; options: PreloadOptions }>): Promise<void[]> {
  const promises = resources.map(({ href, options }) => adaptivePreload(href, options));
  return Promise.all(promises);
}






