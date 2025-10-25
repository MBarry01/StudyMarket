import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CreditCard, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface StripePaymentFormProps {
  amount: number;
  currency: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Valider les éléments de paiement
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Une erreur est survenue');
        onPaymentError(submitError.message || 'Erreur de validation');
        return;
      }

      // Confirmer le paiement
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/StudyMarket/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setError(error.message || 'Le paiement a échoué');
        onPaymentError(error.message || 'Erreur de paiement');
        toast.error('Paiement échoué');
      } else {
        setIsSuccess(true);
        onPaymentSuccess(paymentIntent?.id || '');
        toast.success('Paiement effectué avec succès !');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Une erreur inattendue est survenue';
      setError(errorMessage);
      onPaymentError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            Paiement réussi !
          </h3>
          <p className="text-muted-foreground">
            Votre paiement de {formatAmount(amount, currency)} a été traité avec succès.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Paiement sécurisé
        </CardTitle>
        <CardDescription>
          Montant : {formatAmount(amount, currency)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <PaymentElement 
              options={{
                layout: 'tabs',
              }}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!stripe || !elements || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Payer {formatAmount(amount, currency)}
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Paiement sécurisé par Stripe
          </p>
        </div>
      </CardContent>
    </Card>
  );
};