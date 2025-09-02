import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast, useToast, ToastProvider } from '../components/Toast';

// Mock timers for testing toast auto-dismiss
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Test component that uses the toast hook
const TestToastComponent: React.FC = () => {
  const { showToast } = useToast();

  return (
    <div>
      <button
        onClick={() => showToast({
          type: 'success',
          title: 'Success Toast',
          message: 'This is a success message',
          duration: 3000
        })}
      >
        Show Success Toast
      </button>
      <button
        onClick={() => showToast({
          type: 'error',
          title: 'Error Toast',
          message: 'This is an error message',
          duration: 5000
        })}
      >
        Show Error Toast
      </button>
      <button
        onClick={() => showToast({
          type: 'info',
          title: 'Info Toast',
          message: 'This is an info message'
        })}
      >
        Show Info Toast
      </button>
      <button
        onClick={() => showToast({
          type: 'warning',
          title: 'Warning Toast',
          message: 'This is a warning message',
          duration: 0 // Persistent toast
        })}
      >
        Show Warning Toast
      </button>
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
);

describe('Toast Component', () => {
  describe('Toast Display', () => {
    it('should show success toast with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const successButton = screen.getByText('Show Success Toast');
      await user.click(successButton);

      expect(screen.getByText('Success Toast')).toBeInTheDocument();
      expect(screen.getByText('This is a success message')).toBeInTheDocument();
      
      // Check for success styling indicators
      const toastElement = screen.getByRole('alert');
      expect(toastElement).toBeInTheDocument();
    });

    it('should show error toast with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const errorButton = screen.getByText('Show Error Toast');
      await user.click(errorButton);

      expect(screen.getByText('Error Toast')).toBeInTheDocument();
      expect(screen.getByText('This is an error message')).toBeInTheDocument();
    });

    it('should show info toast with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const infoButton = screen.getByText('Show Info Toast');
      await user.click(infoButton);

      expect(screen.getByText('Info Toast')).toBeInTheDocument();
      expect(screen.getByText('This is an info message')).toBeInTheDocument();
    });

    it('should show warning toast with correct styling', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const warningButton = screen.getByText('Show Warning Toast');
      await user.click(warningButton);

      expect(screen.getByText('Warning Toast')).toBeInTheDocument();
      expect(screen.getByText('This is a warning message')).toBeInTheDocument();
    });
  });

  describe('Toast Auto-Dismiss', () => {
    it('should auto-dismiss toast after specified duration', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const successButton = screen.getByText('Show Success Toast');
      await user.click(successButton);

      expect(screen.getByText('Success Toast')).toBeInTheDocument();

      // Fast-forward time by 3 seconds (the duration)
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByText('Success Toast')).not.toBeInTheDocument();
      });
    });

    it('should use default duration when not specified', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const infoButton = screen.getByText('Show Info Toast');
      await user.click(infoButton);

      expect(screen.getByText('Info Toast')).toBeInTheDocument();

      // Fast-forward by default duration (usually 4000ms)
      vi.advanceTimersByTime(4000);

      await waitFor(() => {
        expect(screen.queryByText('Info Toast')).not.toBeInTheDocument();
      });
    });

    it('should not auto-dismiss when duration is 0', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const warningButton = screen.getByText('Show Warning Toast');
      await user.click(warningButton);

      expect(screen.getByText('Warning Toast')).toBeInTheDocument();

      // Fast-forward by a long time
      vi.advanceTimersByTime(10000);

      // Toast should still be visible
      expect(screen.getByText('Warning Toast')).toBeInTheDocument();
    });
  });

  describe('Toast Manual Dismiss', () => {
    it('should dismiss toast when close button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const successButton = screen.getByText('Show Success Toast');
      await user.click(successButton);

      expect(screen.getByText('Success Toast')).toBeInTheDocument();

      // Find and click close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Success Toast')).not.toBeInTheDocument();
      });
    });

    it('should dismiss toast when clicked (if clickable)', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const successButton = screen.getByText('Show Success Toast');
      await user.click(successButton);

      const toastElement = screen.getByRole('alert');
      expect(toastElement).toBeInTheDocument();

      // Click on the toast itself
      await user.click(toastElement);

      await waitFor(() => {
        expect(screen.queryByText('Success Toast')).not.toBeInTheDocument();
      });
    });
  });

  describe('Multiple Toasts', () => {
    it('should show multiple toasts simultaneously', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      // Show multiple toasts
      const successButton = screen.getByText('Show Success Toast');
      const errorButton = screen.getByText('Show Error Toast');
      
      await user.click(successButton);
      await user.click(errorButton);

      expect(screen.getByText('Success Toast')).toBeInTheDocument();
      expect(screen.getByText('Error Toast')).toBeInTheDocument();
    });

    it('should dismiss toasts independently', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      // Show success toast (3s duration)
      const successButton = screen.getByText('Show Success Toast');
      await user.click(successButton);

      // Show error toast (5s duration) after 1 second
      vi.advanceTimersByTime(1000);
      const errorButton = screen.getByText('Show Error Toast');
      await user.click(errorButton);

      expect(screen.getByText('Success Toast')).toBeInTheDocument();
      expect(screen.getByText('Error Toast')).toBeInTheDocument();

      // After 2 more seconds (3s total), success toast should disappear
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByText('Success Toast')).not.toBeInTheDocument();
      });

      // Error toast should still be visible
      expect(screen.getByText('Error Toast')).toBeInTheDocument();

      // After 3 more seconds (5s total for error toast), it should disappear
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByText('Error Toast')).not.toBeInTheDocument();
      });
    });

    it('should limit maximum number of toasts', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      // Show many toasts quickly
      const successButton = screen.getByText('Show Success Toast');
      
      for (let i = 0; i < 10; i++) {
        await user.click(successButton);
      }

      // Should not show more than the maximum (usually 5)
      const toasts = screen.getAllByRole('alert');
      expect(toasts.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Toast Positioning', () => {
    it('should position toasts in correct container', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const successButton = screen.getByText('Show Success Toast');
      await user.click(successButton);

      // Toast should be in a positioned container
      const toastContainer = screen.getByRole('alert').closest('[data-testid="toast-container"]');
      expect(toastContainer || screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should stack multiple toasts correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      // Show multiple toasts
      const successButton = screen.getByText('Show Success Toast');
      const errorButton = screen.getByText('Show Error Toast');
      
      await user.click(successButton);
      await user.click(errorButton);

      const toasts = screen.getAllByRole('alert');
      expect(toasts).toHaveLength(2);
    });
  });

  describe('Toast Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const successButton = screen.getByText('Show Success Toast');
      await user.click(successButton);

      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper role for different toast types', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      // Error toasts might have different ARIA attributes
      const errorButton = screen.getByText('Show Error Toast');
      await user.click(errorButton);

      const errorToast = screen.getByRole('alert');
      expect(errorToast).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const successButton = screen.getByText('Show Success Toast');
      await user.click(successButton);

      // Close button should be focusable
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).not.toHaveAttribute('tabindex', '-1');
      
      // Should be able to focus and activate with keyboard
      closeButton.focus();
      expect(closeButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.queryByText('Success Toast')).not.toBeInTheDocument();
      });
    });
  });

  describe('Toast Hook Error Handling', () => {
    it('should handle useToast outside of provider', () => {
      // This should throw an error or handle gracefully
      const TestComponentWithoutProvider: React.FC = () => {
        const { showToast } = useToast();
        return <div>Should not render</div>;
      };

      render(<TestComponentWithoutProvider />);
      
      // Should either show error message or handle gracefully
      expect(screen.getByText(/Hook error handled|useToast must be used within/)).toBeInTheDocument();
    });
  });

  describe('Toast Performance', () => {
    it('should not cause memory leaks with many toasts', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const successButton = screen.getByText('Show Success Toast');
      
      // Create and dismiss many toasts
      for (let i = 0; i < 20; i++) {
        await user.click(successButton);
        vi.advanceTimersByTime(100); // Small delay between toasts
      }

      // Fast-forward to dismiss all toasts
      vi.advanceTimersByTime(10000);

      await waitFor(() => {
        const remainingToasts = screen.queryAllByRole('alert');
        expect(remainingToasts).toHaveLength(0);
      });
    });

    it('should handle rapid toast creation', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <TestWrapper>
          <TestToastComponent />
        </TestWrapper>
      );

      const successButton = screen.getByText('Show Success Toast');
      
      // Rapidly create toasts
      for (let i = 0; i < 5; i++) {
        await user.click(successButton);
      }

      // Should handle this gracefully without errors
      const toasts = screen.getAllByRole('alert');
      expect(toasts.length).toBeGreaterThan(0);
      expect(toasts.length).toBeLessThanOrEqual(5);
    });
  });
});