import React, { useState, useEffect } from 'react';
import { StripePaymentProvider } from './StripePaymentProvider';
import { StripePaymentForm } from './StripePaymentForm';
import { PaymentMethodType } from './PaymentMethodSelectorModal';

interface PaymentWrapperProps {
  orderId: string; // 🆕 Utiliser orderId au lieu de listing
  method: PaymentMethodType;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  enabled?: boolean;
}

export const PaymentWrapper: React.FC<PaymentWrapperProps> = ({
  orderId,
  method,
  onPaymentSuccess,
  onPaymentError,
  enabled = true
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<{ subtotalCents: number; serviceFeeCents: number; processingFeeCents: number; totalCents: number; currency: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!enabled) return;
      
      // Pour l'instant, seul Stripe est supporté
      if (method !== 'stripe') {
        onPaymentError(`Méthode ${method} pas encore implémentée`);
        setIsLoading(false);
        return;
      }
      
      try {
        const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
        const response = await fetch(`${apiBase}/api/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId, // 🆕 Envoyer l'orderId
          }),
        });
        
        const data = await response.json().catch(() => ({}));
        
        if (response.ok) {
          const { client_secret, breakdown } = data as any;
          setClientSecret(client_secret);
          if (breakdown) setBreakdown(breakdown);
        } else {
          console.error('❌ Create PI server error:', data);
          throw new Error((data as any).error || 'Erreur lors de la création du PaymentIntent');
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de la création du PaymentIntent:', err);
        onPaymentError(err.message || 'Erreur lors de l\'initialisation du paiement');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [orderId, method, onPaymentError, enabled]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Initialisation du paiement...</span>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-4 text-center text-red-600">
        {enabled ? "Erreur lors de l'initialisation du paiement" : "Acceptez les conditions pour continuer"}
      </div>
    );
  }

  // Afficher le récapitulatif des frais si disponible
  const totalAmount = breakdown ? breakdown.totalCents / 100 : 0;
  const currency = breakdown?.currency || 'eur';

  return (
    <div className="space-y-4">
      {/* Récapitulatif des frais */}
      {breakdown && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="font-medium">
              {(breakdown.subtotalCents / 100).toFixed(2)} {currency.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frais de service (5%)</span>
            <span className="font-medium">
              {(breakdown.serviceFeeCents / 100).toFixed(2)} {currency.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frais de traitement</span>
            <span className="font-medium">
              {(breakdown.processingFeeCents / 100).toFixed(2)} {currency.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">
              {totalAmount.toFixed(2)} {currency.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      <StripePaymentProvider 
        clientSecret={clientSecret}
        amount={totalAmount}
        currency={currency}
      >
        <StripePaymentForm
          amount={totalAmount}
          currency={currency}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
        />
      </StripePaymentProvider>
    </div>
  );
};
