import { useEffect, useState, useCallback } from 'react';
import { useTier } from './use-tier';
import { useAuth } from './use-auth';

/**
 * Hook that ensures tier information is loaded before allowing component to proceed
 * Useful for components that absolutely need tier information to function properly
 */
export function useTierGuard() {
  const { user, isAuthReady } = useAuth();
  const { userTier, isLoading, error, refreshTierInfo } = useTier();
  const [isReady, setIsReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkTierReady = async () => {
      console.log('TierGuard check:', {
        userId: user?.id,
        isAuthReady,
        userTier: !!userTier,
        isLoading,
        error,
        retryCount
      });

      // If auth is not ready, wait
      if (!isAuthReady) {
        console.log('TierGuard: Auth not ready yet');
        setIsReady(false);
        return;
      }

      // If no user, we're not ready
      if (!user?.id) {
        console.log('TierGuard: No user ID available');
        setIsReady(false);
        return;
      }

      // If we have tier info, we're ready
      if (userTier) {
        console.log('TierGuard: Tier info available, setting ready');
        setIsReady(true);
        setRetryCount(0);
        return;
      }

      // If we're loading, wait
      if (isLoading) {
        console.log('TierGuard: Currently loading tier info');
        return;
      }

      // If we have an error and haven't retried too many times, try again
      if (error && retryCount < 3) {
        console.log(`TierGuard: Error detected, retry attempt ${retryCount + 1}:`, error);
        setRetryCount(prev => prev + 1);
        
        // Wait a bit before retrying
        setTimeout(() => {
          refreshTierInfo(0, user.id);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
        return;
      }

      // If no tier info and no loading/error, trigger fetch
      if (!userTier && !isLoading && !error) {
        console.log('TierGuard: No tier info, triggering fetch with userId:', user.id);
        refreshTierInfo(0, user.id);
      }
    };

    checkTierReady();
  }, [user?.id, isAuthReady, userTier, isLoading, error, refreshTierInfo, retryCount]);

  const forceRefresh = useCallback(() => {
    if (user?.id) {
      console.log('TierGuard: Force refresh triggered with userId:', user.id);
      refreshTierInfo(0, user.id);
    } else {
      console.log('TierGuard: Force refresh called but no user ID available');
      refreshTierInfo();
    }
  }, [user?.id, refreshTierInfo]);

  return {
    isReady,
    userTier,
    isLoading,
    error,
    retryCount,
    forceRefresh
  };
}

/**
 * Component wrapper that ensures tier information is loaded before rendering children
 */
interface TierGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function TierGuard({ children, fallback, showError = true }: TierGuardProps) {
  const { isReady, isLoading, error, retryCount, forceRefresh } = useTierGuard();

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading tier information...</span>
      </div>
    );
  }

  if (error && showError) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <div className="text-red-600 mb-2">Failed to load tier information</div>
        <div className="text-sm text-gray-600 mb-4">{error}</div>
        {retryCount < 3 && (
          <button 
            onClick={forceRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Retry ({retryCount}/3)
          </button>
        )}
      </div>
    );
  }

  if (!isReady) {
    return fallback || (
      <div className="flex items-center justify-center p-4">
        <span className="text-sm text-gray-600">Preparing tier information...</span>
      </div>
    );
  }

  return <>{children}</>;
}