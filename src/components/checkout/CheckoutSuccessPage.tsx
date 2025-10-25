import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Package, 
  ShoppingBag, 
  ArrowRight, 
  CreditCard,
  Calendar,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getUserSubscription, getUserOrders } from '../../lib/stripe';
import { getProductByPriceId } from '../../stripe-config';
import { useAuth } from '../../contexts/AuthContext';
import { useCartStore } from '../../stores/useCartStore';

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { clearCart } = useCartStore();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const isSubscription = searchParams.get('type') === 'subscription';

  useEffect(() => {
    // Clear the cart on successful checkout
    clearCart();
    
    async function fetchCheckoutResult() {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        if (isSubscription) {
          // Fetch subscription details
          const subData = await getUserSubscription();
          setSubscription(subData);
        } else {
          // Fetch order details
          const orders = await getUserOrders();
          // Find the most recent order
          const latestOrder = orders[0];
          setOrder(latestOrder);
        }
      } catch (err) {
        console.error('Error fetching checkout result:', err);
        setError('Impossible de charger les détails de votre achat');
      } finally {
        setLoading(false);
      }
    }

    // Add a small delay to allow the database to update
    const timer = setTimeout(() => {
      fetchCheckoutResult();
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentUser, isSubscription, sessionId, clearCart]);

  const getProductName = () => {
    if (isSubscription && subscription?.price_id) {
      const product = getProductByPriceId(subscription.price_id);
      return product ? product.name : 'Abonnement';
    } else if (order) {
      return 'Commande';
    }
    return 'Achat';
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Vous devez être connecté pour voir les détails de votre achat.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => navigate('/auth')}>
              Se connecter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Traitement de votre paiement...</h2>
          <p className="text-muted-foreground">
            Veuillez patienter pendant que nous confirmons votre transaction.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Merci pour votre achat !</h1>
          <p className="text-muted-foreground">
            Votre {isSubscription ? 'abonnement' : 'commande'} a été confirmé{isSubscription ? '' : 'e'}.
          </p>
        </div>

        {/* Order/Subscription Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isSubscription ? (
                <CreditCard className="w-5 h-5" />
              ) : (
                <Package className="w-5 h-5" />
              )}
              {getProductName()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isSubscription && subscription ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut:</span>
                    <span className="font-medium">
                      {subscription.subscription_status === 'active' ? 'Actif' : 
                       subscription.subscription_status === 'trialing' ? 'Période d\'essai' : 
                       subscription.subscription_status}
                    </span>
                  </div>
                  
                  {subscription.current_period_end && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prochain renouvellement:</span>
                      <span className="font-medium">
                        {new Date(subscription.current_period_end * 1000).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  
                  {subscription.payment_method_brand && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Méthode de paiement:</span>
                      <span className="font-medium">
                        {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
                      </span>
                    </div>
                  )}
                </>
              ) : order ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Numéro de commande:</span>
                    <span className="font-medium">{order.order_id}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">
                      {new Date(order.order_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: order.currency
                      }).format(order.amount_total / 100)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut:</span>
                    <span className="font-medium">
                      {order.order_status === 'completed' ? 'Complété' : 
                       order.order_status === 'pending' ? 'En attente' : 
                       order.order_status}
                    </span>
                  </div>
                </>
              ) : (
                <p>Merci pour votre achat. Vous recevrez un email de confirmation.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Calendar className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {isSubscription 
                ? "Vous pouvez gérer votre abonnement à tout moment depuis votre compte."
                : "Vous recevrez un email de confirmation avec les détails de votre commande."}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/orders">
                <Package className="mr-2 h-4 w-4" />
                Mes commandes
              </Link>
            </Button>
            
            <Button className="flex-1 bg-gradient-to-r from-primary to-secondary" asChild>
              <Link to="/products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Continuer mes achats
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};