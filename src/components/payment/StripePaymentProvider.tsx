import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Load Stripe outside of a component's render to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51O5JqHLVDYKrxBIwIyiUQOmNk9HFZJKvBz6zJyRNBNjkKSGVEvZKEwlKnwL2JV8PmXVjWSHoZ9XQfKOiLkXGZ9Nh00wPxKdm9p');

interface StripePaymentProviderProps {
  amount: number;
  currency: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

export const StripePaymentProvider: React.FC<StripePaymentProviderProps> = ({
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError
}) => {
  const options = {
    appearance: {
      theme: 'stripe',
    },
    locale: 'fr',
  };

  // Check if Stripe is properly initialized
  if (!stripePromise) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Configuration Stripe manquante</strong> - Veuillez configurer votre clé publique Stripe dans le fichier .env
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentForm 
        amount={amount}
        currency={currency}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
};