import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Bike } from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  mode: 'payment' | 'subscription';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  price,
  currency,
  image,
  mode
}) => {
  const { currentUser } = useAuth();
  const { addToCart } = useCartStore();
  const navigate = useNavigate();

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!currentUser) {
      toast.error('Veuillez vous connecter pour ajouter au panier');
      navigate('/auth');
      return;
    }

    addToCart({
      id,
      name,
      price,
      image,
      seller: 'StudyMarket',
      sellerId: 'system',
      listingId: id
    });
  };

  const handleBuyNow = () => {
    if (!currentUser) {
      toast.error('Veuillez vous connecter pour acheter');
      navigate('/auth');
      return;
    }

    // Add to cart and go to checkout
    addToCart({
      id,
      name,
      price,
      image,
      seller: 'StudyMarket',
      sellerId: 'system',
      listingId: id
    });
    
    navigate('/checkout');
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-video relative overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Bike className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        <Badge className="absolute top-2 right-2 bg-primary">
          {mode === 'subscription' ? 'Abonnement' : 'Achat unique'}
        </Badge>
      </div>
      
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="text-2xl font-bold text-primary">
          {formatPrice(price, currency)}
          {mode === 'subscription' && <span className="text-sm text-muted-foreground ml-1">/mois</span>}
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
        <Button 
          className="flex-1 bg-gradient-to-r from-primary to-secondary"
          onClick={handleBuyNow}
        >
          Acheter
        </Button>
      </CardFooter>
    </Card>
  );
};