import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Package, 
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductCard } from './ProductCard';
import { stripeProducts } from '../../stripe-config';
import { useCartStore } from '../../stores/useCartStore';
import { stripeStatus } from '../../lib/stripe';

export const ProductsPage: React.FC = () => {
  const { getCartItemCount } = useCartStore();
  const navigate = useNavigate();
  const cartItemCount = getCartItemCount();

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
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-8 h-8" />
              Boutique
            </h1>
            <p className="text-muted-foreground mt-1">
              Découvrez nos produits et services
            </p>
          </div>
          
          {cartItemCount > 0 && (
            <Button 
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Panier ({cartItemCount})
            </Button>
          )}
        </div>
      </div>

      {/* Stripe Configuration Warning */}
      {!stripeStatus.isConfigured && (
        <Alert className="border-yellow-200 bg-yellow-50 mb-6">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Configuration Stripe manquante</strong> - Les paiements par carte ne fonctionneront pas tant que vous n'aurez pas configuré votre clé publique Stripe dans le fichier .env
          </AlertDescription>
        </Alert>
      )}

      {/* Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stripeProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            description={product.description}
            price={product.price}
            currency={product.currency}
            image={product.image}
            mode={product.mode}
          />
        ))}
      </div>

      {/* Empty state if no products */}
      {stripeProducts.length === 0 && (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun produit disponible</h2>
            <p className="text-muted-foreground mb-6">
              Revenez bientôt pour découvrir nos nouveaux produits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};