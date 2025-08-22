import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { PaymentService } from '@/lib/payment-service';

interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  provider: 'stripe' | 'paystack';
  tier: string;
  billingCycle: 'monthly' | 'yearly';
  createdAt: string;
  description?: string;
}

interface Subscription {
  id: string;
  tier: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  provider: 'stripe' | 'paystack';
}

const statusIcons = {
  completed: CheckCircle,
  pending: Clock,
  failed: XCircle,
  cancelled: AlertCircle,
};

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const subscriptionStatusColors = {
  active: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  past_due: 'bg-red-100 text-red-800',
  unpaid: 'bg-red-100 text-red-800',
};

export default function PaymentHistory() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const paymentService = new PaymentService({
    stripePublicKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '',
    paystackPublicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || '',
    defaultCurrency: 'USD'
  });
  
  const loadPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user
      const user = getCurrentUser();
      if (!user?.id) {
        setTransactions([]);
        setSubscriptions([]);
        return;
      }
      
      const [paymentHistory, activeSubscription] = await Promise.all([
        paymentService.getPaymentHistory(user.id),
        paymentService.getActiveSubscription()
      ]);
      
      // Map transactions to our interface
      const mappedTransactions = paymentHistory.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status as 'completed' | 'pending' | 'failed' | 'cancelled',
        provider: tx.provider as 'stripe' | 'paystack',
        tier: tx.metadata?.tier || 'basic',
        billingCycle: tx.metadata?.billingCycle || 'monthly',
        createdAt: tx.createdAt.toString(),
        description: tx.description || '',
      }));
      
      // Map subscription to our interface
      const mappedSubscriptions = [];
      if (activeSubscription) {
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
        
        mappedSubscriptions.push(subscriptionData);
      }
      
      setTransactions(mappedTransactions);
      setSubscriptions(mappedSubscriptions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payment data';
      setError(errorMessage);
      toast.error('Failed to load payment history', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };
  
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
  
  useEffect(() => {
    loadPaymentData();
  }, []);
  
  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      await paymentService.cancelSubscription(subscriptionId);
      toast.success('Subscription cancelled successfully');
      loadPaymentData(); // Refresh data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      toast.error('Failed to cancel subscription', {
        description: errorMessage
      });
    }
  };
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount); 
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load payment history</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadPaymentData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Active Subscriptions */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold capitalize">{subscription.tier} Plan</h4>
                      <Badge className={subscriptionStatusColors[subscription.status]}>
                        {subscription.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(subscription.amount, subscription.currency)}
                      </p>
                      <p className="text-sm text-gray-600">per {subscription.billingCycle.slice(0, -2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                    </span>
                    <span className="capitalize">{subscription.provider}</span>
                  </div>
                  
                  {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelSubscription(subscription.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancel Subscription
                    </Button>
                  )}
                  
                  {subscription.cancelAtPeriodEnd && (
                    <p className="text-sm text-orange-600">
                      Subscription will cancel at the end of the current period
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment History
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadPaymentData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payment history</h3>
              <p className="text-gray-600">Your payment transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction, index) => {
                const StatusIcon = statusIcons[transaction.status];
                return (
                  <div key={transaction.id}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {transaction.description || `${transaction.tier} Plan - ${transaction.billingCycle}`}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{formatDate(transaction.createdAt)}</span>
                            <span>•</span>
                            <span className="capitalize">{transaction.provider}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        <Badge className={statusColors[transaction.status]}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {index < transactions.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}