import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SouvenirItem } from './VerticalSouvenirStrip';

interface HorizontalSouvenirCarouselProps {
  items: SouvenirItem[];
  onOpenGallery?: (startIndex: number) => void;
}

export default function HorizontalSouvenirCarousel({ items, onOpenGallery }: HorizontalSouvenirCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll horizontal
  useEffect(() => {
    if (isPaused || !items || items.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isPaused, items.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  return (
    <div 
      className="souvenir-carousel-horizontal relative h-20 bg-gradient-to-b from-primary/5 to-transparent border-b border-primary/10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={containerRef}
    >
      <div className="container mx-auto px-4 relative h-full flex items-center justify-between">
        {/* Left navigation */}
        <button
          onClick={handlePrev}
          className="absolute left-2 z-10 w-8 h-8 rounded-full bg-background/80 hover:bg-background border border-border flex items-center justify-center text-foreground hover:text-primary transition-all hover:scale-110"
          aria-label="Précédent"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Carousel items */}
        <div className="flex-1 flex items-center justify-center gap-3 overflow-hidden">
          <div 
            className="flex items-center gap-3 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(${-currentIndex * 72}px)` }}
          >
            {items.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => onOpenGallery?.(idx)}
                className="flex-shrink-0 group relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/30 hover:ring-primary transition-all hover:scale-110"
                aria-label={`Voir souvenir de ${item.displayName}`}
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.displayName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Name badge on hover */}
                <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white font-medium truncate px-1 mb-1">
                    {item.displayName.split(' ')[0]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right navigation */}
        <button
          onClick={handleNext}
          className="absolute right-2 z-10 w-8 h-8 rounded-full bg-background/80 hover:bg-background border border-border flex items-center justify-center text-foreground hover:text-primary transition-all hover:scale-110"
          aria-label="Suivant"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Progress indicators */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1 rounded-full transition-all ${
              idx === currentIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30 w-1'
            }`}
            aria-label={`Souvenir ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

