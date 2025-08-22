// src/components/payment/PaymentForm.tsx
// Component for handling payment form with Stripe and Paystack integration

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, AlertCircle, CreditCard } from 'lucide-react';
import { PaymentInitiationResponse, TierUpgradeOptions } from '@/lib/payment-service';
import { pricingApi } from '@/lib/pricing-api';

interface PaymentFormProps {
  paymentResponse: PaymentInitiationResponse;
  onComplete: (transactionId: string) => void;
  onError: (error: string) => void;
  tierUpgradeOptions: TierUpgradeOptions;
}

export default function PaymentForm({
  paymentResponse,
  onComplete,
  onError,
  tierUpgradeOptions
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [priceDisplay, setPriceDisplay] = useState<string>('Loading...');

  // Fetch price display from API
  useEffect(() => {
    const fetchPriceDisplay = async () => {
      try {
        const { targetTier, billingCycle, currency } = tierUpgradeOptions;

        if (targetTier === 'free') {
          setPriceDisplay('Free');
          return;
        }

        const display = await pricingApi.getPriceDisplay(
          targetTier.toUpperCase() as 'BASIC' | 'PRO',
          billingCycle.toUpperCase() as 'MONTHLY' | 'YEARLY',
          currency
        );
        setPriceDisplay(display);
      } catch (error) {
        console.error('Failed to fetch price display:', error);
        // Fallback to basic display
        const { targetTier, billingCycle, currency } = tierUpgradeOptions;
        const symbol = currency === 'USD' ? '$' : '₦';
        setPriceDisplay(`${symbol}0`);
      }
    };

    fetchPriceDisplay();
  }, [tierUpgradeOptions]);

  const getPriceDisplay = () => priceDisplay;

  // Handle payment window events
  useEffect(() => {
    if (!paymentWindow) return;

    const checkPaymentWindow = setInterval(() => {
      if (paymentWindow.closed) {
        clearInterval(checkPaymentWindow);
        setIsProcessing(false);
        // Check payment status when window closes
        onComplete(paymentResponse.transactionId);
      }
    }, 1000);

    return () => {
      clearInterval(checkPaymentWindow);
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [paymentWindow, paymentResponse.transactionId, onComplete]);

  // Handle payment initiation
  const handlePayment = async () => {
    // Get the appropriate payment URL based on provider
    // For Stripe: use checkoutUrl/paymentUrl (Stripe Checkout)
    // For Paystack: use authorization_url
    const paymentUrl = paymentResponse.provider === 'paystack'
      ? paymentResponse.authorization_url
      : paymentResponse.paymentUrl;

    if (!paymentUrl) {
      onError('Payment URL not available');
      return;
    }

    setIsProcessing(true);
    setError(null);
    console.log('Payment provider:', paymentResponse.provider);
    try {
      if (paymentResponse.provider === 'stripe') {
        // For Stripe Checkout, use the checkoutUrl/paymentUrl directly
        const popup = window.open(
          paymentUrl,
          'stripe-checkout',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        setPaymentWindow(popup);
      } else if (paymentResponse.provider === 'paystack') {
        // For Paystack, open payment popup using authorization_url
        const popup = window.open(
          paymentUrl,
          'paystack-payment',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        setPaymentWindow(popup);
      } else {
        throw new Error('Unsupported payment provider');
      }
    } catch (error) {
      setIsProcessing(false);
      const errorMessage = error instanceof Error ? error.message : 'Payment initiation failed';
      setError(errorMessage);
      onError(errorMessage);
    }
  };

  // Handle direct redirect (fallback)
  const handleDirectRedirect = () => {
    // For Stripe: use checkoutUrl/paymentUrl (Stripe Checkout)
    // For Paystack: use authorization_url
    const paymentUrl = paymentResponse.provider === 'paystack'
      ? paymentResponse.authorization_url
      : paymentResponse.paymentUrl;

    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Plan:</span>
            <span className="font-medium capitalize">
              {tierUpgradeOptions.targetTier}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Billing:</span>
            <span className="font-medium capitalize">
              {tierUpgradeOptions.billingCycle}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Currency:</span>
            <span className="font-medium">{tierUpgradeOptions.currency}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="text-lg font-bold">{getPriceDisplay()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Provider Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment Method</CardTitle>
          <CardDescription>
            Processing via {paymentResponse.provider === 'stripe' ? 'Stripe' : 'Paystack'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {paymentResponse.provider === 'stripe' ? 'Stripe' : 'Paystack'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Secure payment processing
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Payment Actions */}
      <div className="space-y-3">
        <Button
          onClick={handlePayment}
          disabled={isProcessing || !(paymentResponse.paymentUrl || paymentResponse.authorization_url)}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay {getPriceDisplay()}
            </>
          )}
        </Button>

        {/* Fallback redirect button */}
        {(paymentResponse.paymentUrl || paymentResponse.authorization_url) && (
          <Button
            variant="outline"
            onClick={handleDirectRedirect}
            disabled={isProcessing}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Payment Page
          </Button>
        )}
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Payment window opened. Complete your payment in the popup window.
            This page will automatically update when payment is complete.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Notice */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>🔒 Your payment is secured with industry-standard encryption</p>
        <p>Transaction ID: {paymentResponse.transactionId}</p>
      </div>
    </div>
  );
}