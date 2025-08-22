// Subscription Management Components
export { default as SubscriptionManagement } from './SubscriptionManagement';
export { default as SubscriptionCard } from './SubscriptionCard';
export { default as SubscriptionActions } from './SubscriptionActions';
export { default as SubscriptionStatusBadge } from './SubscriptionStatusBadge';
export { default as PaymentHistoryTable } from './PaymentHistoryTable';
export { default as TierComparisonModal } from './TierComparisonModal';
export { default as UsageStatsCard } from './UsageStatsCard';

// Types
export interface SubscriptionData {
  id: string;
  userId: string;
  tier: 'free' | 'basic' | 'pro';
  status: 'active' | 'cancelled' | 'past_due' | 'incomplete' | 'trialing';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentProvider: 'stripe' | 'paystack';
  subscriptionId: string;
  customerId: string;
  priceId: string;
  currency: 'USD' | 'NGN';
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistory {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: 'USD' | 'NGN';
  status: 'succeeded' | 'failed' | 'pending' | 'cancelled';
  paymentMethod: string;
  paymentProvider: 'stripe' | 'paystack';
  description: string;
  receiptUrl?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface UsageStats {
  cvs: {
    used: number;
    limit: number | 'unlimited';
  };
  downloads: {
    used: number;
    limit: number | 'unlimited';
    resetDate?: string;
  };
  templates: {
    used: number;
    limit: number | 'unlimited';
  };
  storage?: {
    used: number; // in MB
    limit: number | 'unlimited'; // in MB
  };
}

export interface TierFeatures {
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    cvs: number | 'unlimited';
    templates: number | 'unlimited';
    downloads: number | 'unlimited';
    storage?: number | 'unlimited';
  };
}