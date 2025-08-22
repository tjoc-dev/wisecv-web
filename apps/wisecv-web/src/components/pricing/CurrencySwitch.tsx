import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CurrencySwitchProps {
  isNGN: boolean;
  setIsNGN: (value: boolean) => void;
}

export default function CurrencySwitch({
  isNGN,
  setIsNGN,
}: CurrencySwitchProps) {
  return (
    <div className="flex items-center space-x-4 justify-center mb-8">
      <Label htmlFor="currency-switch" className={!isNGN ? 'font-bold' : ''}>
        USD
      </Label>
      <Switch id="currency-switch" checked={isNGN} onCheckedChange={setIsNGN} />
      <Label htmlFor="currency-switch" className={isNGN ? 'font-bold' : ''}>
        NGN
      </Label>
    </div>
  );
}
