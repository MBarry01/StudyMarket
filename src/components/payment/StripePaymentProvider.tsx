import React, { useMemo } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe, stripeOptions, stripeDarkOptions } from '../../lib/stripe';
import { useTheme } from 'next-themes';

interface StripePaymentProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
  amount?: number;
  currency?: string;
}

export const StripePaymentProvider: React.FC<StripePaymentProviderProps> = ({
  children,
  clientSecret,
  amount = 0,
  currency = 'eur'
}) => {
  const { resolvedTheme } = useTheme();
  
  // Construire les options Elements correctement
  const appearance = (resolvedTheme === 'dark' ? stripeDarkOptions : stripeOptions).appearance;
  // IMPORTANT: Ne pas recréer l'objet options quand clientSecret est présent
  const options = useMemo(() => {
    if (clientSecret) {
      return { clientSecret, appearance } as const;
    }
    return {
      mode: 'payment' as const,
      amount: Math.round((amount || 0) * 100),
      currency: (currency || 'eur').toLowerCase(),
      appearance,
    } as const;
  }, [clientSecret, resolvedTheme]);

  return (
    <Elements key={`${resolvedTheme}_${clientSecret ? `cs_${clientSecret.slice(-8)}` : 'deferred'}`}
      stripe={getStripe()} options={options}>
      {children}
    </Elements>
  );
};