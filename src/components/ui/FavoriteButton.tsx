import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { Listing } from '../../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
  listing: Listing;
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  listing,
  size = 'default',
  showText = true,
  className = ''
}) => {
  const { currentUser } = useAuth();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const navigate = useNavigate();
  
  const isLiked = isFavorite(listing.id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      navigate('/auth');
      return;
    }
    
    toggleFavorite(currentUser.uid, listing);
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'lg': return 'h-10 w-10';
      default: return 'h-9 w-9';
    }
  };

  return (
     <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleFavorite}
      className={`${getButtonSize()} ${
        isLiked ? 'text-red-500 hover:text-red-600' : 'text-foreground hover:text-red-500'
      } ${className}`}
      aria-label={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
    </Button>
  );
};