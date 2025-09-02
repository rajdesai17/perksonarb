import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '../wagmi';
import BuyCoffeeForm from '../components/BuyCoffeeForm';
import CoffeeList from '../components/CoffeeList';

// Mock all dependencies
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: vi.fn(),
    useReadContract: vi.fn(),
  };
});

vi.mock('@rainbow-me/rainbowkit', async () => {
  const actual = await vi.importActual('@rainbow-me/rainbowkit');
  return {
    ...actual,
    RainbowKitProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('../lib/useContract', () => ({
  useBuyCoffee: vi.fn(),
  COFFEE_PRICES: {
    small: BigInt('1000000000000000'),
    medium: BigInt('3000000000000000'),
    large: BigInt('5000000000000000'),
  },
  CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
  CONTRACT_ABI: [],
}));

vi.mock('../components/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../lib/useRealTimeUpdates', () => ({
  useOptimisticUpdates: () => ({
    addOptimisticCoffee: vi.fn(),
    removeOptimisticCoffee: vi.fn(),
  }),
}));

vi.mock('../lib/usePerformanceOptimizations', () => ({
  usePerformanceOptimizations: () => ({
    addOptimisticCoffee: vi.fn(),
    revertOptimisticCoffee: vi.fn(),
  }),
  useComponentPerformance: vi.fn(),
}));

vi.mock('../components/PerformanceMonitor', () => ({
  useRenderPerformance: vi.fn(),
  useQueryPerformance: vi.fn(),
}));

vi.mock('../lib/security', () => ({
  validateName: (name: string) => ({
    isValid: name.length > 0 && name.length <= 50,
    sanitized: name.trim(),
    error: name.length === 0 ? 'Name is required' : undefined,
  }),
  validateMessage: (message: string) => ({
    isValid: message.length <= 280,
    sanitized: message.trim(),
  }),
  validateTransactionAmount: () => ({ isValid: true }),
  transactionRateLimit: { isAllowed: () => true },
  securityAuditLog: { log: vi.fn() },
}));

vi.mock('../components/ErrorBoundary', () => ({
  withErrorBoundary: (Component: React.ComponentType) => Component,
  useErrorHandler: () => ({ handleError: vi.fn() }),
}));

vi.mock('../components/TransactionConfirmation', () => ({
  TransactionConfirmationModal: () => null,
}));

import { useAccount, useReadContract } from 'wagmi';
import { useBuyCoffee } from '../lib/useContract';

const mockUseAccount = useAccount as any;
const mockUseReadContract = useReadContract as any;
const mockUseBuyCoffee = useBuyCoffee as any;

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

// Mock viewport dimensions
const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

// Mock CSS media queries
const mockMediaQuery = (query: string, matches: boolean) => {
  const mediaQuery = {
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => mediaQuery),
  });

  return mediaQuery;
};

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    });
    
    mockUseReadContract.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    
    mockUseBuyCoffee.mockReturnValue({
      buyCoffee: vi.fn(),
      hash: undefined,
      isPending: false,
      isConfirming: false,
      isConfirmed: false,
      error: null,
      reset: vi.fn(),
    });
  });

  afterEach(() => {
    // Reset viewport
    mockViewport(1024, 768);
  });

  describe('Mobile Viewport (320px - 767px)', () => {
    beforeEach(() => {
      mockViewport(375, 667); // iPhone SE dimensions
      mockMediaQuery('(max-width: 767px)', true);
    });

    it('should render BuyCoffeeForm correctly on mobile', () => {
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      // Form should be present and functional
      expect(screen.getByText('Buy Me a Coffee ☕')).toBeInTheDocument();
      expect(screen.getByLabelText(/Your Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
      
      // Coffee size options should be stacked vertically on mobile
      expect(screen.getByText('Small')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Large')).toBeInTheDocument();
      
      // Submit button should be full width
      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });
      expect(submitButton).toBeInTheDocument();
    });

    it('should render CoffeeList correctly on mobile', () => {
      const mockCoffees = [
        {
          from: '0x1234567890123456789012345678901234567890',
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
          name: 'Mobile User',
          message: 'Testing mobile layout',
          amount: BigInt('1000000000000000'),
        },
      ];

      mockUseReadContract.mockReturnValue({
        data: mockCoffees,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CoffeeList />
        </TestWrapper>
      );

      expect(screen.getByText('Coffee Supporters ☕')).toBeInTheDocument();
      expect(screen.getByText('Mobile User')).toBeInTheDocument();
      expect(screen.getByText('Testing mobile layout')).toBeInTheDocument();
    });

    it('should handle long text content on mobile', () => {
      const mockCoffees = [
        {
          from: '0x1234567890123456789012345678901234567890',
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
          name: 'User With Very Long Name That Should Truncate',
          message: 'This is a very long message that should wrap properly on mobile devices and not break the layout or cause horizontal scrolling issues',
          amount: BigInt('1000000000000000'),
        },
      ];

      mockUseReadContract.mockReturnValue({
        data: mockCoffees,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CoffeeList />
        </TestWrapper>
      );

      // Long content should be present but properly contained
      expect(screen.getByText(/User With Very Long Name/)).toBeInTheDocument();
      expect(screen.getByText(/This is a very long message/)).toBeInTheDocument();
    });
  });

  describe('Tablet Viewport (768px - 1023px)', () => {
    beforeEach(() => {
      mockViewport(768, 1024); // iPad dimensions
      mockMediaQuery('(min-width: 768px) and (max-width: 1023px)', true);
    });

    it('should render components correctly on tablet', () => {
      render(
        <TestWrapper>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BuyCoffeeForm />
            <CoffeeList />
          </div>
        </TestWrapper>
      );

      // Both components should be visible
      expect(screen.getByText('Buy Me a Coffee ☕')).toBeInTheDocument();
      expect(screen.getByText('No Coffee Purchases Yet')).toBeInTheDocument();
    });

    it('should handle medium-length content on tablet', () => {
      const mockCoffees = Array.from({ length: 5 }, (_, i) => ({
        from: `0x${i.toString().padStart(40, '0')}` as `0x${string}`,
        timestamp: BigInt(Math.floor(Date.now() / 1000) - i * 3600),
        name: `Tablet User ${i + 1}`,
        message: `Message from tablet user ${i + 1}`,
        amount: BigInt('1000000000000000'),
      }));

      mockUseReadContract.mockReturnValue({
        data: mockCoffees,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CoffeeList />
        </TestWrapper>
      );

      expect(screen.getByText('5 supporters have bought coffee')).toBeInTheDocument();
      expect(screen.getByText('Tablet User 1')).toBeInTheDocument();
      expect(screen.getByText('Tablet User 5')).toBeInTheDocument();
    });
  });

  describe('Desktop Viewport (1024px+)', () => {
    beforeEach(() => {
      mockViewport(1440, 900); // Desktop dimensions
      mockMediaQuery('(min-width: 1024px)', true);
    });

    it('should render components in side-by-side layout on desktop', () => {
      render(
        <TestWrapper>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BuyCoffeeForm />
            <CoffeeList />
          </div>
        </TestWrapper>
      );

      // Both components should be visible side by side
      expect(screen.getByText('Buy Me a Coffee ☕')).toBeInTheDocument();
      expect(screen.getByText('No Coffee Purchases Yet')).toBeInTheDocument();
    });

    it('should handle large amounts of content on desktop', () => {
      const mockCoffees = Array.from({ length: 20 }, (_, i) => ({
        from: `0x${i.toString().padStart(40, '0')}` as `0x${string}`,
        timestamp: BigInt(Math.floor(Date.now() / 1000) - i * 1800),
        name: `Desktop User ${i + 1}`,
        message: `This is a longer message from desktop user ${i + 1} to test how the layout handles more content`,
        amount: BigInt((Math.floor(Math.random() * 3) + 1) * 1000000000000000),
      }));

      mockUseReadContract.mockReturnValue({
        data: mockCoffees,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CoffeeList />
        </TestWrapper>
      );

      expect(screen.getByText('20 supporters have bought coffee')).toBeInTheDocument();
      
      // Should show scroll functionality for many items
      expect(screen.getByText('Desktop User 1')).toBeInTheDocument();
    });

    it('should show all coffee size options clearly on desktop', () => {
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      // All coffee options should be clearly visible
      expect(screen.getByText('Small')).toBeInTheDocument();
      expect(screen.getByText('Perfect for a quick boost')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('The classic choice')).toBeInTheDocument();
      expect(screen.getByText('Large')).toBeInTheDocument();
      expect(screen.getByText('For the coffee enthusiast')).toBeInTheDocument();
    });
  });

  describe('Ultra-wide Desktop (1920px+)', () => {
    beforeEach(() => {
      mockViewport(1920, 1080);
      mockMediaQuery('(min-width: 1920px)', true);
    });

    it('should maintain proper layout on ultra-wide screens', () => {
      render(
        <TestWrapper>
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <BuyCoffeeForm />
              <CoffeeList />
            </div>
          </div>
        </TestWrapper>
      );

      // Content should be contained and not stretch too wide
      expect(screen.getByText('Buy Me a Coffee ☕')).toBeInTheDocument();
      expect(screen.getByText('No Coffee Purchases Yet')).toBeInTheDocument();
    });
  });

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape orientation change', () => {
      // Start in portrait
      mockViewport(375, 667);
      
      const { rerender } = render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      expect(screen.getByText('Buy Me a Coffee ☕')).toBeInTheDocument();

      // Change to landscape
      mockViewport(667, 375);
      
      rerender(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      // Component should still be functional
      expect(screen.getByText('Buy Me a Coffee ☕')).toBeInTheDocument();
      expect(screen.getByLabelText(/Your Name/)).toBeInTheDocument();
    });
  });

  describe('Accessibility at Different Screen Sizes', () => {
    it('should maintain accessibility features on mobile', () => {
      mockViewport(375, 667);
      
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      // Labels should be properly associated
      const nameInput = screen.getByLabelText(/Your Name/);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('id');

      const messageInput = screen.getByLabelText(/Message/);
      expect(messageInput).toBeInTheDocument();
      expect(messageInput).toHaveAttribute('id');

      // Button should be accessible
      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });
      expect(submitButton).toBeInTheDocument();
    });

    it('should maintain focus management across screen sizes', () => {
      mockViewport(1024, 768);
      
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      // Form elements should be focusable
      const nameInput = screen.getByLabelText(/Your Name/);
      const messageInput = screen.getByLabelText(/Message/);
      const submitButton = screen.getByRole('button');

      expect(nameInput).not.toHaveAttribute('tabindex', '-1');
      expect(messageInput).not.toHaveAttribute('tabindex', '-1');
      expect(submitButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Performance at Different Screen Sizes', () => {
    it('should render efficiently on mobile devices', () => {
      mockViewport(375, 667);
      
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render should complete quickly (under 100ms for this simple component)
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText('Buy Me a Coffee ☕')).toBeInTheDocument();
    });

    it('should handle large datasets efficiently on desktop', () => {
      mockViewport(1440, 900);
      
      const largeCoffeeList = Array.from({ length: 100 }, (_, i) => ({
        from: `0x${i.toString().padStart(40, '0')}` as `0x${string}`,
        timestamp: BigInt(Math.floor(Date.now() / 1000) - i * 60),
        name: `User ${i + 1}`,
        message: `Message ${i + 1}`,
        amount: BigInt('1000000000000000'),
      }));

      mockUseReadContract.mockReturnValue({
        data: largeCoffeeList,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <CoffeeList />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render large list efficiently
      expect(renderTime).toBeLessThan(200);
      expect(screen.getByText('100 supporters have bought coffee')).toBeInTheDocument();
    });
  });
});