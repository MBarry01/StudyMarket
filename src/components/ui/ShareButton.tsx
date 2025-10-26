import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Listing } from '../../types';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  listing: Listing;
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  listing,
  size = 'default',
  showText = true,
  className = ''
}) => {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareData = {
      title: listing.title,
      text: `Découvrez cette annonce sur StudyMarket: ${listing.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Lien copié dans le presse-papiers');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'lg': return 'h-10 w-10';
      default: return 'h-9 w-9';
    }
  };

  const iconSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <Button
      variant="ghost"
      size={'icon'}
      onClick={handleShare}
      className={`${getButtonSize()} touch-manipulation ${className}`}
      aria-label="Partager"
    >
      <Share2 className={`${iconSize} transition-transform`} />
    </Button>
  );
};