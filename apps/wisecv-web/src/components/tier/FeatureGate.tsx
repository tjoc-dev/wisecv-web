import { ReactNode, useState, useEffect } from 'react';
import { useTier } from '@/hooks/use-tier';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TierBadge } from './TierBadge';
import { Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pricingApi } from '@/lib/pricing-api';

interface FeatureGateProps {
  feature: 'resumeImprovement' | 'jobApplication' | 'autoApply' | 'jobCenter';
  children: ReactNode;
  fallback?: ReactNode;
  showUsage?: boolean;
  className?: string;
}

const featureLabels = {
  resumeImprovement: 'Resume Improvement',
  jobApplication: 'Job Application',
  autoApply: 'Auto Apply',
  jobCenter: 'Job Center Access',
};

const featureDescriptions = {
  resumeImprovement: 'Improve your resume with AI-powered suggestions and formatting',
  jobApplication: 'Apply to jobs directly through our platform',
  autoApply: 'Automatically apply to multiple jobs based on your preferences',
  jobCenter: 'Access our comprehensive job center with advanced search and filters',
};

export function FeatureGate({
  feature,
  children,
  fallback,
  showUsage = true,
  className,
}: FeatureGateProps) {
  const {
    userTier,
    canUseFeature,
    getRemainingUsage,
    getUsagePercentage,
    isApproachingLimit,
    upgradeUserTier,
    isLoading,
  } = useTier();
  
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Loading state
  if (!userTier) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-32 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  const canAccess = canUseFeature(feature);
  const remaining = feature !== 'jobCenter' ? getRemainingUsage(feature) : 0;
  const usagePercentage = feature !== 'jobCenter' ? getUsagePercentage(feature) : 0;
  const approaching = feature !== 'jobCenter' ? isApproachingLimit(feature) : false;

  // If user can access the feature, show it with optional usage info
  if (canAccess) {
    return (
      <div className={className}>
        {showUsage && feature !== 'jobCenter' && (
          <UsageIndicator
            feature={feature}
            remaining={remaining}
            percentage={usagePercentage}
            approaching={approaching}
            tier={userTier.tier}
          />
        )}
        {children}
      </div>
    );
  }

  // If fallback is provided, show it
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Show upgrade prompt
  const handleUpgrade = async (tier: 'BASIC' | 'PRO') => {
    try {
      setIsUpgrading(true);
      await upgradeUserTier(tier);
      setShowUpgradeDialog(false);
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className={className}>
      <Card className="border-dashed border-2 border-gray-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Lock className="h-6 w-6 text-gray-600" />
          </div>
          <CardTitle className="text-lg">
            {featureLabels[feature]} Locked
          </CardTitle>
          <CardDescription>
            {featureDescriptions[feature]}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Your current tier: <TierBadge tier={userTier.tier} size="sm" />
            </p>
            {feature === 'jobCenter' && userTier.tier === 'FREE' && (
              <p className="text-sm text-gray-600">
                Upgrade to Basic or Pro to access the Job Center
              </p>
            )}
            {feature === 'autoApply' && !userTier.limits.hasAutoApply && (
              <p className="text-sm text-gray-600">
                Upgrade to Pro to use Auto Apply feature
              </p>
            )}
            {feature !== 'jobCenter' && feature !== 'autoApply' && remaining === 0 && (
              <p className="text-sm text-gray-600">
                You've reached your monthly limit. Upgrade for more usage.
              </p>
            )}
          </div>
          <Button
            onClick={() => setShowUpgradeDialog(true)}
            className="w-full"
          >
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              Choose a plan that fits your needs and unlock more features.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {userTier.tier === 'FREE' && (
              <Card className="cursor-pointer border-2 hover:border-blue-500 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Basic Plan</CardTitle>
                    <TierBadge tier="BASIC" size="sm" />
                  </div>
                  <CardDescription>Perfect for job seekers</CardDescription>
                </CardHeader>
                <CardContent>
                  <PricingDisplay tier="BASIC" billingCycle="MONTHLY" />
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• 10 resume improvements</li>
                    <li>• 20 job applications</li>
                    <li>• Job center access</li>
                  </ul>
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleUpgrade('BASIC')}
                    disabled={isUpgrading || isLoading}
                  >
                    {isUpgrading ? 'Upgrading...' : 'Upgrade to Basic'}
                  </Button>
                </CardContent>
              </Card>
            )}
            
            <Card className="cursor-pointer border-2 hover:border-purple-500 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Pro Plan</CardTitle>
                  <TierBadge tier="PRO" size="sm" />
                </div>
                <CardDescription>For serious job hunters</CardDescription>
              </CardHeader>
              <CardContent>
                <PricingDisplay tier="PRO" billingCycle="MONTHLY" />
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Unlimited resume improvements</li>
                  <li>• Unlimited job applications</li>
                  <li>• Auto apply feature</li>
                  <li>• Priority support</li>
                </ul>
                <Button
                  className="w-full mt-4"
                  onClick={() => handleUpgrade('PRO')}
                  disabled={isUpgrading || isLoading}
                >
                  {isUpgrading ? 'Upgrading...' : 'Upgrade to Pro'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
              disabled={isUpgrading}
            >
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PricingDisplayProps {
  tier: 'BASIC' | 'PRO';
  billingCycle: 'MONTHLY' | 'YEARLY';
  currency?: 'USD' | 'NGN';
}

function PricingDisplay({ tier, billingCycle, currency = 'USD' }: PricingDisplayProps) {
  const [priceDisplay, setPriceDisplay] = useState<string>('Loading...');

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const display = await pricingApi.getPriceDisplay(tier, billingCycle, currency);
        setPriceDisplay(`${display}/${billingCycle.toLowerCase().replace('ly', '')}`);
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        // Fallback pricing
        const fallback = {
          'BASIC': { 'MONTHLY': currency === 'USD' ? '$9.99' : '₦4,000' },
          'PRO': { 'MONTHLY': currency === 'USD' ? '$19.99' : '₦8,000' }
        };
        setPriceDisplay(`${fallback[tier]?.[billingCycle] || '$0'}/month`);
      }
    };

    fetchPrice();
  }, [tier, billingCycle, currency]);

  return <div className="text-2xl font-bold mb-2">{priceDisplay}</div>;
}

interface UsageIndicatorProps {
  feature: 'resumeImprovement' | 'jobApplication' | 'autoApply';
  remaining: number;
  percentage: number;
  approaching: boolean;
  tier: 'FREE' | 'BASIC' | 'PRO';
}

function UsageIndicator({
  feature,
  remaining,
  percentage,
  approaching,
  tier,
}: UsageIndicatorProps) {
  if (tier === 'PRO' && (feature === 'resumeImprovement' || feature === 'jobApplication')) {
    return null; // Pro users have unlimited usage for these features
  }

  return (
    <Card className={cn(
      'mb-4',
      remaining === 0 && 'border-red-200 bg-red-50',
      approaching && remaining > 0 && 'border-orange-200 bg-orange-50'
    )}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {featureLabels[feature]} Usage
          </span>
          <span className="text-sm text-gray-600">
            {remaining} remaining
          </span>
        </div>
        <Progress
          value={percentage}
          className={cn(
            'h-2',
            remaining === 0 && 'bg-red-100',
            approaching && remaining > 0 && 'bg-orange-100'
          )}
        />
        {(approaching || remaining === 0) && (
          <div className={cn(
            "flex items-center mt-2",
            remaining === 0 ? "text-red-600" : "text-orange-600"
          )}>
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span className="text-xs">
              {remaining === 0 ? "Limit reached" : "You're approaching your monthly limit"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}