// src/lib/payment-service.ts
// Payment service for handling payment operations with Stripe and Paystack integration

import { api } from './api';
import { pricingApi } from './pricing-api';

/**
 * Local payment interfaces and types
 */
export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  provider: 'stripe' | 'paystack';
  createdAt: string;
  updatedAt: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  userId?: string;
  tierType: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'unpaid';
  billingCycle: string;
  amount: string;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  provider?: 'stripe' | 'paystack';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export interface CreatePaymentOptions {
  amount: number;
  currency: 'USD' | 'NGN';
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionOptions {
  planId: string;
  currency: 'USD' | 'NGN';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export class PaymentProviderError extends Error {
  constructor(message: string, public provider?: string, public code?: string) {
    super(message);
    this.name = 'PaymentProviderError';
  }
}

/**
 * Client-side country detection using IP geolocation
 */
async function getCountryFromIP(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code;
  } catch (error) {
    console.error('Error detecting country:', error);
    return 'US'; // Default to US if detection fails
  }
}

/**
 * Payment service configuration
 */
interface PaymentServiceConfig {
  stripePublicKey?: string;
  paystackPublicKey?: string;
  defaultCurrency: 'USD' | 'NGN';
  defaultProvider?: 'stripe' | 'paystack';
}

/**
 * Payment initiation response from backend
 */
interface PaymentInitiationResponse {
  success: boolean;
  paymentUrl?: string;
  clientSecret?: string;
  provider: 'stripe' | 'paystack';
  transactionId: string;
  error?: string;
  // Paystack-specific fields
  authorization_url?: string;
  access_code?: string;
  reference?: string;
  plan_code?: string;
}

/**
 * Subscription creation response from backend
 */
interface SubscriptionResponse {
  success: boolean;
  subscription?: Subscription;
  paymentUrl?: string;
  clientSecret?: string;
  provider: 'stripe' | 'paystack';
  error?: string;
}

/**
 * Payment status response
 */
interface PaymentStatusResponse {
  success: boolean;
  transaction?: Transaction | Subscription;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

/**
 * Tier upgrade options
 */
interface TierUpgradeOptions {
  targetTier: 'free' | 'basic' | 'pro';
  billingCycle: 'monthly' | 'yearly';
  currency: 'USD' | 'NGN';
  userId: string;
  userLocation?: {
    country: string;
    countryCode: string;
    currency: 'USD' | 'NGN';
    isNigeria: boolean;
  };
}

/**
 * Payment service class for handling frontend payment operations
 */
export class PaymentService {
  private config: PaymentServiceConfig;

  constructor(config: PaymentServiceConfig) {
    this.config = config;
  }

  /**
   * Initialize payment for tier upgrade
   * Automatically selects the best payment provider based on user's location
   */
  async initiateTierUpgrade(options: TierUpgradeOptions): Promise<PaymentInitiationResponse> {
    try {
      // Use location data from options if available, otherwise detect
      const provider = options.userLocation
        ? this.getOptimalPaymentProviderFromLocation(options.userLocation.countryCode)
        : await this.getOptimalPaymentProvider(options.currency);

      // Call the subscription endpoint for tier upgrades
      // Map frontend field names to backend expected names
      const { targetTier, ...restOptions } = options;

      // Map frontend tier names to backend tier enum values
      const tierMapping: Record<string, string> = {
        'basic': 'BASIC',
        'pro': 'PRO'
      };

      const mappedTierType = tierMapping[targetTier.toLowerCase()] || targetTier.toUpperCase();

      const response = await api.post('/subscription', {
        ...restOptions,
        tierType: mappedTierType,
        provider
      });

      return response.data;
    } catch (error) {
      console.error('Payment initiation failed:', error);
      throw new PaymentProviderError(
        `Failed to initiate payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a one-time payment for tier upgrade
   */
  async createOneTimePayment(options: TierUpgradeOptions): Promise<PaymentInitiationResponse> {
    try {
      const provider = options.userLocation
        ? this.getOptimalPaymentProviderFromLocation(options.userLocation.countryCode)
        : await this.getOptimalPaymentProvider(options.currency);

      const response = await api.post('/payments', {
        amount: await this.getTierPricing(options.targetTier, options.billingCycle, options.currency),
        currency: options.currency,
        description: `One-time payment for ${options.targetTier} tier`,
        metadata: {
          userId: options.userId,
          tierType: options.targetTier,
          billingCycle: options.billingCycle,
          type: 'one-time'
        }
      });

      return response.data;
    } catch (error) {
      console.error('One-time payment creation failed:', error);
      throw new PaymentProviderError(
        `Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a subscription for recurring payments
   */
  async createSubscription(options: TierUpgradeOptions): Promise<SubscriptionResponse> {
    try {
      const provider = options.userLocation
        ? this.getOptimalPaymentProviderFromLocation(options.userLocation.countryCode)
        : await this.getOptimalPaymentProvider(options.currency);

      const response = await api.post('/subscription', {
        ...options,
        amount: await this.getTierPricing(options.targetTier, options.billingCycle, options.currency),
        tierType: options.targetTier.toUpperCase(),
        billingCycle: options.billingCycle.toUpperCase(),
        provider
      });

      return response.data;
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw new PaymentProviderError(
        `Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check subscription status by transaction ID
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await api.get(`/subscription/${transactionId}`);
      return {
        success: response.data.success,
        status: response.data.subscription?.status === 'active' ? 'completed' :
          response.data.subscription?.status === 'pending' ? 'pending' :
            response.data.subscription?.status === 'cancelled' ? 'cancelled' : 'failed',
        transaction: response.data.subscription
      };
    } catch (error) {
      console.error('Subscription status check failed:', error);
      throw new PaymentProviderError(
        `Failed to check subscription status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(limit = 50, offset = 0): Promise<Transaction[]> {
    try {
      const response = await api.get(`/payments/history?limit=${limit}&offset=${offset}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      return [];
    }
  }

  /**
   * Get user's active subscription
   */
  async getActiveSubscription(): Promise<Subscription | null> {
    try {
      console.log('=== PaymentService getActiveSubscription Debug ===');
      console.log('Making API call to: /subscription');
      const response = await api.get('/subscription');
      console.log('API Response:', response.data);
      console.log('Subscription data:', response.data.data);
      console.log('================================================');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch active subscription:', error);
      return null;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.delete(`/subscription/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get optimal payment provider based on country code (faster, no API call)
   */
  private getOptimalPaymentProviderFromLocation(countryCode: string): 'stripe' | 'paystack' {
    // If default provider is set, use it
    if (this.config.defaultProvider) {
      return this.config.defaultProvider;
    }

    // Use Paystack for African countries, Stripe for others
    const paystackCountries = ['NG', 'GH', 'KE', 'ZA', 'EG', 'MA', 'TN', 'UG', 'TZ', 'RW'];
    if (paystackCountries.includes(countryCode)) {
      return 'paystack';
    }

    return 'stripe'; // Default to Stripe for other regions
  }

  /**
   * Get optimal payment provider based on currency and user location (fallback method)
   */
  private async getOptimalPaymentProvider(currency: 'USD' | 'NGN'): Promise<'stripe' | 'paystack'> {
    try {
      // If default provider is set, use it
      if (this.config.defaultProvider) {
        return this.config.defaultProvider;
      }

      // Auto-detect based on currency and location
      if (currency === 'NGN') {
        return 'paystack'; // Paystack is better for Nigerian payments
      }

      // For USD, try to detect user's country
      const country = await getCountryFromIP();

      return this.getOptimalPaymentProviderFromLocation(country);
    } catch (error) {
      console.warn('Failed to detect optimal payment provider, defaulting to Stripe:', error);
      return 'stripe';
    }
  }

  /**
   * Validate payment configuration
   */
  validateConfig(): boolean {
    if (!this.config.stripePublicKey && !this.config.paystackPublicKey) {
      console.error('No payment provider keys configured');
      return false;
    }
    return true;
  }

  /**
   * Update payment status (admin/internal use)
   */
  async updatePaymentStatus(reference: string, status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.put('/payments/status', {
        reference,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update payment status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update subscription status (admin/internal use)
   */
  async updateSubscriptionStatus(subscriptionId: string, status: 'INACTIVE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'PENDING'): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.put('/subscription/status', {
        subscriptionId,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update subscription status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get tier pricing using the pricing API
   */
  private async getTierPricing(tier: string, cycle: string, currency: string): Promise<number> {
    try {
      if (tier.toLowerCase() === 'free') {
        return 0;
      }
      
      return await pricingApi.getTierPricing(
        tier.toUpperCase() as 'BASIC' | 'PRO',
        cycle.toUpperCase() as 'MONTHLY' | 'YEARLY',
        currency as 'USD' | 'NGN'
      );
    } catch (error) {
      console.error('Failed to fetch tier pricing from API:', error);
      // Fallback to hardcoded pricing if API fails
      const fallbackPricing: Record<string, Record<string, Record<string, number>>> = {
        'basic': {
          'monthly': { 'USD': 9.99, 'NGN': 4000 },
          'yearly': { 'USD': 99.99, 'NGN': 40000 }
        },
        'pro': {
          'monthly': { 'USD': 19.99, 'NGN': 8000 },
          'yearly': { 'USD': 199.99, 'NGN': 80000 }
        }
      };
      
      return fallbackPricing[tier.toLowerCase()]?.[cycle.toLowerCase()]?.[currency] || 0;
    }
  }

  /**
   * Get supported payment methods for a provider
   */
  getSupportedPaymentMethods(provider: 'stripe' | 'paystack'): string[] {
    if (provider === 'stripe') {
      return ['card', 'bank_transfer', 'wallet'];
    }
    return ['card', 'bank', 'ussd', 'qr', 'mobile_money'];
  }
}

/**
 * Create and export a singleton payment service instance
 */
const paymentConfig: PaymentServiceConfig = {
  stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  paystackPublicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  defaultCurrency: 'USD',
  defaultProvider: import.meta.env.VITE_DEFAULT_PAYMENT_PROVIDER as 'stripe' | 'paystack' | undefined
};

export const paymentService = new PaymentService(paymentConfig);

// Export types for use in components
export type {
  PaymentInitiationResponse,
  SubscriptionResponse,
  PaymentStatusResponse,
  TierUpgradeOptions
};