import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpCircle, ArrowDownCircle, XCircle, CreditCard, RefreshCw, AlertTriangle } from 'lucide-react';
import { PaymentService } from '@/lib/payment-service';
import { toast } from 'sonner';
import TierUpgradeButton from '@/components/payment/TierUpgradeButton';
import { getCachedUserLocation, GeolocationData } from '@/lib/geolocation';
import PlanSelectionModal from './PlanSelectionModal';
import { pricingApi } from '@/lib/pricing-api';

interface SubscriptionActionsProps {
  subscription: {
    id: string;
    tier: 'basic' | 'pro';
    status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
    currentPeriodEnd: string;
    amount: number;
    currency: string;
    billingCycle: 'monthly' | 'yearly';
    cancelAtPeriodEnd?: boolean;
  } | null;
  onSubscriptionUpdate?: () => void;
}

const tierHierarchy = ['basic', 'pro'];
const getBaseTierInfo = () => ({
  basic: { name: 'Basic', price: { monthly: 0, yearly: 0 } }, // Will be fetched from API
  pro: { name: 'Pro', price: { monthly: 0, yearly: 0 } } // Will be fetched from API
});

export default function SubscriptionActions({ 
  subscription, 
  onSubscriptionUpdate 
}: SubscriptionActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [userLocation, setUserLocation] = useState<GeolocationData | null>(null);
  const [tierInfo, setTierInfo] = useState(getBaseTierInfo());
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // Fetch pricing data from API
  useEffect(() => {
    const fetchPricing = async () => {
      if (!userLocation?.currency) return;
      
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
  }, [userLocation?.currency]);

  const paymentService = new PaymentService({
    stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
    paystackPublicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    defaultCurrency: userLocation?.currency || 'USD'
  });

  // Detect user location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const location = await getCachedUserLocation();
        setUserLocation(location);
      } catch (error) {
        console.warn('Failed to detect user location:', error);
        // Fallback to default location
        setUserLocation({
          country: 'United States',
          countryCode: 'US',
          currency: 'USD',
          isNigeria: false
        });
      }
    };
    
    detectLocation();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    setLoading(true);
    try {
      await paymentService.cancelSubscription(subscription.id);
      toast.success('Subscription cancelled successfully', {
        description: `Your subscription will end on ${formatDate(subscription.currentPeriodEnd)}`
      });
      onSubscriptionUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      toast.error('Failed to cancel subscription', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableUpgrades = () => {
    if (!subscription) return tierHierarchy as ('basic' | 'pro')[];
    const currentIndex = tierHierarchy.indexOf(subscription.tier);
    return tierHierarchy.slice(currentIndex + 1) as ('basic' | 'pro')[];
  };

  const getAvailableDowngrades = () => {
    if (!subscription) return [];
    const currentIndex = tierHierarchy.indexOf(subscription.tier);
    return tierHierarchy.slice(0, currentIndex) as ('basic' | 'pro')[];
  };

  const calculatePriceComparison = (newTier: string, billingCycle: 'monthly' | 'yearly') => {
    if (!subscription) return null;
    
    const currentPrice = subscription.amount;
    const newPrice = tierInfo[newTier as keyof typeof tierInfo].price[billingCycle];
    const difference = newPrice - currentPrice;
    
    return {
      current: currentPrice,
      new: newPrice,
      difference,
      isUpgrade: difference > 0
    };
  };

  const handlePlanSelect = (tier: 'basic' | 'pro', billingCycle: 'monthly' | 'yearly') => {
    // This will trigger the TierUpgradeButton with the selected plan
    setSelectedTier(tier);
    setSelectedBillingCycle(billingCycle);
    setShowPlanSelection(false);
  };

  if (!subscription) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Subscription Actions</CardTitle>
            <CardDescription>
              No active subscription to manage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">Start a subscription to access pro features</p>
              <Button
                onClick={() => setShowPlanSelection(true)}
                className="w-full max-w-xs"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Choose Your Plan
              </Button>
              {selectedTier && (
                <div className="mt-4">
                  <TierUpgradeButton
                    targetTier={selectedTier as 'basic' | 'pro'}
                    billingCycle={selectedBillingCycle}
                    currency={userLocation?.currency || 'USD'}
                    onUpgradeSuccess={() => {
                      onSubscriptionUpdate?.();
                      toast.success('Subscription created successfully!');
                      setSelectedTier('');
                    }}
                  >
                    Start {tierInfo[selectedTier as keyof typeof tierInfo].name} Subscription
                  </TierUpgradeButton>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <PlanSelectionModal
          isOpen={showPlanSelection}
          onClose={() => setShowPlanSelection(false)}
          onPlanSelect={handlePlanSelect}
          userLocation={userLocation}
        />
      </>
    );
  }

  const availableUpgrades = getAvailableUpgrades();
  const availableDowngrades = getAvailableDowngrades();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Actions</CardTitle>
        <CardDescription>
          Manage your subscription settings and billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold">{tierInfo[subscription.tier].name} Plan</h4>
              <p className="text-sm text-gray-600">
                {formatCurrency(subscription.amount, subscription.currency)} per {subscription.billingCycle.slice(0, -2)}
              </p>
            </div>
            <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
              {subscription.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Upgrade */}
            {availableUpgrades.length > 0 && subscription.status === 'active' && (
              <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upgrade Your Plan</DialogTitle>
                    <DialogDescription>
                      Choose a higher tier to unlock more features
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Select Tier</label>
                      <Select value={selectedTier} onValueChange={setSelectedTier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a tier" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUpgrades.map((tier) => (
                            <SelectItem key={tier} value={tier}>
                              {tierInfo[tier].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Billing Cycle</label>
                      <Select value={selectedBillingCycle} onValueChange={(value: 'monthly' | 'yearly') => setSelectedBillingCycle(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly (Save 20%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTier && userLocation && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Price Comparison</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Current ({tierInfo[subscription.tier].name}):</span>
                            <span>{formatCurrency(subscription.amount, subscription.currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>New ({tierInfo[selectedTier as keyof typeof tierInfo].name}):</span>
                            <span>{formatCurrency(tierInfo[selectedTier as keyof typeof tierInfo].price[selectedBillingCycle], userLocation.currency)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-1">
                            <span>Price difference in {userLocation.currency}:</span>
                            <span className="text-green-600">
                              +{formatCurrency(
                                tierInfo[selectedTier as keyof typeof tierInfo].price[selectedBillingCycle],
                                userLocation.currency
                              )}
                            </span>
                          </div>
                          {userLocation.currency !== subscription.currency && (
                            <div className="text-xs text-gray-600 mt-2">
                              * Prices shown in {userLocation.currency} based on your location ({userLocation.country})
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} className="flex-1">
                        Cancel
                      </Button>
                      {selectedTier && (
                        <TierUpgradeButton
                          targetTier={selectedTier as 'basic' | 'pro'}
                          billingCycle={selectedBillingCycle}
                          currency={userLocation?.currency || 'USD'}
                          className="flex-1"
                          onUpgradeSuccess={() => {
                            setShowUpgradeDialog(false);
                            onSubscriptionUpdate?.();
                            toast.success(`Successfully upgraded to ${tierInfo[selectedTier as keyof typeof tierInfo].name} plan!`);
                          }}
                        >
                          Upgrade Now
                        </TierUpgradeButton>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Downgrade */}
            {availableDowngrades.length > 0 && subscription.status === 'active' && (
              <Button variant="outline" className="w-full" disabled>
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Downgrade
                <span className="text-xs ml-1">(Soon)</span>
              </Button>
            )}

            {/* Update Payment Method */}
            <Button variant="outline" className="w-full" disabled>
              <CreditCard className="h-4 w-4 mr-2" />
              Update Payment
              <span className="text-xs ml-1">(Soon)</span>
            </Button>

            {/* Cancel Subscription */}
            {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Cancel Subscription
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your subscription? You'll continue to have access to pro features until {formatDate(subscription.currentPeriodEnd)}, after which your account will be downgraded to the free plan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Cancellation Notice */}
          {subscription.cancelAtPeriodEnd && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-800">Subscription Cancelled</h4>
                <p className="text-sm text-orange-700">
                  Your subscription will end on {formatDate(subscription.currentPeriodEnd)}. You can reactivate it anytime before this date.
                </p>
                <Button variant="outline" size="sm" className="mt-2" disabled>
                  Reactivate Subscription
                  <span className="text-xs ml-1">(Soon)</span>
                </Button>
              </div>
            </div>
          )}

          {/* Past Due Notice */}
          {subscription.status === 'past_due' && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">Payment Past Due</h4>
                <p className="text-sm text-red-700">
                  Your payment is overdue. Please update your payment method to continue using pro features.
                </p>
                <Button variant="outline" size="sm" className="mt-2" disabled>
                  Update Payment Method
                  <span className="text-xs ml-1">(Soon)</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}