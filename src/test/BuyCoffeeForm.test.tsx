import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAccount } from 'wagmi';
import BuyCoffeeForm from '../components/BuyCoffeeForm';
import { useBuyCoffee } from '../lib/useContract';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}));

// Mock contract hooks
vi.mock('../lib/useContract', () => ({
  useBuyCoffee: vi.fn(),
  COFFEE_PRICES: {
    small: BigInt('1000000000000000'),
    medium: BigInt('3000000000000000'),
    large: BigInt('5000000000000000'),
  },
}));

const mockUseAccount = useAccount as any;
const mockUseBuyCoffee = useBuyCoffee as any;

describe('BuyCoffeeForm', () => {
  const mockBuyCoffee = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    } as any);
    
    mockUseBuyCoffee.mockReturnValue({
      buyCoffee: mockBuyCoffee,
      hash: undefined,
      isPending: false,
      isConfirming: false,
      isConfirmed: false,
      error: null,
    });
  });

  describe('Component Rendering', () => {
    it('should render the coffee purchase form with all elements', () => {
      render(<BuyCoffeeForm />);
      
      // Check title and description
      expect(screen.getByText('Buy Me a Coffee ☕')).toBeInTheDocument();
      expect(screen.getByText('Support my work with a crypto coffee!')).toBeInTheDocument();
      
      // Check coffee size options
      expect(screen.getByText('Small')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Large')).toBeInTheDocument();
      
      // Check form inputs
      expect(screen.getByLabelText(/Your Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
      
      // Check submit button
      expect(screen.getByRole('button', { name: /Buy Small Coffee/ })).toBeInTheDocument();
    });

    it('should display coffee size options with correct prices', () => {
      render(<BuyCoffeeForm />);
      
      expect(screen.getByText('0.001 ETH')).toBeInTheDocument();
      expect(screen.getByText('0.003 ETH')).toBeInTheDocument();
      expect(screen.getByText('0.005 ETH')).toBeInTheDocument();
    });
  });

  describe('Coffee Size Selection', () => {
    it('should allow selecting different coffee sizes', async () => {
      const user = userEvent.setup();
      render(<BuyCoffeeForm />);
      
      // Initially small should be selected
      expect(screen.getByRole('button', { name: /Buy Small Coffee/ })).toBeInTheDocument();
      
      // Click medium coffee
      await user.click(screen.getByText('Medium'));
      expect(screen.getByRole('button', { name: /Buy Medium Coffee/ })).toBeInTheDocument();
      
      // Click large coffee
      await user.click(screen.getByText('Large'));
      expect(screen.getByRole('button', { name: /Buy Large Coffee/ })).toBeInTheDocument();
    });

    it('should show selected state for chosen coffee size', async () => {
      const user = userEvent.setup();
      render(<BuyCoffeeForm />);
      
      // Click medium coffee
      await user.click(screen.getByText('Medium'));
      
      // Should show selected indicator
      expect(screen.getByText('Selected ✓')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required name field', async () => {
      const user = userEvent.setup();
      render(<BuyCoffeeForm />);
      
      const nameInput = screen.getByLabelText(/Your Name/);
      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });
      
      // Submit without name should show validation error
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      
      // Button should be disabled when form is invalid
      expect(submitButton).toBeDisabled();
    });

    it('should validate name length (max 50 characters)', async () => {
      const user = userEvent.setup();
      render(<BuyCoffeeForm />);
      
      const nameInput = screen.getByLabelText(/Your Name/);
      const longName = 'a'.repeat(51);
      
      await user.type(nameInput, longName);
      
      await waitFor(() => {
        expect(screen.getByText('Name must be 50 characters or less')).toBeInTheDocument();
      });
    });

    it('should validate name characters', async () => {
      const user = userEvent.setup();
      render(<BuyCoffeeForm />);
      
      const nameInput = screen.getByLabelText(/Your Name/);
      
      await user.type(nameInput, 'invalid@name#');
      
      await waitFor(() => {
        expect(screen.getByText('Name contains invalid characters')).toBeInTheDocument();
      });
    });

    it('should validate message length (max 280 characters)', async () => {
      const user = userEvent.setup();
      render(<BuyCoffeeForm />);
      
      const messageInput = screen.getByLabelText(/Message/);
      const longMessage = 'a'.repeat(281);
      
      await user.type(messageInput, longMessage);
      
      await waitFor(() => {
        expect(screen.getByText('Message must be 280 characters or less')).toBeInTheDocument();
      });
    });

    it('should show character counts for inputs', async () => {
      const user = userEvent.setup();
      render(<BuyCoffeeForm />);
      
      const nameInput = screen.getByLabelText(/Your Name/);
      const messageInput = screen.getByLabelText(/Message/);
      
      await user.type(nameInput, 'John');
      await user.type(messageInput, 'Great work!');
      
      expect(screen.getByText('4/50 characters')).toBeInTheDocument();
      expect(screen.getByText('11/280 characters')).toBeInTheDocument();
    });
  });

  describe('Transaction Handling', () => {
    it('should call buyCoffee with correct parameters when form is submitted', async () => {
      const user = userEvent.setup();
      render(<BuyCoffeeForm />);
      
      const nameInput = screen.getByLabelText(/Your Name/);
      const messageInput = screen.getByLabelText(/Message/);
      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });
      
      await user.type(nameInput, 'John Doe');
      await user.type(messageInput, 'Keep up the great work!');
      await user.click(submitButton);
      
      expect(mockBuyCoffee).toHaveBeenCalledWith(
        'John Doe',
        'Keep up the great work!',
        BigInt('1000000000000000') // Small coffee price
      );
    });

    it('should show pending state during transaction', () => {
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: undefined,
        isPending: true,
        isConfirming: false,
        isConfirmed: false,
        error: null,
      });
      
      render(<BuyCoffeeForm />);
      
      expect(screen.getByText('Preparing Transaction...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show confirming state during transaction confirmation', () => {
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: '0xabc123',
        isPending: false,
        isConfirming: true,
        isConfirmed: false,
        error: null,
      });
      
      render(<BuyCoffeeForm />);
      
      expect(screen.getByText('Confirming Transaction...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show success message when transaction is confirmed', () => {
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: '0xabc123',
        isPending: false,
        isConfirming: false,
        isConfirmed: true,
        error: null,
      });
      
      render(<BuyCoffeeForm />);
      
      // Fill in name to see success message with name
      const nameInput = screen.getByLabelText(/Your Name/);
      fireEvent.change(nameInput, { target: { value: 'John' } });
      
      expect(screen.getByText(/Thank you John! Coffee purchased successfully!/)).toBeInTheDocument();
    });

    it('should show transaction hash link when available', () => {
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: '0xabc123',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        error: null,
      });
      
      render(<BuyCoffeeForm />);
      
      const link = screen.getByText('View on Arbiscan ↗');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', 'https://arbiscan.io/tx/0xabc123');
    });
  });

  describe('Error Handling', () => {
    it('should show user-friendly error for rejected transaction', () => {
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: undefined,
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        error: new Error('User rejected the request'),
      });
      
      render(<BuyCoffeeForm />);
      
      expect(screen.getByText('Transaction was cancelled by user')).toBeInTheDocument();
    });

    it('should show user-friendly error for insufficient funds', () => {
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: undefined,
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        error: new Error('insufficient funds for intrinsic transaction cost'),
      });
      
      render(<BuyCoffeeForm />);
      
      expect(screen.getByText('Insufficient funds for this transaction')).toBeInTheDocument();
    });

    it('should show generic error for unknown errors', () => {
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: undefined,
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        error: new Error('Unknown error occurred'),
      });
      
      render(<BuyCoffeeForm />);
      
      expect(screen.getByText('Transaction failed. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Wallet Connection', () => {
    it('should show wallet connection message when not connected', () => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      } as any);
      
      render(<BuyCoffeeForm />);
      
      expect(screen.getByText('Connect Wallet to Buy Coffee')).toBeInTheDocument();
      expect(screen.getByText(/Please connect your wallet to buy coffee/)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should enable form when wallet is connected', () => {
      render(<BuyCoffeeForm />);
      
      const nameInput = screen.getByLabelText(/Your Name/);
      fireEvent.change(nameInput, { target: { value: 'John' } });
      
      const submitButton = screen.getByRole('button', { name: /Buy Small Coffee/ });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Reset', () => {
    it('should reset form after successful transaction', async () => {
      // Start with confirmed transaction
      mockUseBuyCoffee.mockReturnValue({
        buyCoffee: mockBuyCoffee,
        hash: '0xabc123',
        isPending: false,
        isConfirming: false,
        isConfirmed: true,
        error: null,
      });
      
      const { rerender } = render(<BuyCoffeeForm />);
      
      // Fill form
      const nameInput = screen.getByLabelText(/Your Name/);
      const messageInput = screen.getByLabelText(/Message/);
      
      fireEvent.change(nameInput, { target: { value: 'John' } });
      fireEvent.change(messageInput, { target: { value: 'Great work!' } });
      
      // Wait for form reset (mocked timer)
      await waitFor(() => {
        // After reset, form should be cleared
        expect(nameInput).toHaveValue('');
        expect(messageInput).toHaveValue('');
      }, { timeout: 4000 });
    });
  });
});