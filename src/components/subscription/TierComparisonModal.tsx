import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Crown, Star, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import TierUpgradeButton from '@/components/payment/TierUpgradeButton';
import { pricingApi } from '@/lib/pricing-api';

interface TierComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'free' | 'basic' | 'pro';
  targetTier?: 'basic' | 'pro';
  currentBillingCycle?: 'monthly' | 'yearly';
  currency?: 'USD' | 'NGN';
  onUpgradeSuccess?: () => void;
}

const getBaseTierData = () => ({
  free: {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for getting started',
    icon: Star,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    popular: false,
    features: [
      'Basic CV templates',
      'PDF export',
      'Basic customization',
      '1 CV limit',
      '3 template access',
      '5 downloads per month'
    ],
    limits: {
      cvs: 1,
      templates: 3,
      downloads: 5
    }
  },
  basic: {
    name: 'Basic',
    price: { monthly: 0, yearly: 0 }, // Will be fetched from API
    description: 'Great for job seekers',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    popular: false,
    features: [
      'All free features',
      'Pro templates',
      'Advanced customization',
      'Priority support',
      '5 CV limit',
      '10 template access',
      '50 downloads per month'
    ],
    limits: {
      cvs: 5,
      templates: 10,
      downloads: 50
    }
  },
  pro: {
    name: 'Pro',
    price: { monthly: 0, yearly: 0 }, // Will be fetched from API
    description: 'Best for professionals',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    popular: true,
    features: [
      'All basic features',
      'AI-powered suggestions',
      'Cover letter builder',
      'LinkedIn optimization',
      '20 CV limit',
      'Unlimited templates',
      'Unlimited downloads'
    ],
    limits: {
      cvs: 20,
      templates: 'unlimited',
      downloads: 'unlimited'
    }
  },

});

