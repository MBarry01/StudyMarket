import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  CreditCard, 
  Truck, 
  MapPin,
  Download,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../../contexts/AuthContext';
import { useOrderStore, Order } from '../../stores/useOrderStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { orders, fetchUserOrders, loading } = useOrderStore();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchUserOrders(currentUser.uid);
    }
  }, [currentUser, fetchUserOrders]);

  useEffect(() => {
    if (orders.length > 0 && id) {
      const foundOrder = orders.find(o => o.id === id);
      setOrder(foundOrder || null);
    }
  }, [orders, id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Package className="w-3 h-3 mr-1" />
            En traitement
          </Badge>
        );
      case 'shipped':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Truck className="w-3 h-3 mr-1" />
            Expédiée
          </Badge>
        );
      case 'delivered':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Livrée
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Annulée
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(price);
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card>
          <CardContent className="pt-6">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connectez-vous pour voir vos commandes</h2>
            <Button onClick={() => navigate('/auth')}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="animate-pulse">
          <CardContent className="p-8">
            <div className="h-8 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card>
          <CardContent className="pt-6">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Commande introuvable</h2>
            <p className="text-muted-foreground mb-4">
              Cette commande n'existe pas ou vous n'y avez pas accès.
            </p>
            <Button onClick={() => navigate('/orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux commandes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotalCents = order.payment?.details?.subtotalCents || 0;
  const serviceFeeCents = order.payment?.details?.serviceFeeCents || 0;
  const processingFeeCents = order.payment?.details?.processingFeeCents || 0;
  const totalCents = order.payment?.details?.totalCents || Math.round(order.total * 100);
  const currency = order.payment?.details?.currency || 'EUR';

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Commande #{order.id.slice(0, 8)}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(order.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </CardDescription>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Articles commandés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index}>
                  <div className="flex gap-4">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <Link 
                        to={`/listing/${item.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {item.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Quantité: {item.quantity}</span>
                        <span>Prix unitaire: {formatPrice(item.price, currency)}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(item.price * item.quantity, currency)}
                      </p>
                    </div>
                  </div>
                  {index < order.items.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping Address (if available) */}
          {order.shipping && (order.shipping.address || order.shipping.university) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.shipping.fullName && (
                  <p className="font-medium">{order.shipping.fullName}</p>
                )}
                {order.shipping.address && (
                  <p className="text-muted-foreground">{order.shipping.address}</p>
                )}
                {order.shipping.city && order.shipping.postalCode && (
                  <p className="text-muted-foreground">
                    {order.shipping.postalCode} {order.shipping.city}
                  </p>
                )}
                {order.shipping.country && (
                  <p className="text-muted-foreground">{order.shipping.country}</p>
                )}
                {order.shipping.university && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Université: {order.shipping.university}</p>
                  </div>
                )}
                {order.shipping.phone && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {order.shipping.phone}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatPrice(subtotalCents / 100, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frais de service (5%)</span>
                <span>{formatPrice(serviceFeeCents / 100, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frais de traitement</span>
                <span>{formatPrice(processingFeeCents / 100, currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(totalCents / 100, currency)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Informations de paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Méthode</span>
                <span className="capitalize">{order.payment?.method || 'Carte bancaire'}</span>
              </div>
              {order.payment?.transactionId && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-mono text-xs">{order.payment.transactionId.slice(0, 16)}...</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(`https://dashboard.stripe.com/test/payments/${order.payment?.transactionId}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir sur Stripe
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tracking */}
          {order.trackingNumber && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Suivi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Numéro de suivi</p>
                <p className="font-mono text-sm">{order.trackingNumber}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Télécharger la facture
            </Button>
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button variant="destructive" className="w-full" disabled>
                Annuler la commande
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};










