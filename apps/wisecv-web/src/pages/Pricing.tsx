import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingCard from '@/components/pricing/PricingCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { LoadingState } from '@/types/common';
import { getCachedUserLocation, GeolocationData } from '@/lib/geolocation';
import { pricingApi } from '@/lib/pricing-api';

interface PricingPlan {
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
  }>;
}

export default function Pricing() {
  const [userLocation, setUserLocation] = useState<GeolocationData | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [locationLoading, setLocationLoading] = useState(true);

  // Detect user location and set currency
  const detectUserLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await getCachedUserLocation();
      setUserLocation(location);
      console.log('Detected user location:', location);
    } catch (error) {
      console.error('Failed to detect user location:', error);
      // Fallback to US/USD
      setUserLocation({
        country: 'United States',
        countryCode: 'US',
        currency: 'USD',
        isNigeria: false
      });
    } finally {
      setLocationLoading(false);
    }
  };

  // Fetch pricing plans from API
  const fetchPricingPlans = async (currency: 'USD' | 'NGN') => {
    try {
      setLoadingState(LoadingState.LOADING);
      const response = await api.get(`/pricing/plans?currency=${currency}`);

      if (response.data.success) {
        setPricingPlans(response.data.data);
        setLoadingState(LoadingState.SUCCESS);
      } else {
        throw new Error(response.data.message || 'Failed to fetch pricing plans');
      }
    } catch (error: any) {
      console.error('Error fetching pricing plans:', error);
      setLoadingState(LoadingState.ERROR);
      toast.error('Failed to load pricing plans. Please try again.');

      // Fallback to hardcoded plans with API pricing if possible
      const fallbackPlans = await getEnhancedFallbackPlans(currency);
      setPricingPlans(fallbackPlans);
    }
  };

  // Handle successful upgrade
  const handleUpgradeSuccess = () => {
    toast.success('Payment successful! Welcome to your new plan.');
    // Optionally redirect to dashboard or refresh user data
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
  };

  // Fallback plans when API is unavailable - using minimal hardcoded data
  const getHardcodedPlans = (): PricingPlan[] => [
    {
      id: 'free',
      tierType: 'FREE',
      name: 'Free',
      description: 'Get started with basic resume improvements',
      priceUSD: 0,
      priceNGN: 0,
      billingCycle: 'MONTHLY',
      features: [
        { featureName: '1 AI resume improvement', isLimitation: false },
        { featureName: '3 job description application matching', isLimitation: false },
        { featureName: 'Access to pro templates', isLimitation: false },
        { featureName: 'Download resume with watermark', isLimitation: false },
        { featureName: 'Basic support', isLimitation: false },
        { featureName: 'No access to Job Center', isLimitation: true },
        { featureName: 'No auto-apply functionality', isLimitation: true },
        { featureName: 'No priority support', isLimitation: true },
        { featureName: 'No cover letter generator', isLimitation: true },
        { featureName: 'No ATS scan compatibility check', isLimitation: true },
      ],
    },
    {
      id: 'basic',
      tierType: 'BASIC',
      name: 'Basic',
      description: 'Perfect for active job seekers',
      priceUSD: 9.99,
      priceNGN: 7500,
      billingCycle: 'MONTHLY',
      features: [
        { featureName: 'Up to 3 AI analyses/month', isLimitation: false },
        { featureName: '3 sets of AI suggestions/month', isLimitation: false },
        { featureName: 'Download resume without watermark', isLimitation: false },
        { featureName: 'Limited selection of pro templates', isLimitation: false },
        { featureName: 'Up to 3 job matchings/month', isLimitation: false },
        { featureName: 'Limited AI resume generator (3/month)', isLimitation: false },
        { featureName: 'Auto-apply to up to 10 jobs/month', isLimitation: false },
        { featureName: 'Track last 3 CV improvement sessions', isLimitation: false },
        { featureName: 'Email support', isLimitation: false },
        { featureName: 'Cover letter generator (3/month)', isLimitation: false },
        { featureName: 'ATS compatibility check (3/month)', isLimitation: false },
        { featureName: 'Basic portfolio page', isLimitation: false },
      ],
    },
    {
      id: 'pro',
      tierType: 'PRO',
      name: 'Pro',
      description: 'For serious career advancement',
      priceUSD: 24.99,
      priceNGN: 30000,
      billingCycle: 'MONTHLY',
      features: [
        { featureName: 'Unlimited AI resume analyses', isLimitation: false },
        { featureName: 'Unlimited AI suggestions', isLimitation: false },
        { featureName: 'Download resume without watermark', isLimitation: false },
        { featureName: 'Full access to pro templates', isLimitation: false },
        { featureName: 'Unlimited job description matching', isLimitation: false },
        { featureName: 'Unlimited AI resume generator', isLimitation: false },
        { featureName: 'Unlimited auto-apply to jobs', isLimitation: false },
        { featureName: 'Full CV improvement history + insights', isLimitation: false },
        { featureName: 'Priority support via chat + email', isLimitation: false },
        { featureName: 'Unlimited cover letter generation', isLimitation: false },
        { featureName: 'Unlimited ATS compatibility checks', isLimitation: false },
        { featureName: 'Full customizable portfolio page', isLimitation: false },
      ],
    },
  ];

  // Enhanced fallback that tries to get pricing from API even when main endpoint fails
  const getEnhancedFallbackPlans = async (currency: 'USD' | 'NGN'): Promise<PricingPlan[]> => {
    const basePlans = getHardcodedPlans();
    
    try {
      // Try to get individual tier plans as fallback
      const [basicPlans, proPlans] = await Promise.allSettled([
        pricingApi.getPlansByTier('BASIC', currency),
        pricingApi.getPlansByTier('PRO', currency)
      ]);

      // Update plans with fetched data
      return basePlans.map(plan => {
        if (plan.tierType === 'BASIC' && basicPlans.status === 'fulfilled') {
          const monthlyBasic = basicPlans.value.find(p => p.billingCycle === 'MONTHLY');
          if (monthlyBasic) {
            return {
              ...plan,
              priceUSD: monthlyBasic.priceUSD,
              priceNGN: monthlyBasic.priceNGN,
              features: monthlyBasic.features
            };
          }
        }
        if (plan.tierType === 'PRO' && proPlans.status === 'fulfilled') {
          const monthlyPro = proPlans.value.find(p => p.billingCycle === 'MONTHLY');
          if (monthlyPro) {
            return {
              ...plan,
              priceUSD: monthlyPro.priceUSD,
              priceNGN: monthlyPro.priceNGN,
              features: monthlyPro.features
            };
          }
        }
        return plan;
      });
    } catch (error) {
      console.error('Failed to enhance fallback plans with API pricing:', error);
      return basePlans;
    }
  };

  // Calculate yearly discount (20% off)
  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.floor(monthlyPrice * 12 * 0.8); // 20% discount
  };

  // Get price based on billing cycle
  const getPrice = (plan: PricingPlan) => {
    // If we're showing yearly and the plan is already yearly, use its prices
    if (billingCycle === 'yearly' && plan.billingCycle === 'YEARLY') {
      return {
        usd: plan.priceUSD,
        ngn: plan.priceNGN
      };
    }
    // If we're showing yearly but plan is monthly, calculate yearly price
    if (billingCycle === 'yearly' && plan.billingCycle === 'MONTHLY') {
      return {
        usd: getYearlyPrice(plan.priceUSD),
        ngn: getYearlyPrice(plan.priceNGN)
      };
    }
    // For monthly billing or monthly plans, use original prices
    return {
      usd: plan.priceUSD,
      ngn: plan.priceNGN
    };
  };

  // Convert API plan to component format
  const convertPlanToComponentFormat = (plan: PricingPlan) => {
    const features = plan.features.filter(f => !f.isLimitation).map(f => f.featureName);
    const limitations = plan.features.filter(f => f.isLimitation).map(f => f.featureName);

    return {
      title: plan.name,
      description: plan.description,
      price: getPrice(plan),
      features,
      limitations,
      isPrimary: plan.tierType === 'BASIC',
      ctaText: plan.tierType === 'FREE' ? 'Get Started' :
        plan.tierType === 'BASIC' ? 'Get Started' : 'Go Pro',
    };
  };

  // Detect user location on component mount
  useEffect(() => {
    detectUserLocation();
  }, []);

  // Load pricing plans when user location is detected
  useEffect(() => {
    if (userLocation) {
      fetchPricingPlans(userLocation.currency);
    }
  }, [userLocation]);

  // Get plans for current billing cycle, fallback to monthly if yearly not available
  const currentCyclePlans = pricingPlans.filter(plan => 
    plan.billingCycle === (billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY')
  );
  
  // If no plans for current cycle, try to get monthly plans and calculate yearly
  const fallbackPlans = currentCyclePlans.length === 0 
    ? pricingPlans.filter(plan => plan.billingCycle === 'MONTHLY')
    : currentCyclePlans;
    
  const displayPlans = fallbackPlans.length > 0 ? fallbackPlans : getHardcodedPlans();

  return (
    <>
      <Navbar />
      <main>
        <div className="bg-gray-50 py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Simple, Transparent Pricing
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose the plan that works best for your career needs. All plans
                come with a 7-day money-back guarantee.
              </p>
            </div>

            {/* Location and Currency Display */}
            {userLocation && (
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                  <p className="text-sm text-gray-600">
                    Showing prices for <span className="font-medium">{userLocation.country}</span> in{' '}
                    <span className="font-medium">
                      {userLocation.currency === 'NGN' ? 'Nigerian Naira (₦)' : 'US Dollars ($)'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mt-8">
              <div className="bg-white rounded-lg p-1 shadow-sm border">
                <Button
                  variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('monthly')}
                  className="rounded-md"
                >
                  Monthly
                </Button>
                <Button
                  variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('yearly')}
                  className="rounded-md relative"
                >
                  Yearly
                  <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 py-0.5">
                    20% off
                  </Badge>
                </Button>
              </div>
            </div>

            {(loadingState === LoadingState.LOADING || locationLoading) ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                {displayPlans.map((plan, index) => {
                  const convertedPlan = convertPlanToComponentFormat(plan);
                  const planPrice = convertedPlan.price;
                  const originalPrice = { usd: plan.priceUSD, ngn: plan.priceNGN };
                  const showDiscount = billingCycle === 'yearly' && originalPrice.usd > 0;

                  return (
                    <PricingCard
                      key={`${plan.id}-${billingCycle}`}
                      title={convertedPlan.title}
                      description={convertedPlan.description}
                      price={planPrice}
                      isNGN={userLocation?.isNigeria || false}
                      features={convertedPlan.features}
                      limitations={convertedPlan.limitations}
                      isPrimary={convertedPlan.isPrimary}
                      ctaText={convertedPlan.ctaText}
                      billingCycle={billingCycle}
                      onUpgradeSuccess={handleUpgradeSuccess}
                      userLocation={userLocation}
                    />
                  );
                })}
              </div>
            )}

            {/* Yearly Savings Notice */}
            {billingCycle === 'yearly' && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium">
                    💰 Save up to {userLocation?.isNigeria ? '₦21,600' : '$43.20'} per year with yearly billing!
                  </span>
                </div>
              </div>
            )}

            <div className="mt-16 text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Need a custom plan?
              </h2>
              <p className="text-gray-600 mb-6">
                Contact our team for custom requirements or bulk pricing
              </p>
              <a
                href="mailto:sales@wisecv.co"
                className="text-cvwise-blue hover:underline"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
