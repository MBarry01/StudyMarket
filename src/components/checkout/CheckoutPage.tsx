import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  ShoppingCart, 
  Package, 
  Truck, 
  CheckCircle, 
  ChevronRight,
  User,
  MapPin,
  Phone,
  Mail,
  Shield,
  AlertTriangle,
  Info,
  ArrowLeft,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../../contexts/AuthContext';
import { useCartStore } from '../../stores/useCartStore';
import { useOrderStore } from '../../stores/useOrderStore';
import { PaymentMethodSelector } from '../payment/PaymentMethodSelector';
import { OrderSummary } from './OrderSummary';
import toast from 'react-hot-toast';

export const CheckoutPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, cartTotal, clearCart } = useCartStore();
  const { createOrder } = useOrderStore();
  
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>({});
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: userProfile?.displayName || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    university: userProfile?.university || '',
    saveInfo: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    // Redirect if cart is empty
    if (cart.length === 0 && !location.state?.directCheckout) {
      navigate('/cart');
      toast.error('Votre panier est vide');
    }
  }, [cart, navigate, location]);

  const validateShippingInfo = () => {
    const newErrors: Record<string, string> = {};
    
    if (!shippingInfo.fullName) newErrors.fullName = 'Nom complet requis';
    if (!shippingInfo.email) newErrors.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    if (!shippingInfo.phone) newErrors.phone = 'Téléphone requis';
    if (!shippingInfo.address) newErrors.address = 'Adresse requise';
    if (!shippingInfo.city) newErrors.city = 'Ville requise';
    if (!shippingInfo.postalCode) newErrors.postalCode = 'Code postal requis';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateShippingInfo()) {
      setStep('payment');
      window.scrollTo(0, 0);
    }
  };

  const handlePaymentMethodSelect = (method: string, details: any) => {
    setPaymentMethod(method);
    setPaymentDetails(details);
    
    // If it's a card payment with Stripe, we can move to review immediately
    // since the payment has already been processed
    if (method === 'card' && details.stripePaymentId) {
      setStep('review');
      window.scrollTo(0, 0);
    }
  };

  const handlePaymentSubmit = () => {
    if (!paymentMethod) {
      toast.error('Veuillez sélectionner un mode de paiement');
      return;
    }
    
    setStep('review');
    window.scrollTo(0, 0);
  };

  const handlePlaceOrder = async () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    
    if (!acceptTerms) {
      toast.error('Veuillez accepter les conditions générales');
      return;
    }

    setLoading(true);

    try {
      // Create order in database
      const orderData = {
        userId: currentUser.uid,
        items: cart,
        total: cartTotal,
        shipping: shippingInfo,
        payment: {
          method: paymentMethod,
          details: paymentDetails,
          transactionId: paymentDetails.stripePaymentId
        },
        status: paymentMethod === 'card' ? 'processing' : 'pending'
      };

      const orderId = await createOrder(orderData);
      
      // Clear cart
      clearCart();
      
      // Redirect to confirmation page
      navigate(`/order-confirmation/${orderId}`);
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card>
          <CardContent className="pt-6">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connectez-vous pour finaliser votre achat</h2>
            <p className="text-muted-foreground mb-4">
              Vous devez être connecté pour accéder au processus de paiement
            </p>
            <Button onClick={() => navigate('/auth')}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Checkout Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="-ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <h1 className="text-3xl font-bold mt-4">Finaliser votre commande</h1>
        
        {/* Progress Steps */}
        <div className="flex items-center mt-6">
          <div className={`flex items-center ${step === 'shipping' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'shipping' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
            }`}>
              1
            </div>
            <span className="ml-2 font-medium">Livraison</span>
          </div>
          
          <ChevronRight className="mx-2 text-muted-foreground" />
          
          <div className={`flex items-center ${step === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'payment' ? 'border-primary bg-primary text-white' : 
              step === 'review' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
            }`}>
              2
            </div>
            <span className="ml-2 font-medium">Paiement</span>
          </div>
          
          <ChevronRight className="mx-2 text-muted-foreground" />
          
          <div className={`flex items-center ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'review' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
            }`}>
              3
            </div>
            <span className="ml-2 font-medium">Vérification</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Information */}
          {step === 'shipping' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Informations de livraison
                </CardTitle>
                <CardDescription>
                  Entrez vos coordonnées pour la livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName" className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Nom complet *
                      </Label>
                      <Input
                        id="fullName"
                        value={shippingInfo.fullName}
                        onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                        className={errors.fullName ? 'border-red-500' : ''}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Téléphone *
                      </Label>
                      <Input
                        id="phone"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="university" className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Université
                      </Label>
                      <Input
                        id="university"
                        value={shippingInfo.university}
                        onChange={(e) => setShippingInfo({...shippingInfo, university: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address" className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Adresse *
                    </Label>
                    <Input
                      id="address"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city" className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Ville *
                      </Label>
                      <Input
                        id="city"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      {errors.city && (
                        <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="postalCode" className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Code postal *
                      </Label>
                      <Input
                        id="postalCode"
                        value={shippingInfo.postalCode}
                        onChange={(e) => setShippingInfo({...shippingInfo, postalCode: e.target.value})}
                        className={errors.postalCode ? 'border-red-500' : ''}
                      />
                      {errors.postalCode && (
                        <p className="text-sm text-red-500 mt-1">{errors.postalCode}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="country" className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Pays *
                      </Label>
                      <Input
                        id="country"
                        value={shippingInfo.country}
                        onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox 
                      id="saveInfo" 
                      checked={shippingInfo.saveInfo}
                      onCheckedChange={(checked) => 
                        setShippingInfo({...shippingInfo, saveInfo: checked as boolean})
                      }
                    />
                    <Label htmlFor="saveInfo">
                      Sauvegarder ces informations pour mes prochaines commandes
                    </Label>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" className="w-full md:w-auto">
                      Continuer vers le paiement
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          {step === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Méthode de paiement
                </CardTitle>
                <CardDescription>
                  Choisissez votre mode de paiement préféré
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <PaymentMethodSelector
                    amount={cartTotal}
                    currency="EUR"
                    onMethodSelect={handlePaymentMethodSelect}
                    selectedMethod={paymentMethod as any}
                  />
                  
                  <div className="flex justify-between pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep('shipping')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour
                    </Button>
                    
                    <Button 
                      onClick={handlePaymentSubmit}
                      disabled={!paymentMethod || (paymentMethod === 'card' && !paymentDetails.stripePaymentId)}
                    >
                      Vérifier la commande
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Review */}
          {step === 'review' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Vérification de la commande
                </CardTitle>
                <CardDescription>
                  Vérifiez les détails de votre commande avant de confirmer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Shipping Information Summary */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Informations de livraison</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setStep('shipping')}
                      >
                        Modifier
                      </Button>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium">{shippingInfo.fullName}</p>
                      <p>{shippingInfo.address}</p>
                      <p>{shippingInfo.postalCode} {shippingInfo.city}, {shippingInfo.country}</p>
                      <p>{shippingInfo.email}</p>
                      <p>{shippingInfo.phone}</p>
                    </div>
                  </div>
                  
                  {/* Payment Method Summary */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Méthode de paiement</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setStep('payment')}
                      >
                        Modifier
                      </Button>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium">
                        {paymentMethod === 'card' && 'Carte bancaire'}
                        {paymentMethod === 'paypal' && 'PayPal'}
                        {paymentMethod === 'transfer' && 'Virement bancaire'}
                        {paymentMethod === 'cash' && 'Paiement à la livraison'}
                        {paymentMethod === 'lydia' && 'Lydia'}
                      </p>
                      {paymentMethod === 'card' && paymentDetails.stripePaymentId && (
                        <p className="text-green-600 text-sm">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Paiement autorisé
                        </p>
                      )}
                      {paymentMethod === 'paypal' && paymentDetails.paypalEmail && (
                        <p>{paymentDetails.paypalEmail}</p>
                      )}
                      {paymentMethod === 'lydia' && paymentDetails.lydiaPhone && (
                        <p>{paymentDetails.lydiaPhone}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-2">Articles ({cart.length})</h3>
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
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
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR'
                            }).format(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Terms and Conditions */}
                  <div className="pt-4 border-t">
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="terms" 
                        checked={acceptTerms}
                        onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      />
                      <div>
                        <Label htmlFor="terms" className="font-medium">
                          J'accepte les conditions générales de vente
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          En passant commande, vous acceptez nos conditions générales de vente et notre politique de confidentialité.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep('payment')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Retour
                    </Button>
                    
                    <Button 
                      onClick={handlePlaceOrder}
                      disabled={loading || !acceptTerms}
                      className="bg-gradient-to-r from-primary to-secondary"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Confirmer la commande
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <OrderSummary 
            cart={cart} 
            total={cartTotal} 
            showCheckoutButton={false}
          />
          
          {/* Security Notice */}
          <Alert className="mt-4 border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Paiement sécurisé :</strong> Toutes vos informations sont cryptées et sécurisées.
            </AlertDescription>
          </Alert>
          
          {/* Help */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Besoin d'aide ?</h3>
                    <p className="text-sm text-muted-foreground">
                      Notre équipe est disponible 7j/7 pour vous aider avec votre commande.
                    </p>
                    <Button variant="link" className="p-0 h-auto text-sm">
                      Contacter le support
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};