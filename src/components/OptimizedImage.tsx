'use client';

import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * Optimized image component with lazy loading and performance optimizations
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isInView]);

  // Generate optimized image URLs
  const generateSrcSet = (baseSrc: string) => {
    const sizes = [320, 640, 768, 1024, 1280, 1920];
    return sizes
      .map((size) => `${baseSrc}?w=${size}&q=75 ${size}w`)
      .join(', ');
  };

  const generateSizes = () => {
    return '(max-width: 320px) 320px, (max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, (max-width: 1280px) 1280px, 1920px';
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  // Placeholder component
  const Placeholder = () => (
    <div
      className={`bg-gray-200 animate-pulse ${className}`}
      style={{ width, height }}
    >
      {placeholder === 'blur' && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          className="w-full h-full object-cover filter blur-sm"
        />
      )}
    </div>
  );

  // Error fallback
  if (error) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Placeholder */}
      {!isLoaded && <Placeholder />}
      
      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300`}
          srcSet={generateSrcSet(src)}
          sizes={generateSizes()}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            position: isLoaded ? 'static' : 'absolute',
            top: isLoaded ? 'auto' : 0,
            left: isLoaded ? 'auto' : 0,
          }}
        />
      )}
    </div>
  );
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'low') {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = priority;
  
  document.head.appendChild(link);
}

/**
 * Hook for image performance monitoring
 */
export function useImagePerformance() {
  const trackImageLoad = (src: string, loadTime: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Image loaded: ${src} in ${loadTime}ms`);
    }
    
    // You could send this to analytics
    if (loadTime > 1000) {
      console.warn(`Slow image load: ${src} took ${loadTime}ms`);
    }
  };

  const trackImageError = (src: string, error: Event) => {
    console.error(`Failed to load image: ${src}`, error);
    
    // You could send this to error tracking service
  };

  return { trackImageLoad, trackImageError };
}