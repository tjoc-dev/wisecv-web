import axios from 'axios';
import { setupAuthInterceptor } from './auth-interceptor';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
});

// Request interceptor for auth token and app name
api.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem('accessToken');
  if (token) {
    (config.headers as Record<string, string>)['Authorization'] =
      `Bearer ${token}`;
  }

  // Add x-app-name header for all requests
  (config.headers as Record<string, string>)['x-app-name'] = 'wisecv';

  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Setup global 401 error handling
setupAuthInterceptor(api);

// Response interceptor for other error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip 401 errors as they're handled by the auth interceptor
    if (error.response?.status === 401) {
      return Promise.reject(error);
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error);
      throw new Error('Request timeout - please check your connection');
    }
    
    if (error.response?.status >= 500) {
      console.error('Server error:', error);
      throw new Error('Server error - please try again later');
    }
    
    return Promise.reject(error);
  }
);

export interface TierLimits {
  resumeImprovements: number;
  jobApplications: number;
  autoAppliesPerMonth: number;
  hasJobCenter: boolean;
  hasAutoApply: boolean;
}

export interface TierUsage {
  resumeImprovementsUsed: number;
  jobApplicationsUsed: number;
  autoAppliesUsed: number;
  lastResetDate: string;
}

export interface UserTierInfo {
  id: string;
  userId: string;
  tier: 'FREE' | 'BASIC' | 'PRO';
  limits: TierLimits;
  usage: TierUsage;
  remaining: {
    resumeImprovements: number;
    jobApplications: number;
    autoApplies: number;
  };
  dateCreated: string;
  dateUpdated: string;
}

export interface TierConfig {
  tier: 'FREE' | 'BASIC' | 'PRO';
  displayName: string;
  limits: TierLimits;
  price: {
    usd: number;
    ngn: number;
  };
  features: string[];
  limitations?: string[];
}

export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  tier: string;
  limit?: number;
  used?: number;
}

export interface UpgradeSuggestion {
  currentTier: string;
  suggestedTier: string;
  reason: string;
  benefits: string[];
  savings?: string;
}

// Get all available tiers
export async function getAllTiers(): Promise<TierConfig[]> {
  try {
    const response = await api.get('/tiers');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tiers:', error);
    throw new Error('Failed to fetch tier information');
  }
}

// Get user's current tier information
export async function getUserTier(userId: string): Promise<UserTierInfo> {
  if (!userId) {
    console.error('getUserTier: No user ID provided');
    throw new Error('User ID is required');
  }
  
  try {
    console.log('getUserTier: Fetching tier info for user:', userId);
    console.log('getUserTier: Making API call to:', `/tiers/user/${userId}`);
    
    const response = await api.get(`/tiers/user/${userId}`);
    console.log('getUserTier: API response received:', response.data);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosError = error as any; // Type assertion for axios error properties
    console.error('getUserTier: API call failed:', {
      error: errorMessage,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
      config: {
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        headers: axiosError.config?.headers
      }
    });
    
    if (axiosError.response?.status === 404) {
      throw new Error('User tier not found - please contact support');
    }
    
    if (axiosError.response?.status === 401) {
      throw new Error('Authentication required - please log in again');
    }
    
    const message = axiosError.response?.data?.message || errorMessage || 'Failed to fetch user tier information';
    throw new Error(message);
  }
}

// Check if user can perform a specific action
export async function checkFeatureAccess(
  userId: string,
  action: 'resumeImprovement' | 'jobApplication' | 'autoApply' | 'jobCenter'
): Promise<FeatureAccessResult> {
  try {
    const response = await api.get(`/tiers/user/${userId}/access`, {
      params: { action }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to check feature access:', error);
    throw new Error('Failed to check feature access');
  }
}

// Record usage of a feature
export async function recordUsage(
  userId: string,
  action: 'resumeImprovement' | 'jobApplication' | 'autoApply'
): Promise<TierUsage> {
  try {
    const response = await api.post(`/tiers/user/${userId}/usage`, {
      action
    });
    return response.data;
  } catch (error) {
    console.error('Failed to record usage:', error);
    throw new Error('Failed to record feature usage');
  }
}

// Get user's usage statistics
export async function getUserUsage(userId: string): Promise<TierUsage> {
  try {
    const response = await api.get(`/tiers/user/${userId}/usage`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user usage:', error);
    throw new Error('Failed to fetch usage statistics');
  }
}

// Get upgrade suggestions for user
export async function getUpgradeSuggestions(userId: string): Promise<UpgradeSuggestion[]> {
  try {
    const response = await api.get(`/tiers/user/${userId}/upgrade-suggestions`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch upgrade suggestions:', error);
    throw new Error('Failed to fetch upgrade suggestions');
  }
}

// Upgrade user tier
export async function upgradeTier(
  userId: string,
  newTier: 'BASIC' | 'PRO'
): Promise<UserTierInfo> {
  try {
    const response = await api.put(`/tiers/user/${userId}/upgrade`, {
      newTier
    });
    return response.data;
  } catch (error) {
    console.error('Failed to upgrade tier:', error);
    throw new Error('Failed to upgrade tier');
  }
}

// Helper function to get tier display information
export function getTierDisplayInfo(tier: 'FREE' | 'BASIC' | 'PRO') {
  const tierInfo = {
    FREE: {
      name: 'Free',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300'
    },
    BASIC: {
      name: 'Basic',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300'
    },
    PRO: {
      name: 'Pro',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-300'
    }
  };

  return tierInfo[tier] || tierInfo.FREE;
}

// Helper function to calculate usage percentage
export function calculateUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min((used / limit) * 100, 100);
}

// Helper function to check if user is approaching limit
export function isApproachingLimit(used: number, limit: number, threshold: number = 0.8): boolean {
  if (limit === 0) return false;
  return (used / limit) >= threshold;
}

// Helper function to format remaining usage
export function formatRemainingUsage(remaining: number, limit: number): string {
  if (limit === 0) return 'Not available';
  if (remaining === -1) return 'Unlimited';
  return `${remaining} of ${limit} remaining`;
}