import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye, Shield, Gift, RefreshCw, Leaf, Edit, Trash2, Home, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { ShareButton } from '@/components/ui/ShareButton';
import { Button } from '@/components/ui/button';
import { Listing } from '../../types';
import { useAuth } from '@/contexts/AuthContext';

interface ListingCardProps {
  listing: Listing;
  showActions?: boolean;
  onEdit?: (listing: Listing) => void;
  onDelete?: (listing: Listing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ 
  listing, 
  showActions = false, 
  onEdit, 
  onDelete 
}) => {
  const { currentUser, userProfile } = useAuth();
  const isOwner = currentUser?.uid === listing.sellerId;
  const displayedSellerName = isOwner
    ? userProfile?.displayName || listing.sellerName || 'Utilisateur'
    : listing.sellerName || 'Utilisateur';
  const displayedSellerUniversity = isOwner
    ? userProfile?.university || 'Université non spécifiée'
    : listing.sellerUniversity || 'Université non spécifiée';
  const displayedCampus = isOwner
    ? userProfile?.campus || listing.location?.campus || null
    : listing.location?.campus || null;

  const displayedLocation = (() => {
    if (displayedCampus) return displayedCampus;
    if (isOwner && userProfile?.location) return userProfile.location;
    if (listing.location?.city && listing.location?.state) {
      return `${listing.location.city}, ${listing.location.state}`;
    }
    return (
      listing.location?.city ||
      listing.location?.state ||
      listing.location?.country ||
      'Localisation non spécifiée'
    );
  })();
  const formatPrice = (price: number, currency?: string) => {
    if (listing.category === 'housing') return `${(price || 0).toFixed(0)}€/mois`;
    if (listing.transactionType === 'donation') return 'Gratuit';
    if (listing.transactionType === 'exchange') return 'Échange';
    if (listing.transactionType === 'service') return `${price.toFixed(2)}€/h`;
    
    const currencyCode = currency || 'EUR';
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode,
      }).format(price);
    } catch (error) {
      return `${price} €`;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'like-new':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'good':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'fair':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'poor':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
        return <Gift className="w-3 h-3" />;
      case 'exchange':
        return <RefreshCw className="w-3 h-3" />;
      case 'service':
        return <Leaf className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getTransactionColor = () => {
    switch (listing.transactionType) {
      case 'donation':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'exchange':
        return 'bg-purple-500 text-white hover:bg-purple-600';
      case 'service':
        return 'bg-blue-500 text-white hover:bg-blue-600';
      default:
        return 'bg-primary text-white hover:bg-primary/90';
    }
  };

  const safePrice = listing.price || 0;
  const safeCurrency = listing.currency || 'EUR';
  const safeCondition = listing.condition || 'good';
  const safeTransactionType = listing.transactionType || 'sale';

  return (
    <Card className="group relative bg-card text-card-foreground rounded-xl border border-border hover:border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden w-full max-w-sm card-touchable">
      {/* Image Section */}
      <Link to={`/listing/${listing.id}`} className="block touch-manipulation">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={listing.images?.[0] || '/images/placeholder.jpg'}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 touch-manipulation"
          />
          
          {/* Gradient Overlay for better badge visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/20 pointer-events-none" />
          
          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <FavoriteButton 
              listing={listing} 
              size="sm"
              className="bg-white/90 dark:bg-black/40 backdrop-blur-sm hover:bg-white dark:hover:bg-black/60 shadow-sm border-0 rounded-full p-2"
            />
            <ShareButton 
              listing={listing} 
              size="sm"
              className="bg-white/90 dark:bg-black/40 backdrop-blur-sm hover:bg-white dark:hover:bg-black/60 shadow-sm border-0 rounded-full p-2"
            />
          </div>

          {/* Housing Badge */}
          {listing.category === 'housing' ? (
            <Badge className={"absolute top-3 left-3 bg-blue-500 text-white border-0 shadow-sm font-medium px-3 py-1.5 rounded-full"}>
              <Home className="w-3 h-3" />
              <span className="ml-1.5 text-sm">Logement</span>
            </Badge>
          ) : safeTransactionType !== 'sale' && (
            <Badge className={`absolute top-3 left-3 ${getTransactionColor()} border-0 shadow-sm font-medium px-3 py-1.5 rounded-full`}>
              {getTransactionIcon()}
              <span className="ml-1.5 text-sm">
                {safeTransactionType === 'donation' ? 'Don' : 
                 safeTransactionType === 'exchange' ? 'Troc' :
                 safeTransactionType === 'service' ? 'Service' : 
                 'Troc'}
              </span>
            </Badge>
          )}

          {/* Status Badge (VENDU) */}
          {listing.status === 'sold' && (
            <Badge className="absolute top-3 left-3 bg-red-500 text-white font-bold px-4 py-2 rounded-full shadow-md border-0">
              VENDU
            </Badge>
          )}
          
          {/* Condition Badge */}
          {safeTransactionType === 'sale' && listing.status !== 'sold' && (
            <Badge className={`absolute top-3 left-3 ${getConditionColor(safeCondition)} font-medium px-3 py-1.5 rounded-full shadow-sm`}>
              {getConditionLabel(safeCondition)}
            </Badge>
          )}

          {/* Environmental Impact */}
          {listing.environmentalImpact && (
            <Badge className="absolute bottom-3 left-3 bg-emerald-500 text-white border-0 shadow-sm font-medium px-3 py-1.5 rounded-full">
              <Leaf className="w-3 h-3 mr-1.5" />
              -{listing.environmentalImpact.co2Saved}kg CO₂
            </Badge>
          )}

          {/* Image Count */}
          {listing.images && listing.images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-sm px-2.5 py-1 rounded-full font-medium">
              +{listing.images.length - 1}
            </div>
          )}
        </div>
      </Link>

      {/* Content Section */}
      <CardContent className="p-6 space-y-4">
        <Link to={`/listing/${listing.id}`} className="block">
          {/* Price and Views */}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-2xl font-bold ${
              safeTransactionType === 'donation' ? 'text-green-600' :
              safeTransactionType === 'exchange' ? 'text-purple-600' :
              'text-foreground'
            }`}>
              {formatPrice(safePrice, safeCurrency)}
            </span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              <Eye className="w-3.5 h-3.5" />
              <span className="font-medium">{listing.views || 0}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-3 leading-tight text-left">
            {listing.title || 'Sans titre'}
          </h3>

          {/* Exchange Info */}
          {safeTransactionType === 'exchange' && listing.exchangeFor && (
            <div className="flex items-center gap-2 text-sm text-foreground dark:text-purple-200 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg mb-4">
              <RefreshCw className="w-4 h-4 text-purple-500" />
              <span><span className="font-medium">Contre:</span> {listing.exchangeFor}</span>
            </div>
          )}

          {/* Location and Date */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {displayedLocation}
              </span>
            </div>
            {/* Publication timer removed on cards */}
          </div>
        </Link>

        {/* Seller Section */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="w-9 h-9 border-2 border-border">
                <AvatarImage src={isOwner ? userProfile?.photoURL || undefined : listing.sellerAvatar || undefined} />
                <AvatarFallback className="text-sm bg-muted text-muted-foreground font-medium">
                  {displayedSellerName?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {((listing.sellerVerificationStatus === 'verified' || listing.sellerVerificationStatus === 'Verified') || listing.sellerVerified) && (
                <div className="absolute bottom-0 right-0 transform translate-x-1/4 -translate-y-1/4 z-10">
                  <BadgeCheck size={14} fill="#3b82f6" stroke="white" strokeWidth={2} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground truncate">
                  {displayedSellerName}
                </span>
              </div>
              <span className="text-xs text-muted-foreground truncate block text-left">
                {displayedSellerUniversity}
              </span>
            </div>
          </div>
          
          {/* AI Price Estimate */}
          {listing.aiPriceEstimate && safeTransactionType === 'sale' && (
            <Badge className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-2">
              Prix juste ✓
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(listing)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              <Edit className="w-4 h-4 mr-1" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete?.(listing)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};