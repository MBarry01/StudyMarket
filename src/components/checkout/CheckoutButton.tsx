import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '../../lib/stripe';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CheckoutButtonProps {
  priceId: string;
  mode?: 'payment' | 'subscription';
  children?: React.ReactNode;
  className?: string;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  priceId,
  mode = 'payment',
  children,
  className = ''
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!currentUser) {
      toast.error('Veuillez vous connecter pour continuer');
      navigate('/auth');
      return;
    }

    try {
      setLoading(true);
      await createCheckoutSession(priceId, mode);
      // The user will be redirected to Stripe Checkout
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className={`bg-gradient-to-r from-primary to-secondary ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Chargement...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {children || 'Acheter maintenant'}
        </>
      )}
    </Button>
  );
};