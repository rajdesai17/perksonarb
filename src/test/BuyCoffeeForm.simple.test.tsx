import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  })),
}));

// Mock contract hooks
vi.mock('../lib/useContract', () => ({
  useBuyCoffee: vi.fn(() => ({
    buyCoffee: vi.fn(),
    hash: undefined,
    isPending: false,
    isConfirming: false,
    isConfirmed: false,
    error: null,
  })),
  COFFEE_PRICES: {
    small: BigInt('1000000000000000'),
    medium: BigInt('3000000000000000'),
    large: BigInt('5000000000000000'),
  },
}));

import BuyCoffeeForm from '../components/BuyCoffeeForm';

describe('BuyCoffeeForm Basic Tests', () => {
  it('should render without crashing', () => {
    render(<BuyCoffeeForm />);
    expect(screen.getByText('Buy Me a Coffee ☕')).toBeInTheDocument();
  });

  it('should display coffee size options', () => {
    render(<BuyCoffeeForm />);
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('should display form inputs', () => {
    render(<BuyCoffeeForm />);
    expect(screen.getByLabelText(/Your Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
  });
});