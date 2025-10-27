import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Navigation, Loader2, X, MapPin } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { useTheme } from 'next-themes';
import 'mapbox-gl/dist/mapbox-gl.css';

// Styles personnalisés pour la carte
const mapStyles = `
  /* Réduire les contrôles de navigation (ZOOM + LOCATION) */
  .mapboxgl-ctrl-group {
    margin: 0.5px !important;
    margin-top: 20px !important;
    position: relative !important;
    top: 15px !important;
  }
  
  .mapboxgl-ctrl-group button {
    width: 28px !important;
    height: 28px !important;
    font-size: 14px !important;
  }
  
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
  }
  
  .mapboxgl-ctrl-bottom-left a.mapboxgl-ctrl-logo {
    display: block !important;
    visibility: visible !important;
    opacity: 0.4 !important;
  }
`;

// Token public Mapbox
(mapboxgl as any).accessToken = 'pk.eyJ1IjoibWJhcnJ5MjIiLCJhIjoiY21oM3FyZXZsMTZodTJqcXk0dTRybWVkMSJ9.A1RGamevhBLlCZFhz-EFqQ';

interface MapViewerProps {
  latitude: number;
  longitude: number;
  address: string;
  title?: string;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  latitude,
  longitude,
  address,
  title = 'Point de rencontre'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const routeLayerId = 'route';
  const routeSourceId = 'route-source';
  const { resolvedTheme } = useTheme();

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  // Validation des coordonnées
  const isValidCoordinates = latitude && longitude && 
    !isNaN(latitude) && !isNaN(longitude) && 
    latitude !== 0 && longitude !== 0;

  // Si les coordonnées ne sont pas valides, ne pas afficher la carte
  if (!isValidCoordinates) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2" />
            <p>Aucune localisation GPS disponible pour cette annonce</p>
            <p className="text-sm mt-1">Le vendeur n'a pas spécifié de point de rencontre précis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        }
      );
    }
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Détecter le mode dark/light avec le hook useTheme
    const isDarkMode = resolvedTheme === 'dark';
    
    // Créer la carte
    map.current = new (mapboxgl as any).Map({
      container: mapContainer.current,
      style: isDarkMode 
        ? 'mapbox://styles/mapbox/dark-v11' 
        : 'mapbox://styles/mapbox/light-v11',
      center: [longitude, latitude],
      zoom: 14,
      attributionControl: false,
      logoPosition: 'bottom-left'
    });

    // Ajouter les contrôles de navigation
    map.current.addControl(new (mapboxgl as any).NavigationControl(), 'top-right');
    
    // Ajouter le contrôle de géolocalisation
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

    // Créer un marqueur personnalisé pour le point de rencontre
    const el = document.createElement('div');
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
    el.style.backgroundSize = 'cover';

    // Ajouter le marqueur
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px; color: #1a202c;">${title}</h3>
              <p style="font-size: 14px; color: #4a5568; margin: 0;">${address}</p>
            </div>
          `)
      )
      .addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude, address, title, resolvedTheme]);

  // Effet pour mettre à jour le style de la carte quand le thème change
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    const isDarkMode = resolvedTheme === 'dark';
    const newStyle = isDarkMode
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';

    // Appliquer le style uniquement quand la carte est prête
    if (m.isStyleLoaded()) {
      m.setStyle(newStyle);
    } else {
      const onLoad = () => {
        m.setStyle(newStyle);
      };
      m.once('load', onLoad);
    }
  }, [resolvedTheme]);

  // Calculer et afficher l'itinéraire
  const getRoute = async () => {
    if (!userLocation) return;

    setIsLoadingRoute(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation[0]},${userLocation[1]};${longitude},${latitude}?geometries=geojson&access_token=${(mapboxgl as any).accessToken}&language=fr`
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

        // Ajuster la vue pour afficher tout l'itinéraire
        const coordinates = geojson.coordinates;
        const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
          return bounds.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current?.fitBounds(bounds, {
          padding: 80,
          duration: 1000
        });

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

    // Recentrer sur le point de rencontre
    if (map.current) {
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        duration: 1000
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Injecter les styles personnalisés */}
      <style>{mapStyles}</style>
      
      {/* Carte interactive */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            <div
              ref={mapContainer}
              className="w-full h-[300px] sm:h-[400px] rounded-lg overflow-hidden"
            />
            
            {/* Contrôles de l'itinéraire */}
            {userLocation && (
              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                {!showRoute ? (
                  <Button
                    type="button"
                    onClick={getRoute}
                    disabled={isLoadingRoute || isLoadingLocation}
                    className="w-full shadow-lg"
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
                  <Card className="bg-background/95 backdrop-blur border-primary/20 shadow-lg">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Navigation className="w-5 h-5 text-primary" />
                          <div>
                            <h4 className="font-semibold text-foreground">Itinéraire calculé</h4>
                            {routeInfo && (
                              <p className="text-sm text-muted-foreground">
                                {`${(routeInfo.distance / 1000).toFixed(2)} km - ${Math.ceil(routeInfo.duration / 60)} min à pied`}
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

            {/* Message si géolocalisation non disponible */}
            {!userLocation && !isLoadingLocation && (
              <div className="absolute bottom-4 left-4 right-4">
                <Card className="bg-background/95 backdrop-blur border-border shadow-lg">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>
                        Activez la géolocalisation pour calculer l'itinéraire vers ce point de rencontre
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

