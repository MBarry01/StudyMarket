import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { PaymentWrapper } from '../components/payment/PaymentWrapper';
import { useListingStore } from '../stores/useListingStore';
import { useAuth } from '../contexts/AuthContext';

export const CheckoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentListing, loading, fetchListingById } = useListingStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (id) {
      fetchListingById(id);
    }
  }, [id, fetchListingById]);

  const handlePaymentSuccess = async (paymentIntent: any) => {
    setIsProcessing(true);
    
    try {
      // Ici vous pouvez ajouter la logique pour :
      // 1. Marquer l'annonce comme vendue
      // 2. Créer un enregistrement de transaction
      // 3. Envoyer des emails de confirmation
      // 4. Rediriger vers une page de succès
      
      console.log('Paiement réussi:', paymentIntent);
      
      // Redirection vers la page de succès
      navigate(`/payment/success?payment_intent=${paymentIntent.id}`);
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Erreur de paiement:', error);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentListing) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Annonce introuvable</h1>
        <Button onClick={() => navigate('/listings')}>
          Retour aux annonces
        </Button>
      </div>
    );
  }

  const formatPrice = (price: number, currency?: string) => {
    const currencyCode = currency || 'EUR';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  };

  // Les frais réels seront calculés par le serveur via PaymentWrapper
  // Ici on affiche juste des estimations basées sur le prix de l'annonce
  const base = currentListing?.price || 0;
  
  // Note: ces valeurs sont des estimations
  // Les vrais frais seront calculés par le serveur et affichés dans PaymentWrapper
  const serviceFeePercent = 0.05; // 5%
  const processingFeeFixed = 0.25; // 0,25 €
  const serviceFee = Math.round((base * serviceFeePercent) * 100) / 100;
  const processingFee = processingFeeFixed;
  const estimatedTotal = Math.round((base + serviceFee + processingFee) * 100) / 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="-ml-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-xl font-semibold">Finaliser l'achat</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations de l'annonce */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Résumé de votre commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image et détails */}
                <div className="flex gap-4">
                  {currentListing.images && currentListing.images.length > 0 && (
                    <img
                      src={currentListing.images[0]}
                      alt={currentListing.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{currentListing.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {currentListing.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {currentListing.condition}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Prix + frais estimés */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{formatPrice(base, currentListing.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Frais de service (5%)</span>
                    <span>{formatPrice(serviceFee, currentListing.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Frais de traitement</span>
                    <span>{formatPrice(processingFee, currentListing.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-lg font-semibold">Total estimé</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(estimatedTotal, currentListing.currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations vendeur */}
            <Card>
              <CardHeader>
                <CardTitle>Vendeur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={currentListing.sellerAvatar} />
                    <AvatarFallback>
                      {currentListing.sellerName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{currentListing.sellerName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {currentListing.sellerUniversity}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Garanties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Garanties StudyMarket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Transaction sécurisée</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Support client 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span>Paiement protégé</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de paiement */}
          <div>
            <div className="mb-4 space-y-3">
              <div className="text-sm text-muted-foreground">
                Des frais de service peuvent s'appliquer. En payant, vous acceptez nos Conditions et la Politique de remboursement.
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                J'accepte les conditions de vente
              </label>
            </div>
            <PaymentWrapper
              listing={currentListing}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              enabled={acceptedTerms}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
