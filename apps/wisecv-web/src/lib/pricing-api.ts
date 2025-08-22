import { api } from './api';

// Types for pricing API responses
export interface PricingPlan {
  id: string;
  tierType: 'FREE' | 'BASIC' | 'PRO';
  name: string;
  description: string;
  priceUSD: number;
  priceNGN: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  features: Array<{
    featureName: string;
    featureValue?: string;
    isLimitation: boolean;
    displayOrder: number;
  }>;
  providerPrices?: Array<{
    provider: 'stripe' | 'paystack';
    priceId: string;
    currency: 'USD' | 'NGN';
    amount: number;
    billingCycle: 'MONTHLY' | 'YEARLY';
  }>;
}

export interface PaymentProviderPrice {
  id: string;
  provider: 'stripe' | 'paystack';
  priceId: string;
  currency: 'USD' | 'NGN';
  amount: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
}

/**
 * Service for fetching pricing data from the backend API
 */
export class PricingApiService {
  /**
   * Get all pricing plans with optional currency filter
   */
  async getAllPlans(currency?: 'USD' | 'NGN'): Promise<PricingPlan[]> {
    try {
      const url = currency ? `/pricing/plans?currency=${currency}` : '/pricing/plans';
      const response = await api.get(url);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch pricing plans');
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      throw error;
    }
  }

  /**
   * Get pricing plans for a specific tier
   */
  async getPlansByTier(tier: 'FREE' | 'BASIC' | 'PRO', currency?: 'USD' | 'NGN'): Promise<PricingPlan[]> {
    try {
      const url = currency 
        ? `/pricing/plans/${tier}?currency=${currency}` 
        : `/pricing/plans/${tier}`;
      const response = await api.get(url);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch pricing plan');
      }
    } catch (error) {
      console.error(`Error fetching pricing plan for tier ${tier}:`, error);
      throw error;
    }
  }

  /**
   * Get payment provider prices for a specific plan
   */
  async getProviderPrices(
    planId: string, 
    provider?: 'stripe' | 'paystack', 
    currency?: 'USD' | 'NGN'
  ): Promise<PaymentProviderPrice[]> {
    try {
      let url = `/pricing/provider-prices/${planId}`;
      const params = new URLSearchParams();
      
      if (provider) params.append('provider', provider);
      if (currency) params.append('currency', currency);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      
      if (response.data.success) {
        return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else {
        throw new Error(response.data.message || 'Failed to fetch provider prices');
      }
    } catch (error) {
      console.error('Error fetching provider prices:', error);
      throw error;
    }
  }

  /**
   * Get pricing for a specific tier, billing cycle, and currency
   * This is a helper method that combines API calls to get the exact price
   */
  async getTierPricing(
    tier: 'BASIC' | 'PRO', 
    billingCycle: 'MONTHLY' | 'YEARLY', 
    currency: 'USD' | 'NGN'
  ): Promise<number> {
    try {
      const plans = await this.getPlansByTier(tier, currency);
      const plan = plans.find(p => p.billingCycle === billingCycle);
      
      if (!plan) {
        throw new Error(`No pricing plan found for ${tier} ${billingCycle} in ${currency}`);
      }
      
      return currency === 'USD' ? plan.priceUSD : plan.priceNGN;
    } catch (error) {
      console.error('Error getting tier pricing:', error);
      // Fallback to hardcoded pricing if API fails
      return this.getFallbackPricing(tier, billingCycle, currency);
    }
  }

  /**
   * Fallback pricing in case API is unavailable
   */
  private getFallbackPricing(
    tier: 'BASIC' | 'PRO', 
    billingCycle: 'MONTHLY' | 'YEARLY', 
    currency: 'USD' | 'NGN'
  ): number {
    const fallbackPricing: Record<string, Record<string, Record<string, number>>> = {
      'BASIC': {
        'MONTHLY': { 'USD': 9.99, 'NGN': 7500 },
        'YEARLY': { 'USD': 95.99, 'NGN': 72000 }
      },
      'PRO': {
        'MONTHLY': { 'USD': 24.99, 'NGN': 30000 },
        'YEARLY': { 'USD': 239.99, 'NGN': 288000 }
      }
    };

    return fallbackPricing[tier]?.[billingCycle]?.[currency] || 0;
  }

  /**
   * Get pricing display with currency symbol
   */
  async getPriceDisplay(
    tier: 'BASIC' | 'PRO', 
    billingCycle: 'MONTHLY' | 'YEARLY', 
    currency: 'USD' | 'NGN'
  ): Promise<string> {
    try {
      const price = await this.getTierPricing(tier, billingCycle, currency);
      const symbol = currency === 'USD' ? '$' : '₦';
      return `${symbol}${price.toLocaleString()}`;
    } catch (error) {
      console.error('Error getting price display:', error);
      return 'Price unavailable';
    }
  }
}

// Export singleton instance
export const pricingApi = new PricingApiService();