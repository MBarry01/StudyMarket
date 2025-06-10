import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // For demo purposes, we'll simulate a successful payment
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      const mockPaymentId = 'pi_' + Math.random().toString(36).substring(2, 15);
      
      toast.success('Paiement réussi !');
      onPaymentSuccess(mockPaymentId);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Une erreur est survenue lors du paiement');
      onPaymentError(err.message || 'Une erreur est survenue lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Paiement par carte bancaire
        </CardTitle>
        <CardDescription>
          Paiement sécurisé via Stripe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-md">
            <div className="h-10 flex items-center">
              <div className="text-muted-foreground">
                Formulaire de carte bancaire (simulation)
              </div>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border-blue-200 bg-blue-50">
            <Lock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Vos informations de paiement sont sécurisées et cryptées par Stripe.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground">
            <p>Pour tester, utilisez ces cartes :</p>
            <ul className="list-disc pl-5 mt-1">
              <li>Succès : 4242 4242 4242 4242</li>
              <li>Échec : 4000 0000 0000 0002</li>
              <li>Date : n'importe quelle date future</li>
              <li>CVC : n'importe quel nombre à 3 chiffres</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-primary to-secondary"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Traitement...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Payer {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: currency
                }).format(amount)}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};