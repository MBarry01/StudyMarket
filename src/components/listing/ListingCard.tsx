import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Eye, Shield, Gift, RefreshCw, Leaf } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { ShareButton } from '@/components/ui/ShareButton';
import { Listing } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const formatPrice = (price: number, currency?: string) => {
    if (listing.transactionType === 'donation') return 'Gratuit';
    if (listing.transactionType === 'exchange') return 'Échange';
    
    // Default to EUR if no currency is provided
    const currencyCode = currency || 'EUR';
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode,
      }).format(price);
    } catch (error) {
      // Fallback if currency formatting fails
      return `${price} €`;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'bg-safe-green';
      case 'like-new':
        return 'bg-safe-blue';
      case 'good':
        return 'bg-safe-yellow';
      case 'fair':
        return 'bg-safe-orange';
      case 'poor':
        return 'bg-safe-red';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'Neuf';
      case 'like-new':
        return 'Comme neuf';
      case 'good':
        return 'Bon état';
      case 'fair':
        return 'État correct';
      case 'poor':
        return 'Mauvais état';
      default:
        return condition;
    }
  };

  const getTransactionIcon = () => {
    switch (listing.transactionType) {
      case 'donation':
        return <Gift className="w-4 h-4" />;
      case 'exchange':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTransactionColor = () => {
    switch (listing.transactionType) {
      case 'donation':
        return 'bg-safe-green';
      case 'exchange':
        return 'bg-safe-purple';
      default:
        return 'bg-primary hover:bg-primary/90 text-white';
    }
  };

  // Safe date formatting function
  const formatSafeDate = (date: any) => {
    try {
      // Handle various date formats
      let validDate: Date;
      
      if (!date) {
        return 'Date inconnue';
      }
      
      if (date instanceof Date) {
        validDate = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        validDate = new Date(date);
      } else if (date && typeof date.toDate === 'function') {
        // Firestore Timestamp
        validDate = date.toDate();
      } else if (date && typeof date === 'object' && date.seconds) {
        // Firestore timestamp object
        validDate = new Date(date.seconds * 1000);
      } else {
        return 'Date inconnue';
      }
      
      // Check if the date is valid
      if (isNaN(validDate.getTime())) {
        return 'Date inconnue';
      }
      
      return formatDistanceToNow(validDate, { 
        addSuffix: true, 
        locale: fr 
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Date inconnue';
    }
  };

  // Safe access to listing properties with defaults
  const safePrice = listing.price || 0;
  const safeCurrency = listing.currency || 'EUR';
  const safeCondition = listing.condition || 'good';
  const safeTransactionType = listing.transactionType || 'sale';

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <Link to={`/listing/${listing.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          {listing.images?.[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">Aucune image</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="absolute top-2 right-0 flex flex-col gap-1">
            <FavoriteButton 
              listing={listing} 
              size="sm"
              className="bg-white hover:bg-muted p-1"

            />
            <ShareButton 
              listing={listing} 
              size="sm"
              className="bg-white hover:bg-muted p-1"
            />
          </div>

          {/* Transaction Type Badge */}
          {safeTransactionType !== 'sale' && (
            <Badge className={`absolute top-2 left-2 text-white ${getTransactionColor()} border-0`}>
              {getTransactionIcon()}
              <span className="ml-1">
                {safeTransactionType === 'donation' ? 'Don' : 'Troc'}
              </span>
            </Badge>
          )}

          {/* Condition Badge */}
          {safeTransactionType === 'sale' && (
            <Badge className={`absolute top-2 left-2 ${getConditionColor(safeCondition)} border-0`}>
              {getConditionLabel(safeCondition)}
            </Badge>
          )}

          {/* Environmental Impact */}
          {listing.environmentalImpact && (
            <Badge className="absolute bottom-2 left-2 bg-safe-emerald border-0">
              <Leaf className="w-3 h-3 mr-1" />
              -{listing.environmentalImpact.co2Saved}kg CO₂
            </Badge>
          )}

          {/* Image Count */}
          {listing.images && listing.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              +{listing.images.length - 1}
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/listing/${listing.id}`} className="group">
          <div className="space-y-3">
            {/* Price */}
            <div className="flex items-center justify-between">
              <span className={`text-xl font-bold ${
                safeTransactionType === 'donation' ? 'text-green-600' :
                safeTransactionType === 'exchange' ? 'text-purple-600' :
                'text-primary'
              }`}>
                {formatPrice(safePrice, safeCurrency)}
              </span>
              <div className="flex items-center text-xs text-muted-foreground space-x-2">
                <Eye className="w-3 h-3" />
                <span>{listing.views || 0}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {listing.title || 'Sans titre'}
            </h3>

            {/* Exchange info */}
            {safeTransactionType === 'exchange' && listing.exchangeFor && (
              <p className="text-sm text-muted-foreground">
                <RefreshCw className="w-3 h-3 inline mr-1" />
                Contre: {listing.exchangeFor}
              </p>
            )}

            {/* Location and Date */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">
                  {listing.location?.campus || 
                   (listing.location?.city && listing.location?.state ? 
                    `${listing.location.city}, ${listing.location.state}` : 
                    'Localisation non spécifiée')}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>
                  {formatSafeDate(listing.createdAt)}
                </span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={listing.sellerAvatar} />
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {listing.sellerName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-foreground truncate">
                      {listing.sellerName || 'Utilisateur'}
                    </span>
                    {listing.sellerVerified && (
                      <Shield className="w-3 h-3 text-green-600" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {listing.sellerUniversity || 'Université non spécifiée'}
                  </span>
                </div>
              </div>
              
              {/* AI Price Estimate */}
              {listing.aiPriceEstimate && safeTransactionType === 'sale' && (
                <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                  Prix juste ✓
                </Badge>
              )}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};