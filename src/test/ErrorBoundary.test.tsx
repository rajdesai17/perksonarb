import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '../components/ErrorBoundary';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = false, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Test component that uses error handler hook
const ComponentWithErrorHandler: React.FC = () => {
  const { handleError } = useErrorHandler();
  
  const triggerError = () => {
    handleError(new Error('Handled error'));
  };

  return (
    <div>
      <button onClick={triggerError}>Trigger Error</button>
      <div>Component content</div>
    </div>
  );
};

describe('ErrorBoundary Component', () => {
  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Component crashed" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should display custom error message when provided', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Custom error message" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      // Error boundary should show generic message, not expose internal error
      expect(screen.queryByText('Custom error message')).not.toBeInTheDocument();
    });

    it('should show retry button that resets error state', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should show refresh page option', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });
  });

  describe('Error Information Display', () => {
    it('should show error details in development mode', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Development error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production mode', () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Production error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('Production error')).not.toBeInTheDocument();
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Logging', () => {
    it('should log errors to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Logged error" />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  const TestComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
    if (shouldThrow) {
      throw new Error('HOC test error');
    }
    return <div>HOC wrapped component</div>;
  };

  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    render(<WrappedComponent />);
    
    expect(screen.getByText('HOC wrapped component')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    render(<WrappedComponent shouldThrow={true} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('HOC wrapped component')).not.toBeInTheDocument();
  });

  it('should pass props to wrapped component', () => {
    const PropsComponent: React.FC<{ testProp: string }> = ({ testProp }) => (
      <div>{testProp}</div>
    );
    
    const WrappedComponent = withErrorBoundary(PropsComponent);
    
    render(<WrappedComponent testProp="Test prop value" />);
    
    expect(screen.getByText('Test prop value')).toBeInTheDocument();
  });
});

describe('useErrorHandler Hook', () => {
  it('should provide error handling function', () => {
    render(
      <ErrorBoundary>
        <ComponentWithErrorHandler />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component content')).toBeInTheDocument();
    expect(screen.getByText('Trigger Error')).toBeInTheDocument();
  });

  it('should handle errors when handleError is called', async () => {
    const user = userEvent.setup();
    
    render(
      <ErrorBoundary>
        <ComponentWithErrorHandler />
      </ErrorBoundary>
    );

    const triggerButton = screen.getByText('Trigger Error');
    await user.click(triggerButton);

    // Error should be caught by boundary
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

describe('Error Boundary Edge Cases', () => {
  it('should handle errors during render', () => {
    const RenderErrorComponent: React.FC = () => {
      // Simulate render error
      const obj: any = null;
      return <div>{obj.nonExistentProperty}</div>;
    };

    render(
      <ErrorBoundary>
        <RenderErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should handle errors in useEffect', () => {
    const EffectErrorComponent: React.FC = () => {
      React.useEffect(() => {
        throw new Error('Effect error');
      }, []);

      return <div>Component with effect error</div>;
    };

    // Note: useEffect errors are not caught by error boundaries in React
    // This test documents the expected behavior
    render(
      <ErrorBoundary>
        <EffectErrorComponent />
      </ErrorBoundary>
    );

    // Component should render normally as useEffect errors aren't caught
    expect(screen.getByText('Component with effect error')).toBeInTheDocument();
  });

  it('should handle nested error boundaries', () => {
    render(
      <ErrorBoundary>
        <div>Outer boundary</div>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // Inner boundary should catch the error
    expect(screen.getByText('Outer boundary')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should handle multiple errors', async () => {
    const user = userEvent.setup();
    
    const MultiErrorComponent: React.FC<{ errorCount: number }> = ({ errorCount }) => {
      if (errorCount > 0) {
        throw new Error(`Error ${errorCount}`);
      }
      return <div>No errors</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <MultiErrorComponent errorCount={0} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No errors')).toBeInTheDocument();

    // First error
    rerender(
      <ErrorBoundary>
        <MultiErrorComponent errorCount={1} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Reset and try again
    const retryButton = screen.getByText('Try Again');
    await user.click(retryButton);

    rerender(
      <ErrorBoundary>
        <MultiErrorComponent errorCount={0} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No errors')).toBeInTheDocument();
  });
});

describe('Error Boundary Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toBeInTheDocument();
  });

  it('should have focusable retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).not.toHaveAttribute('tabindex', '-1');
  });

  it('should have proper heading structure', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Something went wrong');
  });
});