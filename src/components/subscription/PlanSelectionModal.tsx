import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Crown, Zap, CreditCard } from 'lucide-react';
import { GeolocationData } from '@/lib/geolocation';
import { pricingApi } from '@/lib/pricing-api';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanSelect: (tier: 'basic' | 'pro', billingCycle: 'monthly' | 'yearly') => void;
  userLocation: GeolocationData | null;
}

const getBaseTierInfo = () => ({
  basic: {
    name: 'Basic',
    price: { monthly: 0, yearly: 0 }, // Will be fetched from API
    icon: CreditCard,
    features: [
      '5 CV templates',
      '10 CV downloads per month',
      'Basic customization',
      'Email support'
    ],
    popular: false
  },
  pro: {
    name: 'Pro',
    price: { monthly: 0, yearly: 0 }, // Will be fetched from API
    icon: Crown,
    features: [
      '20 CV templates',
      '50 CV downloads per month',
      'Advanced customization',
      'Priority email support',
      'LinkedIn integration',
      'Cover letter templates'
    ],
    popular: true
  },

});

export default function PlanSelectionModal({
  isOpen,
  onClose,
  onPlanSelect,
  userLocation
}: PlanSelectionModalProps) {
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [tierInfo, setTierInfo] = useState(getBaseTierInfo());
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // Fetch pricing data from API
  useEffect(() => {
    const fetchPricing = async () => {
      if (!userLocation?.currency || !isOpen) return;
      
      setIsLoadingPrices(true);
      try {
        const baseTierInfo = getBaseTierInfo();
        
        // Fetch pricing for basic and pro tiers
        const [basicMonthly, basicYearly, proMonthly, proYearly] = await Promise.all([
          pricingApi.getTierPricing('BASIC', 'MONTHLY', userLocation.currency),
          pricingApi.getTierPricing('BASIC', 'YEARLY', userLocation.currency),
          pricingApi.getTierPricing('PRO', 'MONTHLY', userLocation.currency),
          pricingApi.getTierPricing('PRO', 'YEARLY', userLocation.currency)
        ]);

        // Update tier info with fetched prices
        const updatedTierInfo = {
          ...baseTierInfo,
          basic: {
            ...baseTierInfo.basic,
            price: {
              monthly: basicMonthly || 999, // Fallback to hardcoded price
              yearly: basicYearly || 9999
            }
          },
          pro: {
            ...baseTierInfo.pro,
            price: {
              monthly: proMonthly || 1999, // Fallback to hardcoded price
              yearly: proYearly || 19999
            }
          }
        };

        setTierInfo(updatedTierInfo);
      } catch (error) {
        console.error('Failed to fetch pricing data:', error);
        // Use fallback pricing
        const fallbackTierInfo = getBaseTierInfo();
        fallbackTierInfo.basic.price = { monthly: 999, yearly: 9999 };
        fallbackTierInfo.pro.price = { monthly: 1999, yearly: 19999 };
        setTierInfo(fallbackTierInfo);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchPricing();
  }, [isOpen, userLocation?.currency]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert from cents
  };

  const calculateYearlySavings = (monthlyPrice: number) => {
    const yearlyPrice = monthlyPrice * 10; // 20% discount
    const monthlyCost = monthlyPrice * 12;
    return monthlyCost - yearlyPrice;
  };

  const handlePlanSelect = (tier: 'basic' | 'pro') => {
    onPlanSelect(tier, selectedBillingCycle);
    onClose();
  };

  const currency = userLocation?.currency || 'USD';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Plan
          </DialogTitle>
          <DialogDescription className="text-center">
            Select the plan that best fits your needs. Upgrade or downgrade anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Billing Cycle Toggle */}
          <div className="flex justify-center">
            <div className="bg-gray-100 p-1 rounded-lg">
              <div className="flex">
                <Button
                  variant={selectedBillingCycle === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedBillingCycle('monthly')}
                  className="rounded-md"
                >
                  Monthly
                </Button>
                <Button
                  variant={selectedBillingCycle === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedBillingCycle('yearly')}
                  className="rounded-md"
                >
                  Yearly
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Save 20%
                  </Badge>
                </Button>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {Object.entries(tierInfo).map(([tier, info]) => {
              const Icon = info.icon;
              const price = info.price[selectedBillingCycle];
              const displayPrice = selectedBillingCycle === 'yearly' ? price / 12 : price;
              
              return (
                <Card 
                  key={tier}
                  className={`relative transition-all duration-200 hover:shadow-lg ${
                    info.popular ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105'
                  }`}
                >
                  {info.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <Icon className="h-8 w-8 text-blue-500" />
                    </div>
                    <CardTitle className="text-xl">{info.name}</CardTitle>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold">
                        {isLoadingPrices ? (
                          <span className="text-gray-400">Loading...</span>
                        ) : (
                          formatCurrency(displayPrice, currency)
                        )}
                      </div>
                      {!isLoadingPrices && (
                        <>
                          <div className="text-sm text-gray-600">
                            per {selectedBillingCycle === 'yearly' ? 'month, billed yearly' : 'month'}
                          </div>
                          {selectedBillingCycle === 'yearly' && (
                            <div className="text-xs text-green-600 font-medium">
                              Save {formatCurrency(calculateYearlySavings(info.price.monthly), currency)} per year
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {info.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full" 
                      variant={info.popular ? 'default' : 'outline'}
                      onClick={() => handlePlanSelect(tier as 'basic' | 'pro')}
                    >
                      Choose {info.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Location Notice */}
          {userLocation && (
            <div className="text-center text-sm text-gray-600">
              Prices shown in {currency} based on your location ({userLocation.country})
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}