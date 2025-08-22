// src/components/payment/PaymentMethodSelector.tsx
// Component for selecting payment provider (Stripe or Paystack)

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Building2, Loader2 } from 'lucide-react';

interface PaymentMethodSelectorProps {
  currency: 'USD' | 'NGN';
  onMethodSelect: (provider: 'stripe' | 'paystack') => void;
  isLoading?: boolean;
}

interface PaymentProviderOption {
  id: 'stripe' | 'paystack';
  name: string;
  description: string;
  icon: React.ReactNode;
  supportedMethods: string[];
  recommended?: boolean;
  currencies: string[];
}

export default function PaymentMethodSelector({
  currency,
  onMethodSelect,
  isLoading = false
}: PaymentMethodSelectorProps) {
  
  const paymentProviders: PaymentProviderOption[] = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Secure international payments',
      icon: <CreditCard className="h-6 w-6" />,
      supportedMethods: ['Credit Card', 'Debit Card', 'Bank Transfer'],
      recommended: currency === 'USD',
      currencies: ['USD', 'NGN']
    },
    {
      id: 'paystack',
      name: 'Paystack',
      description: 'Optimized for African payments',
      icon: <Smartphone className="h-6 w-6" />,
      supportedMethods: ['Card', 'Bank Transfer', 'USSD', 'Mobile Money'],
      recommended: currency === 'NGN',
      currencies: ['NGN', 'USD']
    }
  ];

  // Filter providers that support the selected currency
  const availableProviders = paymentProviders.filter(provider => 
    provider.currencies.includes(currency)
  );

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Choose your preferred payment method for {currency} payments
        </p>
      </div>

      <div className="grid gap-3">
        {availableProviders.map((provider) => (
          <Card 
            key={provider.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              provider.recommended ? 'ring-2 ring-primary/20 bg-primary/5' : ''
            } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => !isLoading && onMethodSelect(provider.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg border">
                    {provider.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {provider.name}
                      {provider.recommended && (
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {provider.description}
                    </CardDescription>
                  </div>
                </div>
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Supported methods:
                </div>
                <div className="flex flex-wrap gap-1">
                  {provider.supportedMethods.map((method) => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional payment info */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Secure Payment Processing</p>
            <p className="text-xs text-muted-foreground">
              All payments are processed securely using industry-standard encryption. 
              Your payment information is never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Manual provider selection buttons as fallback */}
      <div className="grid grid-cols-2 gap-2">
        {availableProviders.map((provider) => (
          <Button
            key={`btn-${provider.id}`}
            variant={provider.recommended ? "default" : "outline"}
            onClick={() => onMethodSelect(provider.id)}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <span className="mr-2">{provider.icon}</span>
            )}
            {provider.name}
          </Button>
        ))}
      </div>
    </div>
  );
}