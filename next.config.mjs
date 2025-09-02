// Bundle analyzer is disabled in production builds on Vercel to avoid requiring devDependencies

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable experimental features for better performance
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
    // Optimize resource loading
    optimizeCss: true,
    // Better resource hints
    optimizeServerReact: true,
  },
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable compression
  compress: true,


  webpack: (config, { dev, isServer }) => {
    // Externalize problematic packages
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        minSize: 20000,
        maxSize: 200000, // Reduced max size for better caching
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate wagmi/viem into their own chunk
          wagmi: {
            test: /[\\/]node_modules[\\/](wagmi|viem|@wagmi)[\\/]/,
            name: 'wagmi',
            chunks: 'all',
            priority: 40,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Separate RainbowKit into its own chunk
          rainbowkit: {
            test: /[\\/]node_modules[\\/]@rainbow-me[\\/]/,
            name: 'rainbowkit',
            chunks: 'all',
            priority: 40,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Separate React Query into its own chunk
          reactQuery: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            name: 'react-query',
            chunks: 'all',
            priority: 40,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Separate crypto/wallet libraries
          crypto: {
            test: /[\\/]node_modules[\\/](ethers|@ethersproject|@noble|secp256k1|keccak|sha3)[\\/]/,
            name: 'crypto',
            chunks: 'all',
            priority: 35,
            reuseExistingChunk: true,
          },
          // React and core libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true,
          },
          // Create smaller vendor chunks
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            maxSize: 150000, // Smaller vendor chunks
          },
        },
      };

      // Enable tree shaking and advanced optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.providedExports = true;
      config.optimization.innerGraph = true;
      
      // Enable module concatenation for better performance
      config.optimization.concatenateModules = true;
      
      // Optimize module IDs for better caching
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
    }

    // Add performance hints
    config.performance = {
      hints: dev ? false : 'warning',
      maxEntrypointSize: 300000, // 300kb
      maxAssetSize: 250000, // 250kb
    };
    
    return config;
  },
  // Enable static optimization
  trailingSlash: false,
  // Optimize build output
  poweredByHeader: false,
  // Enable gzip compression
  compress: true,

  // Disable ESLint during production builds on Vercel (dev runs can still lint)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimize resource hints to prevent preload warnings
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },

};

export default nextConfig;
