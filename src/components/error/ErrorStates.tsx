import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, Server, FileX, Search, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Common error state props
 */
interface BaseErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  className?: string;
  showRetry?: boolean;
  showGoBack?: boolean;
  showGoHome?: boolean;
}

/**
 * Network/Connection Error
 */
export function NetworkError({
  title = "Connection Problem",
  description = "Please check your internet connection and try again.",
  onRetry,
  onGoBack,
  className,
  showRetry = true,
  showGoBack = false,
}: BaseErrorProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center text-center p-8">
        <Wifi className="h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription className="mb-6 max-w-sm">
          {description}
        </CardDescription>
        <div className="flex gap-2">
          {showRetry && onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {showGoBack && onGoBack && (
            <Button variant="outline" onClick={onGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Server Error (5xx)
 */
export function ServerError({
  title = "Server Error",
  description = "Something went wrong on our end. We're working to fix it.",
  onRetry,
  onGoHome,
  className,
  showRetry = true,
  showGoHome = true,
}: BaseErrorProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center text-center p-8">
        <Server className="h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription className="mb-6 max-w-sm">
          {description}
        </CardDescription>
        <div className="flex gap-2">
          {showRetry && onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {showGoHome && onGoHome && (
            <Button variant="outline" onClick={onGoHome}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Not Found Error (404)
 */
export function NotFoundError({
  title = "Page Not Found",
  description = "The page you're looking for doesn't exist or has been moved.",
  onGoBack,
  onGoHome,
  className,
  showGoBack = true,
  showGoHome = true,
}: BaseErrorProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center text-center p-8">
        <FileX className="h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription className="mb-6 max-w-sm">
          {description}
        </CardDescription>
        <div className="flex gap-2">
          {showGoBack && onGoBack && (
            <Button onClick={onGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
          {showGoHome && onGoHome && (
            <Button variant="outline" onClick={onGoHome}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * No Results/Empty State
 */
export function NoResultsError({
  title = "No Results Found",
  description = "Try adjusting your search criteria or filters.",
  onRetry,
  onGoBack,
  className,
  showRetry = false,
  showGoBack = false,
}: BaseErrorProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center text-center p-8">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription className="mb-6 max-w-sm">
          {description}
        </CardDescription>
        <div className="flex gap-2">
          {showRetry && onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Search Again
            </Button>
          )}
          {showGoBack && onGoBack && (
            <Button variant="outline" onClick={onGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Generic Error State
 */
export function GenericError({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  onRetry,
  onGoBack,
  onGoHome,
  className,
  showRetry = true,
  showGoBack = false,
  showGoHome = false,
}: BaseErrorProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center text-center p-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription className="mb-6 max-w-sm">
          {description}
        </CardDescription>
        <div className="flex gap-2">
          {showRetry && onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {showGoBack && onGoBack && (
            <Button variant="outline" onClick={onGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
          {showGoHome && onGoHome && (
            <Button variant="outline" onClick={onGoHome}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Inline Error Alert
 */
export function InlineError({
  title = "Error",
  description,
  onRetry,
  className,
  showRetry = true,
}: BaseErrorProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
      {showRetry && onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="mt-2"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Try Again
        </Button>
      )}
    </Alert>
  );
}

/**
 * Error Toast Content
 */
export function ErrorToastContent({
  title = "Error",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Error state selector based on error type
 */
export function ErrorState({
  error,
  onRetry,
  onGoBack,
  onGoHome,
  className,
}: {
  error: Error | string | null;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  className?: string;
}) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorName = typeof error === 'string' ? 'Error' : error.name;

  // Determine error type based on message or error name
  if (errorMessage.toLowerCase().includes('network') || 
      errorMessage.toLowerCase().includes('connection') ||
      errorMessage.toLowerCase().includes('fetch')) {
    return (
      <NetworkError
        description={errorMessage}
        onRetry={onRetry}
        onGoBack={onGoBack}
        className={className}
      />
    );
  }

  if (errorMessage.toLowerCase().includes('not found') || 
      errorMessage.includes('404')) {
    return (
      <NotFoundError
        description={errorMessage}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
        className={className}
      />
    );
  }

  if (errorMessage.toLowerCase().includes('server') || 
      errorMessage.includes('500') ||
      errorMessage.includes('503')) {
    return (
      <ServerError
        description={errorMessage}
        onRetry={onRetry}
        onGoHome={onGoHome}
        className={className}
      />
    );
  }

  // Default to generic error
  return (
    <GenericError
      description={errorMessage}
      onRetry={onRetry}
      onGoBack={onGoBack}
      onGoHome={onGoHome}
      className={className}
    />
  );
}