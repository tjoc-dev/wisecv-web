// src/components/payment/PaymentModal.tsx
// Modal component for handling payment processing with Stripe and Paystack integration

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { paymentService, TierUpgradeOptions, PaymentInitiationResponse } from '@/lib/payment-service';
import PaymentForm from './PaymentForm';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierUpgradeOptions: TierUpgradeOptions;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
}

type PaymentStep = 'method-selection' | 'payment-form' | 'processing' | 'success' | 'error';

interface PaymentState {
  step: PaymentStep;
  selectedProvider?: 'stripe' | 'paystack';
  paymentResponse?: PaymentInitiationResponse;
  error?: string;
  transactionId?: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  tierUpgradeOptions,
  onSuccess,
  onError
}: PaymentModalProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    step: 'method-selection'
  });
  const [, setIsLoading] = useState(false);
  const [statusCheckCount, setStatusCheckCount] = useState(0);

  // Reset state when modal opens and automatically initiate payment
  useEffect(() => {
    if (isOpen) {
      setPaymentState({ step: 'processing' });
      setIsLoading(false);
      setStatusCheckCount(0);
      // Automatically initiate payment with optimal provider
      handleAutomaticPaymentInitiation();
    }
  }, [isOpen]);

  /**
   * Handle automatic payment initiation with optimal provider
   */
  const handleAutomaticPaymentInitiation = async () => {
    setIsLoading(true);

    try {
      // Initiate payment with automatically selected optimal provider
      const response = await paymentService.initiateTierUpgrade(tierUpgradeOptions);

      if (response.success) {
        setPaymentState(prev => ({
          ...prev,
          step: 'payment-form',
          paymentResponse: response,
          selectedProvider: response.provider
        }));
      } else {
        throw new Error(response.error || 'Payment initiation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment initiation failed';
      setPaymentState(prev => ({
        ...prev,
        step: 'error',
        error: errorMessage
      }));
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle payment completion
   * Now checks subscription status instead of payment status since most payments are subscription-based
   */
  const handlePaymentComplete = async (transactionId: string, currentAttempt: number = 0) => {
    setIsLoading(true);
    setPaymentState(prev => ({ ...prev, step: 'processing' }));

    try {
      // Check subscription status using the transactionId
      // This calls the getSubscriptionStatus endpoint in PaymentController.ts
      const statusResponse = await paymentService.checkPaymentStatus(transactionId);
      
      if (statusResponse.success && statusResponse.status === 'completed') {
        setPaymentState(prev => ({
          ...prev,
          step: 'success',
          transactionId
        }));
        setStatusCheckCount(0); // Reset counter on success
        onSuccess?.(transactionId);
      } else if (statusResponse.status === 'failed') {
        setStatusCheckCount(0); // Reset counter on failure
        throw new Error('Subscription activation failed. Please try again.');
      } else {
        // Subscription is still pending, check retry limit
        const nextAttempt = currentAttempt + 1;
        if (nextAttempt >= 10) {
          setStatusCheckCount(0); // Reset counter when limit reached
          throw new Error('Payment status check failed. The subscription is taking longer than expected to activate. Please contact support if the issue persists.');
        }
        // Continue checking with incremented counter
        setStatusCheckCount(nextAttempt);
        setTimeout(() => handlePaymentComplete(transactionId, nextAttempt), 2000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Subscription verification failed';
      setPaymentState(prev => ({
        ...prev,
        step: 'error',
        error: errorMessage
      }));
      setStatusCheckCount(0); // Reset counter on error
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle payment error
   */
  const handlePaymentError = (error: string) => {
    setPaymentState(prev => ({
      ...prev,
      step: 'error',
      error
    }));
    onError?.(error);
  };

  /**
   * Retry payment
   */
  const handleRetry = () => {
    setPaymentState({ step: 'processing' });
    setIsLoading(false);
    setStatusCheckCount(0); // Reset counter on retry
    handleAutomaticPaymentInitiation();
  };

  /**
   * Close modal and reset state
   */
  const handleClose = () => {
    setPaymentState({ step: 'processing' });
    setIsLoading(false);
    setStatusCheckCount(0); // Reset counter on close
    onClose();
  };

  /**
   * Get modal title based on current step
   */
  const getModalTitle = (): string => {
    switch (paymentState.step) {
      case 'payment-form':
        return `Complete Subscription via ${paymentState.selectedProvider === 'paystack' ? 'Paystack' : 'Stripe'}`;
      case 'processing':
        return 'Initializing Subscription';
      case 'success':
        return 'Subscription Activated';
      case 'error':
        return 'Subscription Failed';
      default:
        return 'Subscription';
    }
  };

  /**
   * Get modal description based on current step
   */
  const getModalDescription = (): string => {
    const { targetTier, billingCycle } = tierUpgradeOptions;
    const tierName = targetTier.charAt(0).toUpperCase() + targetTier.slice(1);
    
    switch (paymentState.step) {
      case 'payment-form':
        return `Complete your subscription to upgrade to ${tierName} plan.`;
      case 'processing':
        return `Setting up your ${tierName} subscription (${billingCycle} billing).`;
      case 'success':
        return `Welcome to ${tierName}! Your subscription has been activated successfully.`;
      case 'error':
        return 'There was an issue processing your subscription. Please try again.';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {paymentState.step === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {paymentState.step === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            {paymentState.step === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
            {(paymentState.step === 'method-selection' || paymentState.step === 'payment-form') && (
              <CreditCard className="h-5 w-5" />
            )}
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Form Step */}
          {paymentState.step === 'payment-form' && paymentState.paymentResponse && (
            <PaymentForm
              paymentResponse={paymentState.paymentResponse}
              onComplete={handlePaymentComplete}
              onError={handlePaymentError}
              tierUpgradeOptions={tierUpgradeOptions}
            />
          )}

          {/* Processing Step */}
          {paymentState.step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                Processing your subscription...<br />
                Please do not close this window.
              </p>
            </div>
          )}

          {/* Success Step */}
          {paymentState.step === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                Your subscription has been activated successfully!
                {paymentState.transactionId && (
                  <><br />Transaction ID: {paymentState.transactionId}</>
                )}
              </p>
              <Button onClick={handleClose} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {/* Error Step */}
          {paymentState.step === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {paymentState.error}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleRetry} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}