import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, Calendar, CreditCard, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentService } from '@/lib/payment-service';
import SubscriptionCard from './SubscriptionCard';
import PaymentHistoryTable from './PaymentHistoryTable';
import SubscriptionActions from './SubscriptionActions';
import { getCachedUserLocation, GeolocationData } from '@/lib/geolocation';

interface CurrentSubscription {
  id: string;
  tier: 'basic' | 'pro';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  provider: 'stripe' | 'paystack';
  nextBillingDate?: string;
  trialEnd?: string;
}


export default function SubscriptionManagement() {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userLocation, setUserLocation] = useState<GeolocationData | null>(null);

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

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      return token && userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const user = getCurrentUser();
      if (!user?.id) {
        setSubscription(null);
        return;
      }

      const activeSubscription = await paymentService.getActiveSubscription();
      if (activeSubscription) {
        // Map the subscription data to match our interface
        const metadata = activeSubscription.metadata || {};
        const tierMapping: Record<string, string> = {
          'BASIC': 'basic',
          'PRO': 'pro'
        };
        const tier = tierMapping[activeSubscription.tierType] || activeSubscription.tierType.toLowerCase() || 'basic';
        const amount = parseFloat(activeSubscription.amount) || 0;
        const billingCycle = activeSubscription.billingCycle.toLowerCase() === 'monthly' || activeSubscription.billingCycle.toLowerCase() === 'yearly'
          ? activeSubscription.billingCycle.toLowerCase() as 'monthly' | 'yearly'
          : 'monthly';

        const mappedStatus = activeSubscription.status === 'cancelled' || activeSubscription.status === 'expired'
          ? 'cancelled' as const
          : activeSubscription.status as 'active' | 'past_due' | 'unpaid';

        const subscriptionData = {
          id: activeSubscription.id,
          tier: tier as 'basic' | 'pro',
          status: mappedStatus,
          currentPeriodStart: activeSubscription.currentPeriodStart,
          currentPeriodEnd: activeSubscription.currentPeriodEnd,
          cancelAtPeriodEnd: metadata.cancelAtPeriodEnd || false,
          amount: amount,
          currency: activeSubscription.currency,
          billingCycle: billingCycle,
          provider: activeSubscription.provider || 'stripe'
        };

        setSubscription(subscriptionData);
      } else {
        setSubscription(null);
      }

    } catch (err) {
      console.error('Failed to load subscription:', err);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCurrentTier = () => {
    const user = getCurrentUser();
    return subscription?.tier || user?.tier || 'free';
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="h-6 w-6" />
          Subscription Management
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage your subscription, billing, and usage
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Plan</p>
                <p className="text-lg font-semibold capitalize">
                  {getCurrentTier()}
                </p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={subscription?.status === 'active' ? 'default' : 'destructive'}>
                  {subscription?.status || 'No subscription'}
                </Badge>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Billing</p>
                <p className="text-lg font-semibold">
                  {subscription ? formatDate(subscription.currentPeriodEnd) : 'N/A'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubscriptionCard
              subscription={subscription}
              onUpgrade={() => setActiveTab('actions')}
              onCancel={() => setActiveTab('actions')}
              onManageBilling={() => setActiveTab('actions')}
            />

            {/* Billing Summary */}
            {subscription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Billing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Provider</span>
                      <span className="font-medium capitalize">{subscription.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Billing Cycle</span>
                      <span className="font-medium capitalize">{subscription.billingCycle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Period</span>
                      <span className="font-medium text-sm">
                        {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Amount</span>
                      <span className="font-bold">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: subscription.currency.toUpperCase(),
                        }).format(subscription.amount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          <PaymentHistoryTable userId={getCurrentUser()?.id} />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6 mt-6">
          <SubscriptionActions
            subscription={subscription}
            onSubscriptionUpdate={loadSubscription}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}