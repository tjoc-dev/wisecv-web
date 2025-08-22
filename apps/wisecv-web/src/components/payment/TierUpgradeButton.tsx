import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PaymentModal from './PaymentModal';
import { TierUpgradeOptions } from '@/lib/payment-service';

interface TierUpgradeButtonProps {
  targetTier: 'basic' | 'pro';
  billingCycle?: 'monthly' | 'yearly';
  currency?: 'USD' | 'NGN';
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  children?: React.ReactNode;
  onUpgradeSuccess?: (transactionId: string) => void;
  disabled?: boolean;
}

const tierIcons = {
  basic: CreditCard,
  pro: Crown,
};

const tierLabels = {
  basic: 'Upgrade to Basic',
  pro: 'Upgrade to Pro',
};

export default function TierUpgradeButton({
  targetTier,
  billingCycle = 'monthly',
  currency = 'USD',
  variant = 'default',
  size = 'default',
  className = '',
  children,
  onUpgradeSuccess,
  disabled = false,
}: TierUpgradeButtonProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const navigate = useNavigate();
  
  const Icon = tierIcons[targetTier];
  const defaultLabel = tierLabels[targetTier];
  
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
  
  // Handle upgrade button click
  const handleUpgrade = () => {
    if (disabled) return;
    
    const user = getCurrentUser();
    
    if (!user) {
      toast.error('Please sign in to upgrade your plan');
      navigate('/auth/signin');
      return;
    }
    
    // Check if user is already on this tier or higher
    const currentTier = user.tier || 'free';
    const tierHierarchy = ['free', 'basic', 'pro'];
    const currentTierIndex = tierHierarchy.indexOf(currentTier);
    const targetTierIndex = tierHierarchy.indexOf(targetTier);
    
    if (currentTierIndex >= targetTierIndex) {
      toast.info(`You're already on the ${currentTier} plan or higher`);
      return;
    }
    
    // Open payment modal
    setIsPaymentModalOpen(true);
  };
  
  // Handle payment success
  const handlePaymentSuccess = (transactionId: string) => {
    setIsPaymentModalOpen(false);
    toast.success(`Successfully upgraded to ${targetTier} plan!`, {
      description: `Transaction ID: ${transactionId}`
    });
    onUpgradeSuccess?.(transactionId);
  };
  
  // Handle payment error
  const handlePaymentError = (error: string) => {
    toast.error('Payment failed', {
      description: error
    });
  };
  
  // Create tier upgrade options
  const tierUpgradeOptions: TierUpgradeOptions = {
    targetTier,
    billingCycle,
    currency,
    userId: getCurrentUser()?.id || ''
  };
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleUpgrade}
        disabled={disabled}
      >
        <Icon className="h-4 w-4 mr-2" />
        {children || defaultLabel}
      </Button>
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        tierUpgradeOptions={tierUpgradeOptions}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </>
  );
}