export default function TierComparisonModal({
  isOpen,
  onClose,
  currentTier,
  targetTier,
  currentBillingCycle = 'monthly',
  currency = 'USD',
  onUpgradeSuccess
}: TierComparisonModalProps) {
  const [selectedTier, setSelectedTier] = useState<string>(targetTier || 'pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(currentBillingCycle);
  const [tierData, setTierData] = useState(getBaseTierData());
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // Fetch pricing data from API
  useEffect(() => {
    const fetchPricing = async () => {
      setIsLoadingPrices(true);
      try {
        const baseTierData = getBaseTierData();
        
        // Fetch pricing for basic and pro tiers
        const [basicMonthly, basicYearly, proMonthly, proYearly] = await Promise.all([
          pricingApi.getTierPricing('BASIC', 'MONTHLY', currency),
          pricingApi.getTierPricing('BASIC', 'YEARLY', currency),
          pricingApi.getTierPricing('PRO', 'MONTHLY', currency),
          pricingApi.getTierPricing('PRO', 'YEARLY', currency)
        ]);

        // Update tier data with fetched prices
        const updatedTierData = {
          ...baseTierData,
          basic: {
            ...baseTierData.basic,
            price: {
              monthly: basicMonthly || 999, // Fallback to hardcoded price
              yearly: basicYearly || 9999
            }
          },
          pro: {
            ...baseTierData.pro,
            price: {
              monthly: proMonthly || 1999, // Fallback to hardcoded price
              yearly: proYearly || 19999
            }
          }
        };

        setTierData(updatedTierData);
      } catch (error) {
        console.error('Failed to fetch pricing data:', error);
        // Use fallback pricing
        const fallbackTierData = getBaseTierData();
        fallbackTierData.basic.price = { monthly: 999, yearly: 9999 };
        fallbackTierData.pro.price = { monthly: 1999, yearly: 19999 };
        setTierData(fallbackTierData);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    if (isOpen) {
      fetchPricing();
    }
  }, [isOpen, currency]);

  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(amount);
  };

  const getAvailableTiers = () => {
    const tierHierarchy = ['free', 'basic', 'pro'];
    const currentIndex = tierHierarchy.indexOf(currentTier);
    return tierHierarchy.slice(currentIndex + 1);
  };

  const calculateSavings = (tier: string) => {
    const tierInfo = tierData[tier as keyof typeof tierData];
    const monthlyTotal = tierInfo.price.monthly * 12;
    const yearlyPrice = tierInfo.price.yearly;
    const savings = monthlyTotal - yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  const availableTiers = getAvailableTiers();
  const currentTierData = tierData[currentTier];
  const selectedTierData = tierData[selectedTier as keyof typeof tierData];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Compare Plans</DialogTitle>
              <DialogDescription>
                Choose the perfect plan for your needs
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 bg-gray-100 rounded-lg p-1">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('monthly')}
                className="rounded-md"
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('yearly')}
                className="rounded-md"
              >
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs">
                  Save 20%
                </Badge>
              </Button>
            </div>
          </div>

          {/* Current Plan */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Your Current Plan</h3>
            <Card className={cn('border-2', currentTierData.borderColor)}>
              <CardHeader className={cn('pb-3', currentTierData.bgColor)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <currentTierData.icon className={cn('h-5 w-5', currentTierData.color)} />
                    <CardTitle className="text-lg">{currentTierData.name}</CardTitle>
                  </div>
                  <Badge variant="outline">Current</Badge>
                </div>
                <CardDescription>{currentTierData.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="text-2xl font-bold mb-2">
                  {currentTier === 'free' ? 'Free' : (
                    isLoadingPrices ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : (
                      formatCurrency(currentTierData.price[billingCycle], currency)
                    )
                  )}
                  {currentTier !== 'free' && !isLoadingPrices && (
                    <span className="text-sm font-normal text-gray-600">/{billingCycle.slice(0, -2)}</span>
                  )}
                </div>
                <ul className="space-y-1 text-sm">
                  {currentTierData.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Available Upgrades */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Available Upgrades</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {availableTiers.map((tier) => {
                const tierInfo = tierData[tier as keyof typeof tierData];
                const isSelected = selectedTier === tier;
                const savings = billingCycle === 'yearly' ? calculateSavings(tier) : null;
                
                return (
                  <Card 
                    key={tier}
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:shadow-md',
                      isSelected ? `border-2 ${tierInfo.borderColor} shadow-md` : 'border',
                      tierInfo.popular && 'ring-2 ring-purple-200'
                    )}
                    onClick={() => setSelectedTier(tier)}
                  >
                    <CardHeader className={cn('pb-3', isSelected && tierInfo.bgColor)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <tierInfo.icon className={cn('h-5 w-5', tierInfo.color)} />
                          <CardTitle className="text-lg">{tierInfo.name}</CardTitle>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {tierInfo.popular && (
                            <Badge className="bg-purple-600 text-white text-xs">
                              Popular
                            </Badge>
                          )}
                          {isSelected && (
                            <Badge variant="default" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription>{tierInfo.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="mb-3">
                        <div className="text-2xl font-bold">
                          {isLoadingPrices ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : (
                            <>
                              {formatCurrency(tierInfo.price[billingCycle], currency)}
                              <span className="text-sm font-normal text-gray-600">/{billingCycle.slice(0, -2)}</span>
                            </>
                          )}
                        </div>
                        {!isLoadingPrices && savings && savings.amount > 0 && (
                          <div className="text-sm text-green-600 font-medium">
                            Save {formatCurrency(savings.amount, currency)} ({savings.percentage}%)
                          </div>
                        )}
                      </div>
                      
                      <ul className="space-y-1 text-sm mb-4">
                        {tierInfo.features.slice(0, 5).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                        {tierInfo.features.length > 5 && (
                          <li className="text-xs text-gray-500">
                            +{tierInfo.features.length - 5} more features
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Comparison Summary */}
          {selectedTier && selectedTier !== currentTier && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Upgrade Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">From: {currentTierData.name}</p>
                  <p className="text-gray-600">To: {selectedTierData.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">
                    New Price: {isLoadingPrices ? 'Loading...' : formatCurrency(selectedTierData.price[billingCycle], currency)}
                  </p>
                  <p className="text-gray-600">Billing: {billingCycle}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            {selectedTier && selectedTier !== currentTier && (
              <TierUpgradeButton
                targetTier={selectedTier as 'basic' | 'pro'}
                billingCycle={billingCycle}
                currency={currency}
                className="flex-1"
                onUpgradeSuccess={() => {
                  onClose();
                  onUpgradeSuccess?.();
                }}
              >
                Upgrade to {selectedTierData.name}
              </TierUpgradeButton>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}