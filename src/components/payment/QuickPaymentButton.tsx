import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { CreditCard, Loader2 } from 'lucide-react';
import { PaymentWrapper } from './PaymentWrapper';
import { PaymentMethodSelectorModal, PaymentMethodType } from './PaymentMethodSelectorModal';
import { Listing } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface QuickPaymentButtonProps {
  listing: Listing;
  className?: string;
}

export const QuickPaymentButton: React.FC<QuickPaymentButtonProps> = ({
  listing,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('stripe');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const canPurchase = (): boolean => {
    if (!currentUser) {
      toast('Connectez-vous pour continuer');
      navigate('/auth');
      return false;
    }
    // Protéger achats non valides
    if ((listing as any).sellerId && currentUser.uid === (listing as any).sellerId) {
      toast.error('Vous ne pouvez pas acheter votre propre annonce');
      return false;
    }
    if ((listing as any).status && (listing as any).status !== 'active') {
      if ((listing as any).status === 'sold') {
        toast.error('Cet article a déjà été vendu');
      } else {
        toast.error('Annonce indisponible');
      }
      return false;
    }
    if (!listing.price || listing.price <= 0) {
      toast.error('Montant invalide');
      return false;
    }
    return true;
  };

  // 🆕 Créer la commande AVANT d'afficher le modal de paiement
  const handleCreateOrder = async () => {
    if (!canPurchase()) return;
    
    setIsProcessing(true);
    
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          buyerId: currentUser?.uid,
          sellerId: (listing as any).sellerId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la commande');
      }
      
      console.log('✅ Commande créée:', data.orderId);
      setOrderId(data.orderId);
      setShowMethodSelector(true);
      
    } catch (error: any) {
      console.error('❌ Erreur création commande:', error);
      toast.error(error.message || 'Erreur lors de la création de la commande');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMethodSelect = (method: PaymentMethodType) => {
    setSelectedMethod(method);
    setShowMethodSelector(false);
    setIsOpen(true);
  };

  const handleMethodCancel = () => {
    setShowMethodSelector(false);
    setOrderId(null);
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('✅ Paiement réussi:', paymentIntentId);
    setIsOpen(false);
    
    // Redirection vers la page de succès avec l'orderId
    if (orderId) {
      navigate(`/payment/success?orderId=${orderId}&payment_intent=${paymentIntentId}`);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('❌ Erreur de paiement:', error);
    toast.error(error || 'Erreur lors du paiement');
  };

  // Ne pas afficher le bouton pour les dons ou échanges
  if (listing.transactionType === 'donation' || listing.transactionType === 'exchange') {
    return null;
  }

  return (
    <>
      {/* Bouton principal */}
      <Button 
        className={className}
        disabled={isProcessing}
        onClick={handleCreateOrder}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Création...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Acheter maintenant
          </>
        )}
      </Button>

      {/* Modal de sélection de méthode de paiement */}
      <Dialog open={showMethodSelector} onOpenChange={setShowMethodSelector}>
        <DialogContent className="max-w-md">
          <PaymentMethodSelectorModal
            onSelect={handleMethodSelect}
            onCancel={handleMethodCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de paiement */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Paiement - {listing.title}
            </DialogTitle>
            <DialogDescription>
              Finalisez votre achat de manière sécurisée
            </DialogDescription>
          </DialogHeader>
          
          {orderId && (
            <PaymentWrapper
              orderId={orderId}
              method={selectedMethod}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
