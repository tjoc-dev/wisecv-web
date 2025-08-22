// src/lib/geolocation.ts
// Utility for detecting user's country and currency based on IP geolocation

export interface GeolocationData {
  country: string;
  countryCode: string;
  currency: 'USD' | 'NGN';
  isNigeria: boolean;
}

/**
 * Detect user's country and determine appropriate currency
 * Uses multiple fallback services for reliability
 */
export async function detectUserLocation(): Promise<GeolocationData> {
  // Check for test mode - force US/USD for payment testing
  if (import.meta.env.VITE_PAYMENT_TEST_USA === 'true') {
    console.log('PAYMENT_TEST_USA is enabled - forcing US/USD location for testing');
    return {
      country: 'United States',
      countryCode: 'US',
      currency: 'USD',
      isNigeria: false
    };
  }

  // Default fallback for US
  const defaultLocation: GeolocationData = {
    country: 'United States',
    countryCode: 'US',
    currency: 'USD',
    isNigeria: false
  };

  try {
    // Try primary geolocation service
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000
    } as RequestInit);
    
    if (!response.ok) {
      throw new Error('Primary geolocation service failed');
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.reason || 'Geolocation API error');
    }
    
    const countryCode = data.country_code;
    const country = data.country_name;
    
    return {
      country: country || 'Unknown',
      countryCode: countryCode || 'US',
      currency: countryCode === 'NG' ? 'NGN' : 'USD',
      isNigeria: countryCode === 'NG'
    };
  } catch (error) {
    console.warn('Primary geolocation failed, trying fallback:', error);
    
    try {
      // Fallback to alternative service
      const fallbackResponse = await fetch('https://api.country.is/', {
        timeout: 3000
      } as RequestInit);
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const countryCode = fallbackData.country;
        
        return {
          country: getCountryName(countryCode),
          countryCode: countryCode || 'US',
          currency: countryCode === 'NG' ? 'NGN' : 'USD',
          isNigeria: countryCode === 'NG'
        };
      }
    } catch (fallbackError) {
      console.warn('Fallback geolocation also failed:', fallbackError);
    }
    
    // Final fallback - check timezone as a hint
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('Lagos') || timezone.includes('Africa')) {
        return {
          country: 'Nigeria',
          countryCode: 'NG',
          currency: 'NGN',
          isNigeria: true
        };
      }
    } catch (timezoneError) {
      console.warn('Timezone detection failed:', timezoneError);
    }
    
    console.warn('All geolocation methods failed, using default location');
    return defaultLocation;
  }
}

/**
 * Get country name from country code
 */
function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    'NG': 'Nigeria',
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IN': 'India',
    'BR': 'Brazil',
    'ZA': 'South Africa',
    'GH': 'Ghana',
    'KE': 'Kenya',
    'EG': 'Egypt'
  };
  
  return countryNames[countryCode] || 'Unknown';
}

/**
 * Determine optimal payment processor based on country
 */
export function getOptimalPaymentProcessor(countryCode: string): 'stripe' | 'paystack' {
  // African countries that work well with Paystack
  const paystackCountries = ['NG', 'GH', 'KE', 'ZA', 'EG', 'MA', 'TN', 'UG', 'TZ', 'RW'];
  
  if (paystackCountries.includes(countryCode)) {
    return 'paystack';
  }
  
  return 'stripe';
}

/**
 * Cache geolocation data to avoid repeated API calls
 */
class GeolocationCache {
  private static readonly CACHE_KEY = 'user_geolocation';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  static get(): GeolocationData | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp > this.CACHE_DURATION) {
        this.clear();
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  }
  
  static set(data: GeolocationData): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache geolocation data:', error);
    }
  }
  
  static clear(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear geolocation cache:', error);
    }
  }
}

/**
 * Get user location with caching
 */
export async function getCachedUserLocation(): Promise<GeolocationData> {
  // Check for test mode first - don't use cache for testing
  if (import.meta.env.VITE_PAYMENT_TEST_USA === 'true') {
    return detectUserLocation();
  }

  // Try to get from cache first
  const cached = GeolocationCache.get();
  if (cached) {
    return cached;
  }
  
  // Detect and cache
  const location = await detectUserLocation();
  GeolocationCache.set(location);
  
  return location;
}