import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Error boundary state interface
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * Error boundary props interface
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'section' | 'component';
}

/**
 * Error logging service (placeholder - replace with actual logging service)
 */
class ErrorLogger {
  static log(error: Error, errorInfo: ErrorInfo, errorId: string) {
    // In production, send to error reporting service (e.g., Sentry, LogRocket)
    console.group(`🚨 Error Boundary Caught Error [${errorId}]`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Stack Trace:', error.stack);
    console.groupEnd();
    
    // TODO: Send to error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo, tags: { errorId } });
  }
}

/**
 * Main Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state;
    
    // Log error
    ErrorLogger.log(error, errorInfo, errorId);
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render appropriate error UI based on level
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { level = 'component', showDetails = false } = this.props;
    const { error, errorId } = this.state;

    switch (level) {
      case 'page':
        return this.renderPageError();
      case 'section':
        return this.renderSectionError();
      default:
        return this.renderComponentError();
    }
  }

  private renderPageError() {
    const { error, errorId } = this.state;
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-red-500">
              <AlertTriangle className="h-full w-full" />
            </div>
            <CardTitle className="text-xl">Something went wrong</CardTitle>
            <CardDescription>
              We're sorry, but something unexpected happened. Our team has been notified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Bug className="h-4 w-4" />
              <AlertDescription>
                Error ID: <code className="text-xs">{errorId}</code>
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-2">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
              <Button variant="ghost" onClick={this.handleReload} className="w-full">
                Reload Page
              </Button>
            </div>
            
            {this.props.showDetails && error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {error.message}\n{error.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  private renderSectionError() {
    const { error, errorId } = this.state;
    
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Section Error</h3>
              <p className="text-sm text-red-700 mt-1">
                This section encountered an error and couldn't load properly.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={this.handleRetry}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Retry
                </Button>
              </div>
              {this.props.showDetails && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-red-600">
                    Error Details ({errorId})
                  </summary>
                  <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto max-h-24">
                    {error?.message}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  private renderComponentError() {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Component failed to load</span>
          <Button size="sm" variant="outline" onClick={this.handleRetry}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for error boundary (for functional components)
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // This will be caught by the nearest error boundary
    throw error;
  };
}

/**
 * Async error boundary for handling promise rejections
 */
export function AsyncErrorBoundary({ children, ...props }: ErrorBoundaryProps) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // You might want to report this to your error tracking service
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <ErrorBoundary {...props}>{children}</ErrorBoundary>;
}