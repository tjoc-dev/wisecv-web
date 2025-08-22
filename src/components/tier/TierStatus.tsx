import { useTier } from '@/hooks/use-tier';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TierBadge } from './TierBadge';
import {
  FileText,
  Briefcase,
  Zap,
  Building2,
  ArrowUp,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TierStatusProps {
  className?: string;
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export function TierStatus({
  className,
  showUpgradeButton = true,
  compact = false,
}: TierStatusProps) {
  const {
    userTier,
    isLoading,
    error,
    refreshTierInfo,
    getRemainingUsage,
    getUsagePercentage,
    isApproachingLimit,
  } = useTier();
  
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleUpgradeClick = () => {
    navigate('/profile?tab=subscription');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTierInfo();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !userTier) {
    return (
      <Card className={cn('border-red-200', className)}>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {error || 'Failed to load tier information'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const features = [
    {
      key: 'resumeImprovement' as const,
      label: 'Resume Improvements',
      icon: FileText,
      remaining: getRemainingUsage('resumeImprovement'),
      total: userTier.limits.resumeImprovements,
      percentage: getUsagePercentage('resumeImprovement'),
      approaching: isApproachingLimit('resumeImprovement'),
      unlimited: userTier.tier === 'PRO',
    },
    {
      key: 'jobApplication' as const,
      label: 'Job Applications',
      icon: Briefcase,
      remaining: getRemainingUsage('jobApplication'),
      total: userTier.limits.jobApplications,
      percentage: getUsagePercentage('jobApplication'),
      approaching: isApproachingLimit('jobApplication'),
      unlimited: userTier.tier === 'PRO',
    },
    {
      key: 'autoApply' as const,
      label: 'Auto Applies',
      icon: Zap,
      remaining: getRemainingUsage('autoApply'),
      total: userTier.limits.autoAppliesPerMonth,
      percentage: getUsagePercentage('autoApply'),
      approaching: isApproachingLimit('autoApply'),
      unlimited: false,
      available: userTier.limits.hasAutoApply,
    },
  ];

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TierBadge tier={userTier.tier} size="sm" />
              <span className="text-sm text-gray-600">
                {userTier.tier === 'FREE' && 'Free Plan'}
                {userTier.tier === 'BASIC' && 'Basic Plan'}
                {userTier.tier === 'PRO' && 'Pro Plan'}
              </span>
            </div>
            {showUpgradeButton && userTier.tier !== 'PRO' && (
              <Button size="sm" variant="outline" onClick={handleUpgradeClick}>
                <ArrowUp className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>Your Plan</span>
              <TierBadge tier={userTier.tier} />
            </CardTitle>
            <CardDescription>
              {userTier.tier === 'FREE' && 'Get started with basic features'}
              {userTier.tier === 'BASIC' && 'Perfect for active job seekers'}
              {userTier.tier === 'PRO' && 'Unlimited access to all features'}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
            {showUpgradeButton && userTier.tier !== 'PRO' && (
              <Button size="sm" onClick={handleUpgradeClick}>
                <ArrowUp className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Feature Usage */}
        <div className="space-y-4">
          {features.map((feature) => {
            if (feature.key === 'autoApply' && !feature.available) {
              return (
                <div key={feature.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <feature.icon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">
                      {feature.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                    Pro Only
                  </span>
                </div>
              );
            }

            return (
              <div key={feature.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <feature.icon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">{feature.label}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {feature.unlimited ? (
                      <span className="text-green-600 font-medium">Unlimited</span>
                    ) : (
                      `${feature.remaining}/${feature.total}`
                    )}
                  </span>
                </div>
                {!feature.unlimited && (
                  <div className="space-y-1">
                    <Progress
                      value={feature.percentage}
                      className={cn(
                        'h-2',
                        feature.remaining === 0 && 'bg-red-100',
                        feature.approaching && feature.remaining > 0 && 'bg-orange-100'
                      )}
                    />
                    {(feature.approaching || feature.remaining === 0) && (
                      <p className={cn(
                        "text-xs",
                        feature.remaining === 0 ? "text-red-600" : "text-orange-600"
                      )}>
                        {feature.remaining === 0 ? "Limit reached" : "Approaching limit"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Special Features */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Special Features</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-gray-600" />
                <span className="text-sm">Job Center Access</span>
              </div>
              <span className={cn(
                'text-xs px-2 py-1 rounded',
                userTier.limits.hasJobCenter
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              )}>
                {userTier.limits.hasJobCenter ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Plan Info */}
        {userTier.tier !== 'FREE' && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Plan Status</span>
              <span className="font-medium text-green-600">
                Active
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}