import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Input } from './input';
import { Label } from './label';
import { useTheme } from 'next-themes';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// Styles personnalisés pour corriger l'affichage des icônes et du logo
const geocoderStyles = `
  .mapboxgl-ctrl-geocoder {
    min-width: 200px !important;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
    font-size: 13px !important;
  }
  
  .mapboxgl-ctrl-geocoder .mapboxgl-ctrl-geocoder--icon {
    display: inline-block !important;
    width: 16px !important;
    height: 16px !important;
    background-size: contain !important;
  }
  
  .mapboxgl-ctrl-geocoder--icon-search {
    left: 8px !important;
    top: 8px !important;
    position: absolute !important;
  }
  
  .mapboxgl-ctrl-geocoder--icon-close {
    right: 8px !important;
    top: 8px !important;
    position: absolute !important;
  }
  
  .mapboxgl-ctrl-geocoder--input {
    padding: 6px 28px !important;
    font-size: 13px !important;
  }
  
  .mapboxgl-ctrl-geocoder--button {
    padding: 0 !important;
    width: 24px !important;
    height: 24px !important;
    background: transparent !important;
  }
  
  /* Réduire les contrôles de navigation (ZOOM + LOCATION) */
  .mapboxgl-ctrl-group {
    margin: 0.5px !important;
    margin-top: 20px !important;
    position: relative !important;
    top: 15px !important;
  }
  
  /* Réduire la barre de recherche sur mobile */
  @media (max-width: 640px) {
    .mapboxgl-ctrl-geocoder {
      width: calc(100% - 16px) !important;
      max-width: 280px !important;
      min-width: 120px !important;
      font-size: 11px !important;
      margin: 8px !important;
    }
    
    .mapboxgl-ctrl-geocoder--input {
      padding: 4px 20px !important;
      font-size: 11px !important;
      height: 32px !important;
    }
    
    .mapboxgl-ctrl-geocoder .mapboxgl-ctrl-geocoder--icon {
      width: 13px !important;
      height: 13px !important;
    }
    
    .mapboxgl-ctrl-geocoder--icon-search {
      left: 6px !important;
      top: 6px !important;
    }
    
    .mapboxgl-ctrl-geocoder--icon-close {
      right: 6px !important;
      top: 6px !important;
    }
  }
  
  .mapboxgl-ctrl-group button {
    width: 28px !important;
    height: 28px !important;
    font-size: 14px !important;
  }
  
  /* Rendre le logo Mapbox plus discret */
  .mapboxgl-ctrl-bottom-left {
    opacity: 0.4 !important;
    transition: opacity 0.2s ease !important;
    bottom: 4px !important;
    left: 4px !important;
    position: absolute !important;
  }
  
  .mapboxgl-ctrl-bottom-left:hover {
    opacity: 0.8 !important;
  }
  
  .mapboxgl-ctrl-logo {
    width: 50px !important;
    height: 15px !important;
    margin: 0 !important;
  }
  
  /* Masquer complètement TOUS les contrôles d'attribution */
  .mapboxgl-ctrl-attrib,
  .mapboxgl-ctrl-attrib-button,
  .mapboxgl-ctrl-attrib.mapboxgl-compact,
  .mapboxgl-ctrl-attrib.mapboxgl-compact-show,
  .mapboxgl-ctrl-attrib-inner,
  .mapboxgl-ctrl.mapboxgl-ctrl-attrib,
  .mapboxgl-ctrl-bottom-right,
  .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl-attrib {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    width: 0 !important;
    height: 0 !important;
    pointer-events: none !important;
    position: absolute !important;
    overflow: hidden !important;
  }
  
  /* Cibler spécifiquement le conteneur en bas à droite */
  .mapboxgl-ctrl-bottom-right {
    display: none !important;
  }
  
  /* Masquer tout texte d'attribution visible */
  .mapboxgl-ctrl-attrib a,
  .mapboxgl-ctrl-attrib span,
  .mapboxgl-ctrl-attrib button {
    display: none !important;
  }
  
  /* GARDER le logo Mapbox visible (en bas à gauche) */
  .mapboxgl-ctrl-bottom-left a.mapboxgl-ctrl-logo {
    display: block !important;
    visibility: visible !important;
    opacity: 0.4 !important;
  }
`;

