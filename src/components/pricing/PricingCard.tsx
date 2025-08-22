import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Check, X, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PaymentModal from '@/components/payment/PaymentModal';
import { TierUpgradeOptions } from '@/lib/payment-service';
import { GeolocationData } from '@/lib/geolocation';

interface PricingCardProps {
  title: string;
  description: string;
  price: {
    usd: number;
    ngn: number;
  };
  isNGN: boolean;
  features: string[];
  limitations?: string[];
  isPrimary?: boolean;
  ctaText?: string;
  billingCycle?: 'monthly' | 'yearly';
  onUpgradeSuccess?: () => void;
  userLocation?: GeolocationData | null;
}

export default function PricingCard({
  title,
  description,
  price,
  isNGN,
  features,
  limitations = [],
  isPrimary = false,
  ctaText = 'Get Started',
  billingCycle = 'monthly',
  onUpgradeSuccess,
  userLocation
}: PricingCardProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const navigate = useNavigate();

  const isFree = price.usd === 0;

  // Calculate display price based on billing cycle
  const getDisplayPrice = () => {
    if (isFree) return { amount: 0, suffix: '' };

    if (billingCycle === 'yearly') {
      // For yearly billing, show the discounted monthly equivalent
      const monthlyEquivalentUSD = Math.floor(price.usd / 12);
      const monthlyEquivalentNGN = Math.floor(price.ngn / 12);

      console.log('Yearly Discounted: ' + price.usd, price.ngn,
        'Monthly Equivalent: ' + monthlyEquivalentUSD, monthlyEquivalentNGN);
      return {
        amount: isNGN ? monthlyEquivalentNGN : monthlyEquivalentUSD,
        suffix: '/month'
      };
    }

    // For monthly billing, show regular monthly price
    return {
      amount: isNGN ? price.ngn : price.usd,
      suffix: '/month'
    };
  };

  const displayPrice = getDisplayPrice();
  const formattedPrice = isNGN
    ? `₦${displayPrice.amount.toLocaleString()}`
    : `$${displayPrice.amount}`;

  // Get current user from localStorage (in a real app, this would come from context)
  const getCurrentUser = () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      return token && userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  // Map title to tier type
  const getTierType = (): 'basic' | 'pro' => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('pro')) return 'pro';
    return 'basic';
  };

  // Handle upgrade button click
  const handleUpgrade = () => {
    const user = getCurrentUser();

    if (!user) {
      toast.error('Please sign in to upgrade your plan');
      navigate('/auth');
      return;
    }

    if (isFree) {
      // For free plan, just redirect to signup/dashboard
      navigate('/dashboard');
      return;
    }

    // Open payment modal for paid plans
    setIsPaymentModalOpen(true);
  };

  // Handle payment success
  const handlePaymentSuccess = (transactionId: string) => {
    setIsPaymentModalOpen(false);
    toast.success(`Payment successful! Welcome to ${title} plan.`, {
      description: `Transaction ID: ${transactionId}`
    });
    onUpgradeSuccess?.();
    // Refresh user data or redirect to dashboard
    window.location.reload();
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    toast.error('Payment failed', {
      description: error
    });
  };

  // Create tier upgrade options with user location data
  const tierUpgradeOptions: TierUpgradeOptions = {
    targetTier: getTierType(),
    billingCycle,
    currency: userLocation?.currency || (isNGN ? 'NGN' : 'USD'),
    userId: getCurrentUser()?.id || '',
    userLocation: userLocation || undefined
  };

  return (
    <Card
      className={`flex flex-col h-full ${isPrimary ? 'border-cvwise-blue shadow-lg' : ''}`}
    >
      <CardHeader className={isPrimary ? 'bg-cvwise-blue/5' : ''}>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 flex-grow">
        <div className="mb-6">
          {isFree ? (
            <span className="text-3xl font-bold">Free</span>
          ) : (
            <>
              <span className="text-3xl font-bold">{formattedPrice}</span>
              <span className="text-gray-500 ml-1">{displayPrice.suffix}</span>
              {billingCycle === 'yearly' && (
                <div className="text-sm text-green-600 font-medium mt-1">
                  Billed yearly • 20% savings
                </div>
              )}
            </>
          )}
        </div>

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-cvwise-blue shrink-0 mr-3 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}

          {limitations.map((limitation, index) => (
            <li
              key={`limitation-${index}`}
              className="flex items-start text-gray-500"
            >
              <X className="h-5 w-5 text-gray-400 shrink-0 mr-3 mt-0.5" />
              <span>{limitation}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-4">
        <Button
          className={`w-full ${isPrimary ? 'bg-cvwise-blue hover:bg-cvwise-blue/90' : ''}`}
          variant={isPrimary ? 'default' : 'outline'}
          onClick={handleUpgrade}
        >
          {!isFree && <CreditCard className="h-4 w-4 mr-2" />}
          {ctaText}
        </Button>
      </CardFooter>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        tierUpgradeOptions={tierUpgradeOptions}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </Card>
  );
}
