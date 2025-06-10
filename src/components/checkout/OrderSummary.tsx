import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronRight, Tag, Truck, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '../../types';

interface OrderSummaryProps {
  cart: CartItem[];
  total: number;
  showCheckoutButton?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  cart, 
  total, 
  showCheckoutButton = true 
}) => {
  const navigate = useNavigate();
  
  const subtotal = total;
  const shipping = 0; // Free shipping
  const discount = 0; // No discount by default
  const finalTotal = subtotal + shipping - discount;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Récapitulatif de commande
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Items count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Articles ({cart.reduce((acc, item) => acc + item.quantity, 0)})
            </span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          {/* Shipping */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Truck className="w-4 h-4" />
              Livraison
            </span>
            {shipping === 0 ? (
              <span className="text-green-600 font-medium">Gratuite</span>
            ) : (
              <span>{formatPrice(shipping)}</span>
            )}
          </div>
          
          {/* Discount */}
          {discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Tag className="w-4 h-4" />
                Réduction
              </span>
              <span className="text-green-600">-{formatPrice(discount)}</span>
            </div>
          )}
          
          <Separator />
          
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg">{formatPrice(finalTotal)}</span>
          </div>
          
          {/* Taxes */}
          <p className="text-xs text-muted-foreground">
            * TVA incluse
          </p>
          
          {/* Checkout Button */}
          {showCheckoutButton && (
            <Button 
              onClick={() => navigate('/checkout')}
              className="w-full mt-4 bg-gradient-to-r from-primary to-secondary"
              disabled={cart.length === 0}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Procéder au paiement
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};