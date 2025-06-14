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
        return 'bg-orange-100 text-orange-700 border-orange-200';
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
      default:
        return 'bg-primary text-white hover:bg-primary/90';
    }
  };

  const formatSafeDate = (date: any) => {
    try {
      let validDate: Date;
      
      if (!date) return 'Date inconnue';
      
      if (date instanceof Date) {
        validDate = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        validDate = new Date(date);
      } else if (date && typeof date.toDate === 'function') {
        validDate = date.toDate();
      } else if (date && typeof date === 'object' && date.seconds) {
        validDate = new Date(date.seconds * 1000);
      } else {
        return 'Date inconnue';
      }
      
      if (isNaN(validDate.getTime())) return 'Date inconnue';
      
      return formatDistanceToNow(validDate, { 
        addSuffix: true, 
        locale: fr 
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Date inconnue';
    }
  };

  const safePrice = listing.price || 0;
  const safeCurrency = listing.currency || 'EUR';
  const safeCondition = listing.condition || 'good';
  const safeTransactionType = listing.transactionType || 'sale';

  return (
    <Card className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden w-full max-w-sm">
      {/* Image Section */}
      <Link to={`/listing/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={listing.images?.[0] || '/placeholder.jpg'}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          
          {/* Gradient Overlay for better badge visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/20 pointer-events-none" />
          
          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <FavoriteButton 
              listing={listing} 
              size="sm"
              className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm border-0 rounded-full p-2"
            />
            <ShareButton 
              listing={listing} 
              size="sm"
              className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm border-0 rounded-full p-2"
            />
          </div>

          {/* Transaction Type Badge */}
          {safeTransactionType !== 'sale' && (
            <Badge className={`absolute top-3 left-3 ${getTransactionColor()} border-0 shadow-sm font-medium px-3 py-1.5 rounded-full`}>
              {getTransactionIcon()}
              <span className="ml-1.5 text-sm">
                {safeTransactionType === 'donation' ? 'Don' : 'Troc'}
              </span>
            </Badge>
          )}

          {/* Condition Badge */}
          {safeTransactionType === 'sale' && (
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
              'text-slate-900'
            }`}>
              {formatPrice(safePrice, safeCurrency)}
            </span>
            <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
              <Eye className="w-3.5 h-3.5" />
              <span className="font-medium">{listing.views || 0}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-3 leading-tight text-left">
            {listing.title || 'Sans titre'}
          </h3>

          {/* Exchange Info */}
          {safeTransactionType === 'exchange' && listing.exchangeFor && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-purple-50 px-3 py-2 rounded-lg mb-4">
              <RefreshCw className="w-4 h-4 text-purple-500" />
              <span><span className="font-medium">Contre:</span> {listing.exchangeFor}</span>
            </div>
          )}

          {/* Location and Date */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {listing.location?.campus || 
                 (listing.location?.city && listing.location?.state ? 
                  `${listing.location.city}, ${listing.location.state}` : 
                  'Localisation non spécifiée')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="whitespace-nowrap">
                {formatSafeDate(listing.createdAt)}
              </span>
            </div>
          </div>
        </Link>

        {/* Seller Section */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-9 h-9 border-2 border-gray-100">
              <AvatarImage src={listing.sellerAvatar} />
              <AvatarFallback className="text-sm bg-gray-100 text-gray-600 font-medium">
                {listing.sellerName?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {listing.sellerName || 'Utilisateur'}
                </span>
                {listing.sellerVerified && (
                  <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              <span className="text-xs text-gray-500 truncate block text-left">
                {listing.sellerUniversity || 'Université non spécifiée'}
              </span>
            </div>
          </div>
          
          {/* AI Price Estimate */}
          {listing.aiPriceEstimate && safeTransactionType === 'sale' && (
            <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-2">
              Prix juste ✓
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};