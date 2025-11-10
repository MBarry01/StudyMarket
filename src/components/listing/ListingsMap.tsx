import React, { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import 'mapbox-gl/dist/mapbox-gl.css';

(mapboxgl as any).accessToken =
  'pk.eyJ1IjoibWJhcnJ5MjIiLCJhIjoiY21oM3FyZXZsMTZodTJqcXk0dTRybWVkMSJ9.A1RGamevhBLlCZFhz-EFqQ';

interface ListingWithCoords {
  id: string;
  title: string;
  price?: number;
  images?: string[];
  location: {
    coordinates?: {
      lat: number;
      lng: number;
    };
    campus?: string | null;
  };
}

interface ListingsMapComponentProps {
  listings: ListingWithCoords[];
  heightClass?: string;
  useCard?: boolean;
}

export const ListingsMap: React.FC<ListingsMapComponentProps> = ({
  listings,
  heightClass = 'h-96',
  useCard = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const { resolvedTheme } = useTheme();

  const listingsWithCoords = useMemo(
    () =>
      listings.filter(
        (listing) =>
          listing.location?.coordinates &&
          !isNaN(listing.location.coordinates.lat) &&
          !isNaN(listing.location.coordinates.lng)
      ),
    [listings]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const isDark = resolvedTheme === 'dark';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: [2.3522, 48.8566],
      zoom: 11,
      attributionControl: false,
      logoPosition: 'bottom-left',
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapRef.current.on('click', () => {
      markersRef.current.forEach((marker) => {
        const popup = marker.getPopup();
        if (popup?.isOpen()) {
          popup.remove();
        }
      });
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [resolvedTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    if (listingsWithCoords.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    // Ajouter les nouveaux marqueurs
    listingsWithCoords.forEach((listing) => {
      const coords = listing.location.coordinates!;
      const origin = typeof window !== 'undefined' ? window.location?.origin || '' : '';
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const hideMedia = viewportWidth < 768;
      const imageUrl = listing.images?.[0] || `${origin}/images/placeholder.jpg`;

      const imageSection = hideMedia
        ? ''
        : `
            <div style="width: 100%; aspect-ratio: 4 / 3; background: #F1F5F9;">
              <img
                src="${imageUrl}"
                alt="${listing.title}"
                style="width: 100%; height: 100%; object-fit: cover;"
              />
            </div>
          `;

      const campusSection = !hideMedia && listing.location.campus
        ? `
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 999px;
              background: rgba(37, 99, 235, 0.12);
              color: #1D4ED8;
              border: 1px solid rgba(37, 99, 235, 0.18);
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 0.04em;
              margin-bottom: 10px;
              text-transform: uppercase;
            ">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              ${listing.location.campus}
            </div>
          `
        : '';

      const priceSection =
        listing.price !== undefined
          ? `<p style="margin: 10px 0 0 0; font-size: clamp(15px, 4vw, 17px); font-weight: 600; color: #1F2937;">
                ${listing.price.toLocaleString('fr-FR')} €
              </p>`
          : '';

      const popupContent = `
        <div style="width: min(260px, calc(100vw - 24px)); border-radius: 16px; overflow: hidden; background: #ffffff; border: 1px solid #E2E8F0; box-shadow: 0 16px 30px rgba(15, 23, 42, 0.18); color: #0F172A; font-family: 'Inter', 'Segoe UI', sans-serif;">
          ${imageSection}
          <div style="padding: clamp(12px, 3vw, 16px) clamp(14px, 4vw, 18px) clamp(14px, 4vw, 18px);">
            ${campusSection}
            <h3 style="margin: 0; font-size: clamp(15px, 4vw, 16px); line-height: 1.45; font-weight: 600; color: #0F172A;">
              ${listing.title}
            </h3>
            ${priceSection}
            <a
              href="/listing/${listing.id}"
              style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-top: clamp(12px, 4vw, 16px);
                width: 100%;
                padding: clamp(9px, 3vw, 11px) clamp(12px, 4vw, 16px);
                border-radius: 12px;
                background: #1D4ED8;
                color: #FFFFFF;
                font-size: clamp(12.5px, 3.5vw, 13.5px);
                font-weight: 600;
                letter-spacing: 0.02em;
                text-decoration: none;
              "
            >
              Voir les détails
            </a>
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker({ color: '#2563eb' })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(
          new mapboxgl.Popup({
            offset: [0, -24],
            closeButton: false,
            closeOnClick: false,
            anchor: 'bottom',
            className: 'listing-map-popup',
          }).setHTML(popupContent)
        )
        .addTo(map);

      markersRef.current.set(listing.id, marker);
      bounds.extend([coords.lng, coords.lat]);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 800 });
    }
  }, [listingsWithCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    map.setStyle(
      resolvedTheme === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11'
    );
  }, [resolvedTheme]);

  const mapElement = useCard ? (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div ref={mapContainerRef} className={`${heightClass} w-full`} />
      </CardContent>
    </Card>
  ) : (
    <div className={`relative w-full ${heightClass}`}>
      <div
        ref={mapContainerRef}
        className="absolute inset-0 border border-border overflow-hidden rounded-xl"
      />
    </div>
  );

  return mapElement;
};

