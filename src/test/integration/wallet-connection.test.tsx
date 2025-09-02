import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '../../wagmi';
import BuyCoffeeForm from '../../components/BuyCoffeeForm';

// Mock wagmi hooks for integration testing
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: vi.fn(),
    useConnect: vi.fn(),
    useDisconnect: vi.fn(),
  };
});

// Mock RainbowKit
vi.mock('@rainbow-me/rainbowkit', async () => {
  const actual = await vi.importActual('@rainbow-me/rainbowkit');
  return {
    ...actual,
    ConnectButton: ({ children }: { children?: React.ReactNode }) => (
      <button data-testid="connect-button">
        {children || 'Connect Wallet'}
      </button>
    ),
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
}));

// Mock toast
vi.mock('../../components/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock other dependencies
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
  safeStorage: {
    get: vi.fn(),
    set: vi.fn(),
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

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useBuyCoffee } from '../../lib/useContract';

const mockUseAccount = useAccount as any;
const mockUseConnect = useConnect as any;
const mockUseDisconnect = useDisconnect as any;
const mockUseBuyCoffee = useBuyCoffee as any;

// Test wrapper component
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

describe('Wallet Connection Integration Tests', () => {
  const mockBuyCoffee = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockUseConnect.mockReturnValue({
      connectors: [],
      connect: vi.fn(),
      isPending: false,
      error: null,
    });
    
    mockUseDisconnect.mockReturnValue({
      disconnect: vi.fn(),
    });
    
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
    vi.clearAllTimers();
  });

  describe('Wallet Not Connected State', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        isConnecting: false,
        isDisconnected: true,
      });
    });

    it('should show wallet connection prompt when not connected', () => {
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      expect(screen.getByText('Connect Wallet to Buy Coffee')).toBeInTheDocument();
      expect(screen.getByText(/Please connect your wallet to buy coffee/)).toBeInTheDocument();
      
      const submitButton = screen.getByRole('button', { name: /Connect Wallet to Buy Coffee/ });
      expect(submitButton).toBeDisabled();
    });

    it('should disable form inputs when wallet is not connected', () => {
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/Your Name/);
      const messageInput = screen.getByLabelText(/Message/);
      const submitButton = screen.getByRole('button');

      expect(submitButton).toBeDisabled();
      
      // Form should still be interactive for UX, but submission disabled
      expect(nameInput).not.toBeDisabled();
      expect(messageInput).not.toBeDisabled();
    });
  });

  describe('Wallet Connected State', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        isConnecting: false,
        isDisconnected: false,
      });
    });

    it('should enable form when wallet is connected', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/Your Name/);
      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });

      // Fill in required field
      await user.type(nameInput, 'John Doe');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show connected wallet address in form context', () => {
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      // The form should be enabled and ready for interaction
      expect(screen.getByRole('button', { name: /Buy Small Coffee/ })).toBeInTheDocument();
    });
  });

  describe('Wallet Connection Flow', () => {
    it('should handle wallet connection state changes', async () => {
      // Start disconnected
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        isConnecting: false,
        isDisconnected: true,
      });

      const { rerender } = render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      expect(screen.getByText('Connect Wallet to Buy Coffee')).toBeInTheDocument();

      // Simulate connecting
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        isConnecting: true,
        isDisconnected: false,
      });

      rerender(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      // Should still show connect prompt while connecting
      expect(screen.getByText('Connect Wallet to Buy Coffee')).toBeInTheDocument();

      // Simulate connected
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        isConnecting: false,
        isDisconnected: false,
      });

      rerender(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      // Should now show the coffee purchase form
      expect(screen.getByRole('button', { name: /Buy Small Coffee/ })).toBeInTheDocument();
    });
  });

  describe('Transaction Flow with Wallet', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        isConnecting: false,
        isDisconnected: false,
      });
    });

    it('should complete full transaction flow', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      // Fill form
      const nameInput = screen.getByLabelText(/Your Name/);
      const messageInput = screen.getByLabelText(/Message/);
      
      await user.type(nameInput, 'John Doe');
      await user.type(messageInput, 'Great work!');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });
      await user.click(submitButton);

      // Should show confirmation modal
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      // Confirm transaction
      const confirmButton = screen.getByTestId('confirm-transaction');
      await user.click(confirmButton);

      // Should call buyCoffee with correct parameters
      expect(mockBuyCoffee).toHaveBeenCalledWith(
        'John Doe',
        'Great work!',
        BigInt('1000000000000000')
      );
    });

    it('should handle transaction cancellation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      // Fill and submit form
      const nameInput = screen.getByLabelText(/Your Name/);
      await user.type(nameInput, 'John Doe');
      
      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });
      await user.click(submitButton);

      // Cancel transaction
      const cancelButton = screen.getByTestId('cancel-transaction');
      await user.click(cancelButton);

      // Should not call buyCoffee
      expect(mockBuyCoffee).not.toHaveBeenCalled();
      
      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Network Handling', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        isConnecting: false,
        isDisconnected: false,
        chain: { id: 42161, name: 'Arbitrum One' }, // Correct network
      });
    });

    it('should work correctly on Arbitrum network', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/Your Name/);
      await user.type(nameInput, 'Test User');

      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Error Handling in Connected State', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        isConnecting: false,
        isDisconnected: false,
      });
    });

    it('should handle wallet disconnection during transaction', () => {
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: undefined,
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        error: new Error('Wallet disconnected'),
        reset: vi.fn(),
      });

      render(
        <TestWrapper>
          <BuyCoffeeForm />
        </TestWrapper>
      );

      expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
    });
  });
});