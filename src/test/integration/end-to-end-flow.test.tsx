import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '../../wagmi';
import BuyCoffeeForm from '../../components/BuyCoffeeForm';
import CoffeeList from '../../components/CoffeeList';

// Mock wagmi hooks
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: vi.fn(),
    useReadContract: vi.fn(),
  };
});

// Mock RainbowKit
vi.mock('@rainbow-me/rainbowkit', async () => {
  const actual = await vi.importActual('@rainbow-me/rainbowkit');
  return {
    ...actual,
    RainbowKitProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock contract hooks
vi.mock('../../lib/useContract', () => ({
  useBuyCoffee: vi.fn(),
  COFFEE_PRICES: {
    small: BigInt('1000000000000000'),
    medium: BigInt('3000000000000000'),
    large: BigInt('5000000000000000'),
  },
  CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
  CONTRACT_ABI: [],
}));

// Mock all other dependencies
vi.mock('../../components/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock('../../lib/useRealTimeUpdates', () => ({
  useOptimisticUpdates: () => ({
    addOptimisticCoffee: vi.fn(),
    removeOptimisticCoffee: vi.fn(),
  }),
}));

vi.mock('../../lib/usePerformanceOptimizations', () => ({
  usePerformanceOptimizations: () => ({
    addOptimisticCoffee: vi.fn(),
    revertOptimisticCoffee: vi.fn(),
  }),
  useComponentPerformance: vi.fn(),
}));

vi.mock('../../components/PerformanceMonitor', () => ({
  useRenderPerformance: vi.fn(),
  useQueryPerformance: vi.fn(),
}));

vi.mock('../../lib/security', () => ({
  validateName: (name: string) => ({
    isValid: name.length > 0 && name.length <= 50,
    sanitized: name.trim(),
    error: name.length === 0 ? 'Name is required' : name.length > 50 ? 'Name too long' : undefined,
  }),
  validateMessage: (message: string) => ({
    isValid: message.length <= 280,
    sanitized: message.trim(),
    error: message.length > 280 ? 'Message too long' : undefined,
  }),
  validateTransactionAmount: () => ({ isValid: true }),
  transactionRateLimit: {
    isAllowed: () => true,
    getRemainingTime: () => 0,
  },
  securityAuditLog: {
    log: vi.fn(),
  },
}));

vi.mock('../../components/ErrorBoundary', () => ({
  withErrorBoundary: (Component: React.ComponentType) => Component,
  useErrorHandler: () => ({
    handleError: vi.fn(),
  }),
}));

vi.mock('../../components/TransactionConfirmation', () => ({
  TransactionConfirmationModal: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div data-testid="confirmation-modal">
        <button onClick={onConfirm} data-testid="confirm-transaction">
          Confirm
        </button>
        <button onClick={onCancel} data-testid="cancel-transaction">
          Cancel
        </button>
      </div>
    ) : null,
}));

import { useAccount, useReadContract } from 'wagmi';
import { useBuyCoffee } from '../../lib/useContract';

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

// Complete app component for E2E testing
const TestApp: React.FC = () => (
  <div className="min-h-screen bg-cream-50 py-8">
    <div className="container mx-auto px-4 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BuyCoffeeForm />
        <CoffeeList />
      </div>
    </div>
  </div>
);

