# Payment Service API Updates

This document outlines the updates made to the frontend payment service to align with the backend API endpoints.

## Updated API Calls

### 1. Create One-Time Payment
**Before:**
```typescript
api.post('/payments/create-payment', { ...options, provider, type: 'one-time' })
```

**After:**
```typescript
api.post('/payments', {
  amount: this.getTierPricing(options.targetTier, options.billingCycle, options.currency),
  currency: options.currency,
  description: `One-time payment for ${options.targetTier} tier`,
  metadata: {
    userId: options.userId,
    tierType: options.targetTier,
    billingCycle: options.billingCycle,
    type: 'one-time'
  }
})
```

### 2. Check Payment Status
**Before:**
```typescript
api.get(`/payments/status/${transactionId}`)
```

**After:**
```typescript
api.get(`/payments/${transactionId}`)
```

### 3. Get Payment History
**Before:**
```typescript
api.get(`/wisecv/payments/history/${userId}`)
// Returns: response.data.transactions
```

**After:**
```typescript
api.get(`/payments/history?limit=${limit}&offset=${offset}`)
// Returns: response.data.data
// Method signature changed: getPaymentHistory(limit = 50, offset = 0)
```

### 4. Get Active Subscription
**Before:**
```typescript
api.get(`/wisecv/payments/subscriptions/${userId}`)
// Method: getActiveSubscriptions(userId: string): Promise<Subscription[]>
// Returns: response.data.subscriptions
```

**After:**
```typescript
api.get('/payments/subscription')
// Method: getActiveSubscription(): Promise<Subscription | null>
// Returns: response.data.data
```

### 5. Cancel Subscription
**Before:**
```typescript
api.post(`/wisecv/payments/subscriptions/${subscriptionId}/cancel`)
```

**After:**
```typescript
api.delete(`/payments/subscription/${subscriptionId}`)
```

## New Methods Added

### 1. Update Payment Status
```typescript
async updatePaymentStatus(reference: string, status: PaymentStatus): Promise<{ success: boolean; error?: string }>
```
- **Endpoint:** `PUT /payments/status`
- **Purpose:** Admin/internal use for updating payment status

### 2. Update Subscription Status
```typescript
async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus): Promise<{ success: boolean; error?: string }>
```
- **Endpoint:** `PUT /payments/subscription/status`
- **Purpose:** Admin/internal use for updating subscription status

### 3. Get Tier Pricing (Helper)
```typescript
private getTierPricing(tier: string, cycle: string, currency: string): number
```
- **Purpose:** Calculate pricing for tiers based on billing cycle and currency
- **Supports:** Basic, Premium, Pro tiers with monthly/yearly cycles in USD/NGN

## Key Changes Summary

1. **Endpoint Alignment:** All API calls now match the actual backend routes defined in `payment.routes.ts`
2. **Authentication:** All endpoints now properly use the authenticated routes (no more `/wisecv` prefix)
3. **Method Signatures:** Updated method signatures to match backend expectations
4. **Response Handling:** Updated to handle the standardized response format (`response.data.data`)
5. **New Functionality:** Added methods for status updates and pricing calculations
6. **Consistency:** Maintained consistent error handling and response patterns

## Breaking Changes

1. `getActiveSubscriptions()` → `getActiveSubscription()` (returns single subscription instead of array)
2. `getPaymentHistory(userId)` → `getPaymentHistory(limit, offset)` (no longer requires userId, uses authenticated user)
3. All endpoints now require proper authentication via the API middleware

## Migration Notes

- Components using `getActiveSubscriptions()` should be updated to use `getActiveSubscription()`
- Payment history calls should be updated to use pagination parameters
- The pricing logic is now handled client-side with the `getTierPricing()` helper method
- All API calls now go through the authenticated `/payments` routes