import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, Package, Euro, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const paymentIntentId = searchParams.get('payment_intent');

  // 🆕 Polling du statut de la commande
  useEffect(() => {
    const orderIdFromUrl = searchParams.get('orderId');
    
    // Si on a un orderId dans l'URL, on poll le statut
    if (orderIdFromUrl) {
      let attempts = 0;
      const maxAttempts = 15; // 15 × 2s = 30 secondes max
      
      const pollOrderStatus = async () => {
        try {
          const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
          const response = await fetch(`${apiBase}/api/orders/${orderIdFromUrl}/status`);
          
          if (!response.ok) {
            throw new Error('Erreur lors de la récupération du statut');
          }
          
          const data = await response.json();
          console.log('📊 Statut commande:', data);
          
          // Si la commande est payée, récupérer les détails depuis Firestore
          if (data.status === 'paid') {
            const orderDoc = await getDoc(doc(db, 'orders', orderIdFromUrl));
            if (orderDoc.exists()) {
              const orderData = orderDoc.data();
              setOrderDetails({
                id: orderDoc.id,
                ...orderData,
                createdAt: orderData.createdAt?.toDate?.() || new Date()
              });
            }
            setLoading(false);
            return true; // Stop polling
          }
          
          // Si timeout, arrêter le polling
          if (attempts++ >= maxAttempts) {
            console.log('⏱️ Timeout du polling');
            setLoading(false);
            return true;
          }
          
          return false; // Continue polling
        } catch (error) {
          console.error('❌ Erreur poll:', error);
          return false;
        }
      };
      
      // Poll immédiat
      pollOrderStatus().then(shouldStop => {
        if (shouldStop) return;
        
        // Puis poll toutes les 2 secondes
        const interval = setInterval(async () => {
          const shouldStop = await pollOrderStatus();
          if (shouldStop) clearInterval(interval);
        }, 2000);
        
        return () => clearInterval(interval);
      });
    }
    // Sinon, mode legacy : récupérer par PaymentIntent ID
    else if (paymentIntentId && currentUser) {
      const fetchOrderDetails = async () => {
        try {
          const ordersQuery = query(
            collection(db, 'orders'),
            where('payment.details.paymentIntentId', '==', paymentIntentId),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          
          const querySnapshot = await getDocs(ordersQuery);
          
          if (!querySnapshot.empty) {
            const orderDoc = querySnapshot.docs[0];
            const orderData = orderDoc.data();
            setOrderDetails({
              id: orderDoc.id,
              ...orderData,
              createdAt: orderData.createdAt?.toDate?.() || new Date()
            });
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de la commande:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [paymentIntentId, currentUser, searchParams]);

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des détails de votre commande...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            
            <h1 className="text-2xl font-bold text-green-700 mb-4">
              Paiement réussi !
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Votre paiement a été traité avec succès. Vous recevrez un email de confirmation dans les prochaines minutes.
            </p>

            {/* Détails de la commande */}
            {orderDetails && (
              <div className="bg-muted/50 p-6 rounded-lg mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Numéro de commande</p>
                    <p className="font-semibold">#{orderDetails.id.slice(0, 8)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(orderDetails.createdAt, 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Montant total</p>
                    <p className="font-bold text-lg text-green-600 flex items-center gap-1">
                      <Euro className="w-5 h-5" />
                      {formatPrice(orderDetails.total, orderDetails.payment?.details?.currency || 'EUR')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Articles</p>
                    <p className="font-semibold">{orderDetails.items?.length || 0} article{orderDetails.items?.length > 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Liste des articles */}
                {orderDetails.items && orderDetails.items.length > 0 && (
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-sm text-muted-foreground mb-3 text-left font-medium">Articles commandés :</p>
                    <div className="space-y-2">
                      {orderDetails.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 text-left bg-background p-3 rounded">
                          {item.image && (
                            <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Quantité: {item.quantity} × {formatPrice(item.price, orderDetails.payment?.details?.currency || 'EUR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Référence de transaction */}
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-xs text-muted-foreground mb-1">Référence de transaction</p>
                  <p className="font-mono text-xs break-all">{paymentIntentId}</p>
                </div>
              </div>
            )}

            {!orderDetails && paymentIntentId && (
              <div className="bg-muted p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  Référence de transaction : 
                </p>
                <p className="font-mono text-sm break-all">
                  {paymentIntentId}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/orders">
                  <Package className="w-4 h-4 mr-2" />
                  Voir mes commandes
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link to="/listings">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continuer mes achats
                </Link>
              </Button>
              
              <Button variant="ghost" asChild className="w-full">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Des questions ? Contactez notre support client
          </p>
        </div>
      </div>
    </div>
  );
};
