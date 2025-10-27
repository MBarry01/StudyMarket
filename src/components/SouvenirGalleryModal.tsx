import React, { useEffect } from 'react';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';

export default function SouvenirGalleryModal({
  items,
  startIndex = 0,
  onClose,
}: {
  items: { fullUrl?: string; thumbnailUrl?: string; displayName?: string; caption?: string }[];
  startIndex?: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Bloquer scroll body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  if (!items || items.length === 0) return null;

  // Convertir vers le format react-image-gallery
  const galleryImages = items.map(item => ({
    original: item.fullUrl ?? item.thumbnailUrl ?? '',
    thumbnail: item.thumbnailUrl ?? item.fullUrl ?? '',
    description: item.caption || '',
    originalAlt: item.displayName || '',
    thumbnailAlt: item.displayName || '',
  }));

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/95" onClick={onClose} />
      <div className="relative z-10 max-w-[95vw] max-h-[95vh] w-full">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          aria-label="Fermer la galerie"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Image Gallery */}
        <div className="rounded-lg overflow-hidden">
          <ImageGallery
            items={galleryImages}
            startIndex={startIndex}
            onClose={onClose}
            showFullscreenButton={false}
            showPlayButton={false}
            autoPlay={false}
            showThumbnails={true}
            thumbnailPosition="bottom"
            slideOnThumbnailOver={true}
            additionalClass="souvenir-gallery"
          />
        </div>
      </div>
    </div>
  );
}

