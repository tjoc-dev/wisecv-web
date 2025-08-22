import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './use-auth';
import {
  UserTierInfo,
  TierConfig,
  FeatureAccessResult,
  UpgradeSuggestion,
  getUserTier,
  getAllTiers,
  checkFeatureAccess,
  recordUsage,
  getUserUsage,
  getUpgradeSuggestions,
  upgradeTier,
} from '@/lib/tier';
import { toast } from '@/components/ui/sonner';

interface TierContextType {
  userTier: UserTierInfo | null;
  allTiers: TierConfig[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshTierInfo: (retryCount?: number, userId?: string) => Promise<void>;
  checkAccess: (action: 'resumeImprovement' | 'jobApplication' | 'autoApply' | 'jobCenter') => Promise<FeatureAccessResult>;
  recordFeatureUsage: (action: 'resumeImprovement' | 'jobApplication' | 'autoApply') => Promise<void>;
  getUpgradeOptions: () => Promise<UpgradeSuggestion[]>;
  upgradeUserTier: (newTier: 'BASIC' | 'PRO') => Promise<void>;
  
  // Helper functions
  canUseFeature: (feature: 'resumeImprovement' | 'jobApplication' | 'autoApply' | 'jobCenter') => boolean;
  getRemainingUsage: (feature: 'resumeImprovement' | 'jobApplication' | 'autoApply') => number;
  getUsagePercentage: (feature: 'resumeImprovement' | 'jobApplication' | 'autoApply') => number;
  isApproachingLimit: (feature: 'resumeImprovement' | 'jobApplication' | 'autoApply') => boolean;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

interface TierProviderProps {
  children: ReactNode;
}

export function TierProvider({ children }: TierProviderProps) {
  const { user, isAuthReady } = useAuth();
  const [userTier, setUserTier] = useState<UserTierInfo | null>(null);
  const [allTiers, setAllTiers] = useState<TierConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user tier information with retry logic
  const refreshTierInfo = useCallback(async (retryCount = 0, userId?: string) => {
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) {
      console.log('TierProvider: No user ID available, skipping tier fetch');
      return;
    }

    try {
      console.log(`TierProvider: Starting tier fetch for user ${targetUserId} (attempt ${retryCount + 1})`);
      setIsLoading(true);
      setError(null);
      
      const [tierInfo, tiers] = await Promise.all([
        getUserTier(targetUserId),
        getAllTiers()
      ]);
      
      setUserTier(tierInfo);
      setAllTiers(tiers);
      console.log('TierProvider: Tier information loaded successfully:', tierInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tier information';
      console.error('TierProvider: Failed to fetch tier info (attempt ' + (retryCount + 1) + '):', err);
      
      // Retry up to 3 times with exponential backoff
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`TierProvider: Retrying tier fetch in ${delay}ms...`);
        setTimeout(() => {
          refreshTierInfo(retryCount + 1, targetUserId);
        }, delay);
        return;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial load with improved timing
  useEffect(() => {
    console.log('TierProvider: Initial effect triggered', {
      userId: user?.id,
      isAuthReady,
      hasUserTier: !!userTier
    });
    
    if (user?.id && isAuthReady) {
      console.log('TierProvider: Authentication ready, fetching tier information for user:', user.id);
      refreshTierInfo();
    } else if (!user?.id && isAuthReady) {
      // Clear tier info when user logs out
      console.log('TierProvider: User logged out, clearing tier information');
      setUserTier(null);
      setAllTiers([]);
      setError(null);
    }
  }, [user?.id, isAuthReady, refreshTierInfo]);

  // Additional effect to ensure tier info is available when needed
  useEffect(() => {
    console.log('TierProvider: Secondary effect triggered', {
      userId: user?.id,
      isAuthReady,
      hasUserTier: !!userTier,
      isLoading,
      error
    });
    
    // If user is authenticated, auth is ready, but tier info is missing, try to fetch it
    if (user?.id && isAuthReady && !userTier && !isLoading && !error) {
      console.log('TierProvider: User authenticated but tier info missing, fetching...');
      refreshTierInfo();
    }
  }, [user?.id, isAuthReady, userTier, isLoading, error, refreshTierInfo]);

  // Check feature access
  const checkAccess = useCallback(async (
    action: 'resumeImprovement' | 'jobApplication' | 'autoApply' | 'jobCenter'
  ): Promise<FeatureAccessResult> => {
    if (!user?.id) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        tier: 'FREE'
      };
    }

    try {
      return await checkFeatureAccess(user.id, action);
    } catch (err) {
      console.error('Failed to check feature access:', err);
      return {
        allowed: false,
        reason: 'Failed to check access',
        tier: userTier?.tier || 'FREE'
      };
    }
  }, [user?.id, userTier?.tier]);

  // Record feature usage
  const recordFeatureUsage = useCallback(async (
    action: 'resumeImprovement' | 'jobApplication' | 'autoApply'
  ) => {
    if (!user?.id) return;

    try {
      const updatedUsage = await recordUsage(user.id, action);
      
      // Update local state with new usage
      if (userTier) {
        setUserTier(prev => prev ? {
          ...prev,
          usage: updatedUsage,
          remaining: {
            resumeImprovements: Math.max(0, prev.limits.resumeImprovements - updatedUsage.resumeImprovementsUsed),
            jobApplications: Math.max(0, prev.limits.jobApplications - updatedUsage.jobApplicationsUsed),
            autoApplies: Math.max(0, prev.limits.autoAppliesPerMonth - updatedUsage.autoAppliesUsed)
          }
        } : null);
      }
    } catch (err) {
      console.error('Failed to record usage:', err);
      toast.error('Failed to record feature usage');
    }
  }, [user?.id, userTier]);

  // Get upgrade suggestions
  const getUpgradeOptions = useCallback(async (): Promise<UpgradeSuggestion[]> => {
    if (!user?.id) return [];

    try {
      return await getUpgradeSuggestions(user.id);
    } catch (err) {
      console.error('Failed to get upgrade suggestions:', err);
      return [];
    }
  }, [user?.id]);

  // Upgrade user tier
  const upgradeUserTier = useCallback(async (newTier: 'BASIC' | 'PRO') => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const updatedTier = await upgradeTier(user.id, newTier);
      setUserTier(updatedTier);
      toast.success(`Successfully upgraded to ${newTier} tier!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upgrade tier';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Helper function to check if user can use a feature
  const canUseFeature = useCallback((feature: 'resumeImprovement' | 'jobApplication' | 'autoApply' | 'jobCenter'): boolean => {
    if (!userTier) return false;

    switch (feature) {
      case 'resumeImprovement':
        return userTier.remaining.resumeImprovements > 0;
      case 'jobApplication':
        return userTier.remaining.jobApplications > 0;
      case 'autoApply':
        return userTier.limits.hasAutoApply && userTier.remaining.autoApplies > 0;
      case 'jobCenter':
        return userTier.limits.hasJobCenter;
      default:
        return false;
    }
  }, [userTier]);

  // Get remaining usage for a feature
  const getRemainingUsage = useCallback((feature: 'resumeImprovement' | 'jobApplication' | 'autoApply'): number => {
    if (!userTier) return 0;

    switch (feature) {
      case 'resumeImprovement':
        return userTier.remaining.resumeImprovements;
      case 'jobApplication':
        return userTier.remaining.jobApplications;
      case 'autoApply':
        return userTier.remaining.autoApplies;
      default:
        return 0;
    }
  }, [userTier]);

  // Get usage percentage for a feature
  const getUsagePercentage = useCallback((feature: 'resumeImprovement' | 'jobApplication' | 'autoApply'): number => {
    if (!userTier) return 0;

    let used: number;
    let limit: number;

    switch (feature) {
      case 'resumeImprovement':
        used = userTier.usage.resumeImprovementsUsed;
        limit = userTier.limits.resumeImprovements;
        break;
      case 'jobApplication':
        used = userTier.usage.jobApplicationsUsed;
        limit = userTier.limits.jobApplications;
        break;
      case 'autoApply':
        used = userTier.usage.autoAppliesUsed;
        limit = userTier.limits.autoAppliesPerMonth;
        break;
      default:
        return 0;
    }

    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  }, [userTier]);

  // Check if user is approaching limit
  const isApproachingLimit = useCallback((feature: 'resumeImprovement' | 'jobApplication' | 'autoApply'): boolean => {
    const percentage = getUsagePercentage(feature);
    return percentage >= 80; // 80% threshold
  }, [getUsagePercentage]);

  const value: TierContextType = {
    userTier,
    allTiers,
    isLoading,
    error,
    refreshTierInfo,
    checkAccess,
    recordFeatureUsage,
    getUpgradeOptions,
    upgradeUserTier,
    canUseFeature,
    getRemainingUsage,
    getUsagePercentage,
    isApproachingLimit,
  };

  return (
    <TierContext.Provider value={value}>
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  const context = useContext(TierContext);
  if (context === undefined) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
}