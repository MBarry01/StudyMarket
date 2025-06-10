import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Calendar, 
  CreditCard, 
  Download, 
  Mail, 
  ArrowRight, 
  ShoppingBag,
  MapPin,
  Clock,
  AlertTriangle,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOrderStore } from '../../stores/useOrderStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrderById } = useOrderStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;
      
      try {
        setLoading(true);
        const orderData = await getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, getOrderById]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      card: 'Carte bancaire',
      paypal: 'PayPal',
      transfer: 'Virement bancaire',
      cash: 'Paiement à la livraison'
    };
    return methods[method] || method;
  };

  const getEstimatedDelivery = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 3); // Estimate 3 days for delivery
    
    return format(deliveryDate, 'EEEE d MMMM', { locale: fr });
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId || '');
    toast.success('Numéro de commande copié !');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card>
          <CardContent className="pt-6">
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Commande introuvable</h2>
            <p className="text-muted-foreground mb-4">
              Nous n'avons pas pu trouver les détails de cette commande.
            </p>
            <Button asChild>
              <Link to="/orders">Voir mes commandes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Confirmation Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Commande confirmée !</h1>
          <p className="text-muted-foreground">
            Merci pour votre commande. Vous recevrez un email de confirmation à {order.shipping.email}.
          </p>
        </div>

        {/* Order Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Détails de la commande
              </span>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                {order.status === 'pending' ? 'En attente' : 
                 order.status === 'processing' ? 'En traitement' : 
                 order.status === 'shipped' ? 'Expédiée' : 
                 order.status === 'delivered' ? 'Livrée' : 'Confirmée'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Order ID */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Numéro de commande</p>
                  <p className="font-medium flex items-center gap-2">
                    {orderId}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={copyOrderId}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(order.createdAt), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Articles</h3>
                <div className="space-y-3">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantité: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="text-green-600">Gratuite</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping & Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="w-4 h-4" />
                Livraison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{order.shipping.fullName}</p>
                <p>{order.shipping.address}</p>
                <p>{order.shipping.postalCode} {order.shipping.city}, {order.shipping.country}</p>
                <p className="text-sm text-muted-foreground">{order.shipping.phone}</p>
                
                <div className="pt-2 mt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Livraison estimée: {getEstimatedDelivery()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-4 h-4" />
                Paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">
                  {getPaymentMethodName(order.payment.method)}
                </p>
                
                {order.payment.method === 'card' && order.payment.details?.cardNumber && (
                  <p>Carte se terminant par {order.payment.details.cardNumber.slice(-4)}</p>
                )}
                
                {order.payment.method === 'paypal' && order.payment.details?.paypalEmail && (
                  <p>{order.payment.details.paypalEmail}</p>
                )}
                
                {order.payment.method === 'transfer' && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Veuillez effectuer le virement dans les 48h pour valider votre commande.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="pt-2 mt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Statut: {order.status === 'pending' ? 'En attente' : 'Confirmé'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/orders">
              <Package className="mr-2 h-4 w-4" />
              Mes commandes
            </Link>
          </Button>
          
          <Button variant="outline" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Télécharger la facture
          </Button>
          
          <Button className="flex-1 bg-gradient-to-r from-primary to-secondary" asChild>
            <Link to="/listings">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continuer mes achats
            </Link>
          </Button>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-2">
            Besoin d'aide avec votre commande ?
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="link" className="text-primary">
              <Mail className="mr-2 h-4 w-4" />
              Contacter le support
            </Button>
            <Button variant="link" className="text-primary">
              <ArrowRight className="mr-2 h-4 w-4" />
              FAQ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};