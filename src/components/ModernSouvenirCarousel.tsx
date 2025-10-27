import React, { useEffect, useState, useCallback } from 'react';
import { SouvenirItem } from './VerticalSouvenirStrip';

interface ModernSouvenirCarouselProps {
  items: SouvenirItem[];
  onOpenGallery?: (startIndex: number) => void;
}

export default function ModernSouvenirCarousel({ items, onOpenGallery }: ModernSouvenirCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused || !items || items.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isPaused, items]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  // Show multiple items (3-5 depending on screen)
  const visibleCount = 5;
  const current = items[currentIndex];

  return (
    <div 
      className="souvenir-carousel relative w-14"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main display item */}
      <div className="relative mb-2">
        <button
          onClick={() => onOpenGallery?.(currentIndex)}
          className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary hover:ring-secondary transition-all hover:scale-110"
          aria-label={`Voir souvenir de ${current.displayName}`}
        >
          <img
            src={current.thumbnailUrl}
            alt={current.displayName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Name badge */}
          <div className="absolute bottom-0 left-0 right-0 p-1">
            <span className="text-[10px] text-white font-medium truncate block">
              {current.displayName.split(' ')[0]}
            </span>
          </div>
        </button>
        
        {/* Pulse indicator */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" />
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute top-0 left-0 w-full h-6 flex items-start justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Souvenir précédent"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          <button
            onClick={handleNext}
            className="absolute bottom-0 left-0 w-full h-6 flex items-end justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Souvenir suivant"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </>
      )}

      {/* Progress indicator */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-1">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-1 h-1 rounded-full transition-all ${
              idx === currentIndex ? 'bg-primary w-3' : 'bg-white/30'
            }`}
            aria-label={`Aller au souvenir ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

