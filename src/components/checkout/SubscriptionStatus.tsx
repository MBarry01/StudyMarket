import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { getUserSubscription } from '../../lib/stripe';
import { useAuth } from '../../contexts/AuthContext';
import { getProductByPriceId } from '../../stripe-config';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const SubscriptionStatus: React.FC = () => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const data = await getUserSubscription();
        setSubscription(data);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError('Impossible de charger les informations d\'abonnement');
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [currentUser]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Actif
          </Badge>
        );
      case 'trialing':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Période d'essai
          </Badge>
        );
      case 'past_due':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Paiement en retard
          </Badge>
        );
      case 'canceled':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Annulé
          </Badge>
        );
      case 'not_started':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            Non démarré
          </Badge>
        );
      default:
        return (
          <Badge>
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return format(new Date(timestamp * 1000), 'dd MMMM yyyy', { locale: fr });
  };

  const getProductName = () => {
    if (!subscription?.price_id) return 'Abonnement';
    
    const product = getProductByPriceId(subscription.price_id);
    return product ? product.name : 'Abonnement';
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!subscription || subscription.subscription_status === 'not_started' || !subscription.subscription_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Aucun abonnement actif
          </CardTitle>
          <CardDescription>
            Vous n'avez pas d'abonnement actif pour le moment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => window.location.href = '/products'}>
            Voir nos offres d'abonnement
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {getProductName()}
          </CardTitle>
          {getStatusBadge(subscription.subscription_status)}
        </div>
        <CardDescription>
          Détails de votre abonnement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subscription details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ID d'abonnement:</span>
            <span className="font-medium">{subscription.subscription_id}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Période actuelle:</span>
            <span className="font-medium">
              {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
            </span>
          </div>
          
          {subscription.payment_method_brand && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Méthode de paiement:</span>
              <span className="font-medium">
                {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
              </span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Renouvellement:</span>
            <span className="font-medium">
              {subscription.cancel_at_period_end ? 'Non (se termine à la fin de la période)' : 'Automatique'}
            </span>
          </div>
        </div>
        
        {/* Renewal notice */}
        {!subscription.cancel_at_period_end && subscription.subscription_status === 'active' && (
          <Alert className="bg-blue-50 border-blue-200">
            <Calendar className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Votre abonnement se renouvellera automatiquement le {formatDate(subscription.current_period_end)}.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Cancellation notice */}
        {subscription.cancel_at_period_end && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Votre abonnement prendra fin le {formatDate(subscription.current_period_end)} et ne sera pas renouvelé.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Gérer l'abonnement
          </Button>
          
          {subscription.subscription_status === 'active' && !subscription.cancel_at_period_end && (
            <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">
              <XCircle className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};