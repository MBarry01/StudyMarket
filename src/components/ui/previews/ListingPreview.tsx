/**
 * Preview component pour afficher des annonces inline dans le chatbot
 */

import React from 'react';
import { MapPin, Euro, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Listing } from '@/types';

interface ListingPreviewProps {
  listings: Listing[];
  onListingClick?: (listingId: string) => void;
}

export const ListingPreview: React.FC<ListingPreviewProps> = ({ 
  listings, 
  onListingClick 
}) => {
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-3">
      {listings.slice(0, 5).map((listing) => (
        <Card 
          key={listing.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            if (onListingClick) {
              onListingClick(listing.id);
            } else {
              window.location.href = `/listing/${listing.id}`;
            }
          }}
        >
          <CardContent className="p-3">
            <div className="flex gap-3">
              {/* Image */}
              {listing.images && listing.images.length > 0 && (
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                  <img 
                    src={listing.images[0]} 
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate mb-1">
                  {listing.title}
                </h4>
                
                {/* Category */}
                {listing.category && (
                  <Badge variant="secondary" className="text-xs mb-1">
                    {listing.category}
                  </Badge>
                )}
                
                {/* Price */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Euro className="w-3 h-3" />
                  <span className="font-semibold">{listing.price}€</span>
                </div>
                
                {/* Location */}
                {listing.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{listing.location.city}</span>
                  </div>
                )}
                
                {/* Views */}
                {listing.views !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Eye className="w-3 h-3" />
                    <span>{listing.views} vues</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {listings.length > 5 && (
        <p className="text-xs text-center text-gray-500">
          + {listings.length - 5} autres résultats
        </p>
      )}
    </div>
  );
};

