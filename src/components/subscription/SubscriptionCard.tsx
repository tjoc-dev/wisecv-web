import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Calendar, CreditCard, ArrowUpCircle, XCircle } from 'lucide-react';

interface SubscriptionCardProps {
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
  onUpgrade?: () => void;
  onCancel?: () => void;
  onManageBilling?: () => void;
}

const tierFeatures = {
  basic: {
    name: 'Basic',
    features: ['Pro templates', 'Advanced customization', 'Priority support'],
    color: 'bg-blue-100 text-blue-800'
  },
  pro: {
    name: 'Pro',
    features: ['AI-powered suggestions', 'Cover letter builder', 'LinkedIn optimization'],
    color: 'bg-purple-100 text-purple-800'
  }
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  past_due: 'bg-red-100 text-red-800',
  unpaid: 'bg-red-100 text-red-800',
};

export default function SubscriptionCard({
  subscription,
  onUpgrade,
  onCancel,
  onManageBilling
}: SubscriptionCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
    return formatted;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            No Active Subscription
          </CardTitle>
          <CardDescription>
            You're currently on the free plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upgrade to unlock pro features and capabilities.
            </p>
            <Button onClick={onUpgrade} className="w-full">
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tierInfo = tierFeatures[subscription.tier];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            {tierInfo.name} Plan
          </div>
          <Badge className={statusColors[subscription.status]}>
            {subscription.status.replace('_', ' ')}
          </Badge>
        </CardTitle>
        <CardDescription>
          {formatCurrency(subscription.amount, subscription.currency)} per {subscription.billingCycle.slice(0, -2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Next Billing Date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Next billing:</span>
            <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
          </div>

          {/* Feature Highlights */}
          <div>
            <h4 className="font-semibold mb-2 text-sm">Key Features</h4>
            <ul className="space-y-1">
              {tierInfo.features.map((feature, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            {subscription.status === 'active' && (
              <>
                <Button variant="outline" size="sm" onClick={onUpgrade} className="flex-1">
                  <ArrowUpCircle className="h-4 w-4 mr-1" />
                  Upgrade
                </Button>
                <Button variant="outline" size="sm" onClick={onManageBilling} className="flex-1">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Billing
                </Button>
                {!subscription.cancelAtPeriodEnd && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Cancellation Notice */}
          {subscription.cancelAtPeriodEnd && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                Your subscription will end on {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}