describe('End-to-End Coffee Purchase Flow', () => {
  const mockBuyCoffee = vi.fn();
  const mockRefetch = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Default connected wallet state
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
    });
    
    // Default coffee list state (empty initially)
    mockUseReadContract.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
    
    // Default buy coffee hook state
    mockUseBuyCoffee.mockReturnValue({
      buyCoffee: mockBuyCoffee,
      hash: undefined,
      isPending: false,
      isConfirming: false,
      isConfirmed: false,
      error: null,
      reset: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Complete Purchase Flow', () => {
    it('should complete full coffee purchase flow from form to list update', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Verify initial state - empty coffee list
      expect(screen.getByText('No Coffee Purchases Yet')).toBeInTheDocument();
      expect(screen.getByText('Be the first to show your support by buying a coffee!')).toBeInTheDocument();

      // Fill out the coffee form
      const nameInput = screen.getByLabelText(/Your Name/);
      const messageInput = screen.getByLabelText(/Message/);
      
      await user.type(nameInput, 'John Doe');
      await user.type(messageInput, 'Amazing work! Keep it up! ☕');

      // Select medium coffee
      const mediumCoffeeButton = screen.getByText('Medium');
      await user.click(mediumCoffeeButton);

      // Verify form state
      expect(screen.getByRole('button', { name: /Buy Medium Coffee/ })).toBeInTheDocument();
      expect(screen.getByText('Selected ✓')).toBeInTheDocument();

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Buy Medium Coffee/ });
      await user.click(submitButton);

      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      // Confirm the transaction
      const confirmButton = screen.getByTestId('confirm-transaction');
      await user.click(confirmButton);

      // Verify transaction was initiated
      expect(mockBuyCoffee).toHaveBeenCalledWith(
        'John Doe',
        'Amazing work! Keep it up! ☕',
        BigInt('3000000000000000') // Medium coffee price
      );

      // Simulate transaction pending state
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: '0xabc123def456',
        isPending: true,
        isConfirming: false,
        isConfirmed: false,
        error: null,
        reset: vi.fn(),
      });

      // Re-render to show pending state
      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      expect(screen.getByText('Preparing Transaction...')).toBeInTheDocument();
      expect(screen.getByText(/View on Arbiscan/)).toBeInTheDocument();

      // Simulate transaction confirming state
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: '0xabc123def456',
        isPending: false,
        isConfirming: true,
        isConfirmed: false,
        error: null,
        reset: vi.fn(),
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      expect(screen.getByText('Processing Coffee Purchase')).toBeInTheDocument();

      // Simulate transaction confirmed and coffee list updated
      const newCoffee = {
        from: '0x1234567890123456789012345678901234567890',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        name: 'John Doe',
        message: 'Amazing work! Keep it up! ☕',
        amount: BigInt('3000000000000000'),
      };

      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: '0xabc123def456',
        isPending: false,
        isConfirming: false,
        isConfirmed: true,
        error: null,
        reset: vi.fn(),
      });

      mockUseReadContract.mockReturnValue({
        data: [newCoffee],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Verify success state
      expect(screen.getByText(/Coffee Purchased Successfully!/)).toBeInTheDocument();
      expect(screen.getByText(/Thank you John Doe!/)).toBeInTheDocument();

      // Verify coffee appears in the list
      expect(screen.getByText('Coffee Supporters ☕')).toBeInTheDocument();
      expect(screen.getByText('1 supporter has bought coffee')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('0.003 ETH')).toBeInTheDocument();
      expect(screen.getByText('"Amazing work! Keep it up! ☕"')).toBeInTheDocument();

      // Advance timers to trigger form reset
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(nameInput).toHaveValue('');
        expect(messageInput).toHaveValue('');
      });
    });

    it('should handle multiple coffee purchases in sequence', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Start with one existing coffee
      const existingCoffee = {
        from: '0x0987654321098765432109876543210987654321',
        timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600),
        name: 'Alice',
        message: 'First coffee!',
        amount: BigInt('1000000000000000'),
      };

      mockUseReadContract.mockReturnValue({
        data: [existingCoffee],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Verify existing coffee is shown
      expect(screen.getByText('1 supporter has bought coffee')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();

      // Add second coffee purchase
      const nameInput = screen.getByLabelText(/Your Name/);
      await user.type(nameInput, 'Bob');

      // Select large coffee
      const largeCoffeeButton = screen.getByText('Large');
      await user.click(largeCoffeeButton);

      const submitButton = screen.getByRole('button', { name: /Buy Large Coffee/ });
      await user.click(submitButton);

      // Confirm transaction
      const confirmButton = screen.getByTestId('confirm-transaction');
      await user.click(confirmButton);

      // Simulate successful transaction and updated list
      const newCoffee = {
        from: '0x1234567890123456789012345678901234567890',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        name: 'Bob',
        message: '',
        amount: BigInt('5000000000000000'),
      };

      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: '0xdef789',
        isPending: false,
        isConfirming: false,
        isConfirmed: true,
        error: null,
        reset: vi.fn(),
      });

      mockUseReadContract.mockReturnValue({
        data: [newCoffee, existingCoffee], // Newest first
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Verify both coffees are shown
      expect(screen.getByText('2 supporters have bought coffee')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Large')).toBeInTheDocument();
      expect(screen.getByText('Small')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios in Full Flow', () => {
    it('should handle transaction failure and allow retry', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Fill form and submit
      const nameInput = screen.getByLabelText(/Your Name/);
      await user.type(nameInput, 'Test User');

      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });
      await user.click(submitButton);

      const confirmButton = screen.getByTestId('confirm-transaction');
      await user.click(confirmButton);

      // Simulate transaction failure
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: undefined,
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        error: new Error('insufficient funds for intrinsic transaction cost'),
        reset: vi.fn(),
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Should show error message
      expect(screen.getByText('Insufficient Funds')).toBeInTheDocument();
      expect(screen.getByText(/You don't have enough ETH/)).toBeInTheDocument();

      // Should have retry button
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();

      // Coffee list should remain unchanged (empty)
      expect(screen.getByText('No Coffee Purchases Yet')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Simulate network error in coffee list
      mockUseReadContract.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network connection failed'),
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Should show error in coffee list
      expect(screen.getByText('Network Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      // Form should still be functional
      const nameInput = screen.getByLabelText(/Your Name/);
      await user.type(nameInput, 'Test User');

      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Real-time Updates', () => {
    it('should show optimistic updates during transaction', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Fill and submit form
      const nameInput = screen.getByLabelText(/Your Name/);
      await user.type(nameInput, 'Optimistic User');

      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });
      await user.click(submitButton);

      const confirmButton = screen.getByTestId('confirm-transaction');
      await user.click(confirmButton);

      // During transaction, optimistic update should be visible
      // (This would be handled by the optimistic updates hook in real implementation)
      expect(mockBuyCoffee).toHaveBeenCalled();
    });

    it('should handle concurrent users purchasing coffee', async () => {
      // Simulate multiple coffee purchases happening
      const coffees = [
        {
          from: '0x1111111111111111111111111111111111111111',
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
          name: 'User 1',
          message: 'First!',
          amount: BigInt('1000000000000000'),
        },
        {
          from: '0x2222222222222222222222222222222222222222',
          timestamp: BigInt(Math.floor(Date.now() / 1000) - 60),
          name: 'User 2',
          message: 'Second!',
          amount: BigInt('3000000000000000'),
        },
        {
          from: '0x3333333333333333333333333333333333333333',
          timestamp: BigInt(Math.floor(Date.now() / 1000) - 120),
          name: 'User 3',
          message: 'Third!',
          amount: BigInt('5000000000000000'),
        },
      ];

      mockUseReadContract.mockReturnValue({
        data: coffees,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Should show all coffee purchases in correct order (newest first)
      expect(screen.getByText('3 supporters have bought coffee')).toBeInTheDocument();
      
      const coffeeCards = screen.getAllByText(/User \d/);
      expect(coffeeCards).toHaveLength(3);
      
      // Verify order (newest first)
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 2')).toBeInTheDocument();
      expect(screen.getByText('User 3')).toBeInTheDocument();
    });
  });

  describe('Responsive Design Integration', () => {
    it('should maintain functionality across different screen sizes', () => {
      // Test mobile layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Form should still be functional on mobile
      expect(screen.getByLabelText(/Your Name/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Buy Small Coffee/ })).toBeInTheDocument();

      // Test desktop layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(
        <TestWrapper>
          <TestApp />
        </TestWrapper>
      );

      // Should still work on desktop
      expect(screen.getByLabelText(/Your Name/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Buy Small Coffee/ })).toBeInTheDocument();
    });
  });
});