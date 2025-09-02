import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CoffeeList from '../components/CoffeeList';
import { useReadContract } from 'wagmi';

// Mock wagmi hook
vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
}));

// Mock contract configuration
vi.mock('../lib/useContract', () => ({
  CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
  CONTRACT_ABI: [],
}));

const mockUseReadContract = useReadContract as any;

describe('CoffeeList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state', () => {
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<CoffeeList />);
    
    expect(screen.getByText('Loading recent supporters...')).toBeInTheDocument();
    expect(screen.getByText('Fetching coffee purchases from the blockchain')).toBeInTheDocument();
  });

  it('should display empty state when no coffees exist', () => {
    mockUseReadContract.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CoffeeList />);
    
    expect(screen.getByText('No Coffee Purchases Yet')).toBeInTheDocument();
    expect(screen.getByText('Be the first to show your support by buying a coffee!')).toBeInTheDocument();
  });

  it('should display error state with retry button', () => {
    const mockRefetch = vi.fn();
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    render(<CoffeeList />);
    
    expect(screen.getByText('Unable to Load Coffee History')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should display coffee purchases correctly', () => {
    const mockCoffees = [
      {
        from: '0x1234567890123456789012345678901234567890',
        timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
        name: 'John Doe',
        message: 'Great work!',
        amount: BigInt('1000000000000000'), // 0.001 ETH
      },
      {
        from: '0x0987654321098765432109876543210987654321',
        timestamp: BigInt(Math.floor(Date.now() / 1000) - 7200), // 2 hours ago
        name: 'Jane Smith',
        message: '',
        amount: BigInt('3000000000000000'), // 0.003 ETH
      },
    ];

    mockUseReadContract.mockReturnValue({
      data: mockCoffees,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CoffeeList />);
    
    expect(screen.getByText('Coffee Supporters ☕')).toBeInTheDocument();
    expect(screen.getByText('2 supporters have bought coffee')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    // Check that the message appears in the document
    expect(document.body.textContent).toContain('Great work!');
  });

  it('should format addresses correctly', () => {
    const mockCoffees = [
      {
        from: '0x1234567890123456789012345678901234567890',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        name: 'Test User',
        message: '',
        amount: BigInt('1000000000000000'),
      },
    ];

    mockUseReadContract.mockReturnValue({
      data: mockCoffees,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CoffeeList />);
    
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
  });

  it('should show correct coffee size based on amount', () => {
    const mockCoffees = [
      {
        from: '0x1234567890123456789012345678901234567890',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        name: 'Small Coffee',
        message: '',
        amount: BigInt('1000000000000000'), // 0.001 ETH - Small
      },
      {
        from: '0x0987654321098765432109876543210987654321',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        name: 'Large Coffee',
        message: '',
        amount: BigInt('5000000000000000'), // 0.005 ETH - Large
      },
    ];

    mockUseReadContract.mockReturnValue({
      data: mockCoffees,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<CoffeeList />);
    
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
  });
});