import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  RefreshCw, 
  ShoppingBag, 
  ArrowLeft,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '../../stores/useCartStore';
import { OrderSummary } from './OrderSummary';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const CartPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCartStore();
  const navigate = useNavigate();
  
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > 10) {
      toast.error('Maximum 10 articles par produit');
      return;
    }
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
    toast.success('Article retiré du panier');
  };

  const handleApplyPromoCode = () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    
    // Simulate API call
    setTimeout(() => {
      if (promoCode.toLowerCase() === 'etudiant10') {
        toast.success('Code promo appliqué : 10% de réduction');
      } else {
        toast.error('Code promo invalide ou expiré');
      }
      setIsApplyingPromo(false);
    }, 1000);
  };

  const handleCheckout = () => {
    if (!currentUser) {
      navigate('/auth', { state: { from: '/cart' } });
      return;
    }
    
    navigate('/checkout');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="-ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <div className="flex items-center justify-between mt-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Mon Panier
          </h1>
          
          {cart.length > 0 && (
            <Button 
              variant="outline" 
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Vider le panier
            </Button>
          )}
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Votre panier est vide</h2>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas encore ajouté d'articles à votre panier.
          </p>
          <Button asChild>
            <Link to="/products">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Parcourir les produits
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Articles ({cart.reduce((acc, item) => acc + item.quantity, 0)})</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/products')}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Continuer mes achats
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      {/* Product Image */}
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-20 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.seller}
                        </p>
                        <div className="flex items-center mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                handleQuantityChange(item.id, val);
                              }
                            }}
                            className="h-8 w-12 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={item.quantity >= 10}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Price and Remove */}
                      <div className="text-right">
                        <p className="font-semibold">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                          }).format(item.price * item.quantity)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive mt-2"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Promo Code */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Code promo"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    onClick={handleApplyPromoCode}
                    disabled={!promoCode.trim() || isApplyingPromo}
                  >
                    {isApplyingPromo ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Application...
                      </>
                    ) : (
                      'Appliquer'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Essayez le code "ETUDIANT10" pour 10% de réduction
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <OrderSummary 
              cart={cart} 
              total={cartTotal} 
              showCheckoutButton={true}
            />
            
            {!currentUser && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Vous devez être connecté pour finaliser votre commande.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </div>
  );
};