// Token public Mapbox
(mapboxgl as any).accessToken = 'pk.eyJ1IjoibWJhcnJ5MjIiLCJhIjoiY21oM3FyZXZsMTZodTJqcXk0dTRybWVkMSJ9.A1RGamevhBLlCZFhz-EFqQ';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface MapLocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
  placeholder?: string;
  showDirections?: boolean; // Afficher le bouton d'itinéraire (pour les acheteurs)
}

// Cache local pour le reverse geocoding
const geocodeCache = new Map<string, string>();

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  placeholder = 'Cliquez sur la carte ou recherchez une adresse',
  showDirections = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const routeLayerId = 'route';
  const routeSourceId = 'route-source';
  const { resolvedTheme } = useTheme();

  const [selectedLocation, setSelectedLocation] = useState<LocationData | undefined>(initialLocation);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  // Obtenir la position de l'utilisateur
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          setIsLoadingLocation(false);
          // Position par défaut : Paris, France
          setUserLocation([2.3522, 48.8566]);
        }
      );
    } else {
      // Position par défaut : Paris, France
      setUserLocation([2.3522, 48.8566]);
    }
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current || map.current || !userLocation) return;

    // Validation des coordonnées initiales
    const hasValidInitialLocation = initialLocation && 
      initialLocation.latitude && 
      initialLocation.longitude &&
      !isNaN(initialLocation.latitude) && 
      !isNaN(initialLocation.longitude) &&
      initialLocation.latitude !== 0 && 
      initialLocation.longitude !== 0;

    // Détecter le mode dark/light avec le hook useTheme
    const isDarkMode = resolvedTheme === 'dark';
    
    // Créer la carte avec le style approprié
    map.current = new (mapboxgl as any).Map({
      container: mapContainer.current,
      // Style adaptatif : dark mode ou light mode
      style: isDarkMode 
        ? 'mapbox://styles/mapbox/dark-v11' 
        : 'mapbox://styles/mapbox/light-v11',
      center: hasValidInitialLocation 
        ? [initialLocation.longitude, initialLocation.latitude] 
        : userLocation,
      zoom: 13,
      attributionControl: false,
      logoPosition: 'bottom-left' // Logo Mapbox discret en bas à gauche
    });

    // Ajouter les contrôles de navigation
    map.current.addControl(new (mapboxgl as any).NavigationControl(), 'top-right');
    map.current.addControl(
      new (mapboxgl as any).GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    // Ajouter le geocoder (recherche d'adresse)
    const geocoder = new MapboxGeocoder({
      accessToken: (mapboxgl as any).accessToken || '',
      mapboxgl: mapboxgl as any,
      marker: false,
      placeholder: 'Rechercher une adresse...',
      language: 'fr',
      countries: 'FR'
    });

    map.current.addControl(geocoder as any, 'top-left');

    // Écouter la sélection d'un lieu depuis le geocoder
    geocoder.on('result', (e: any) => {
      const { center, place_name } = e.result;
      handleLocationSelect(center[1], center[0], place_name);
    });

    // Le marqueur de l'utilisateur sera géré par le GeolocateControl

    // Ajouter le marqueur initial si présent et valide
    if (hasValidInitialLocation) {
      addMarker(initialLocation.latitude, initialLocation.longitude);
    }

    // Écouter les clics sur la carte
    map.current.on('click', async (e: any) => {
      const { lng, lat } = e.lngLat;
      await handleLocationClick(lat, lng);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [userLocation, resolvedTheme]);

  // Effet pour mettre à jour le style de la carte quand le thème change
  useEffect(() => {
    if (!map.current) return;

    const isDarkMode = resolvedTheme === 'dark';
    const newStyle = isDarkMode 
      ? 'mapbox://styles/mapbox/dark-v11' 
      : 'mapbox://styles/mapbox/light-v11';

    map.current.setStyle(newStyle);
  }, [resolvedTheme]);

  // Gérer le clic sur la carte
  const handleLocationClick = async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng);
    handleLocationSelect(lat, lng, address);
  };

  // Reverse geocoding avec cache
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    
    // Vérifier le cache
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey)!;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${(mapboxgl as any).accessToken}&language=fr`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        // Mettre en cache
        geocodeCache.set(cacheKey, address);
        return address;
      }
    } catch (error) {
      console.error('Erreur reverse geocoding:', error);
    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Gérer la sélection d'un lieu
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    const locationData: LocationData = {
      address,
      latitude: lat,
      longitude: lng
    };

    setSelectedLocation(locationData);
    onLocationSelect(locationData);
    addMarker(lat, lng);
  };

  // Ajouter un marqueur
  const addMarker = (lat: number, lng: number) => {
    if (!map.current) return;

    // Supprimer le marqueur existant
    if (marker.current) {
      marker.current.remove();
    }

    // Créer un nouveau marqueur
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
    el.style.backgroundSize = 'cover';

    marker.current = new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
      draggable: true
    })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Écouter le déplacement du marqueur
    marker.current.on('dragend', async () => {
      const lngLat = marker.current!.getLngLat();
      await handleLocationClick(lngLat.lat, lngLat.lng);
    });

    // Centrer la carte sur le marqueur
    map.current.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 1000
    });
  };

  // Calculer et afficher l'itinéraire
  const getRoute = async () => {
    if (!userLocation || !selectedLocation) return;

    setIsLoadingRoute(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation[0]},${userLocation[1]};${selectedLocation.longitude},${selectedLocation.latitude}?geometries=geojson&access_token=${(mapboxgl as any).accessToken}&language=fr`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geojson = route.geometry;

        if (map.current?.getSource(routeSourceId)) {
          (map.current.getSource(routeSourceId) as mapboxgl.GeoJSONSource).setData(geojson);
        } else {
          map.current?.addSource(routeSourceId, {
            type: 'geojson',
            data: geojson,
          });
          map.current?.addLayer({
            id: routeLayerId,
            type: 'line',
            source: routeSourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 5,
              'line-opacity': 0.75,
            },
          });
        }
        setRouteInfo({ distance: route.distance, duration: route.duration });
        setShowRoute(true);
      } else {
        console.warn('Aucun itinéraire trouvé.');
        setRouteInfo(null);
        setShowRoute(false);
      }
    } catch (error) {
      console.error('Erreur lors du calcul de l\'itinéraire:', error);
      setRouteInfo(null);
      setShowRoute(false);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Supprimer l'itinéraire
  const removeRoute = () => {
    if (map.current?.getLayer(routeLayerId)) {
      map.current.removeLayer(routeLayerId);
    }
    if (map.current?.getSource(routeSourceId)) {
      map.current.removeSource(routeSourceId);
    }
    setShowRoute(false);
    setRouteInfo(null);
  };

  // Réinitialiser la sélection
  const clearSelection = () => {
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
    removeRoute();
    setSelectedLocation(undefined);
    onLocationSelect({ address: '', latitude: 0, longitude: 0 });
  };

  return (
    <div className="space-y-4">
      {/* Injecter les styles personnalisés */}
      <style>{geocoderStyles}</style>
      
      {/* Champ d'adresse en lecture seule */}
      <div>
        <Label htmlFor="meeting-location" className="text-foreground font-semibold">
          Point de rencontre *
        </Label>
        <div className="relative mt-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="meeting-location"
            value={selectedLocation?.address || ''}
            placeholder={placeholder}
            readOnly
            className="pl-10 pr-10 bg-muted/50 cursor-pointer"
            onClick={() => {
              // Optionnel : focus sur la carte
              mapContainer.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          />
          {selectedLocation && (
            <button
              type="button"
              onClick={clearSelection}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isLoadingLocation ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Localisation en cours...
            </span>
          ) : (
            'Cliquez sur la carte, recherchez une adresse ou déplacez le marqueur'
          )}
        </p>
      </div>

      {/* Carte interactive */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            <div
              ref={mapContainer}
              className="w-full h-[400px] rounded-lg overflow-hidden"
            />
            
            {/* Contrôles de l'itinéraire (uniquement si showDirections=true) */}
            {showDirections && selectedLocation && userLocation && (
              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                {!showRoute ? (
                  <Button
                    type="button"
                    onClick={getRoute}
                    disabled={isLoadingRoute}
                    className="w-full"
                  >
                    {isLoadingRoute ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calcul de l'itinéraire...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4 mr-2" />
                        Afficher l'itinéraire piéton
                      </>
                    )}
                  </Button>
                ) : (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Navigation className="w-5 h-5 text-primary" />
                          <div>
                            <h4 className="font-semibold text-foreground">Itinéraire calculé</h4>
                            {routeInfo && (
                              <p className="text-sm text-muted-foreground">
                                {`Distance: ${(routeInfo.distance / 1000).toFixed(2)} km - Durée: ${(routeInfo.duration / 60).toFixed(0)} min`}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={removeRoute}
                          className="h-8 w-8 flex-shrink-0"
                          title="Masquer l'itinéraire"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

