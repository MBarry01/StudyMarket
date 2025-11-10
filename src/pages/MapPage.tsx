import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { 
  MapPin, 
  Filter, 
  X, 
  Search, 
  Users, 
  Lightbulb,
  Loader2,
  Navigation,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { useAuth } from '../contexts/AuthContext';
import { useListingStore } from '../stores/useListingStore';
import { Listing } from '../types';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SearchFilters } from '../types';
import { 
  sortListingsByPriority, 
  getUserLocation, 
  saveUserLocation, 
  getSavedUserLocation,
  calculateDistance,
  ListingWithDistance,
  fetchNearbyListings,
  safeToDate
} from '../lib/geolocation';
import toast from 'react-hot-toast';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { getUniversityMetadata } from '@/constants/universities';

// Styles personnalisés pour les marqueurs
const markerStyles = `
  .custom-marker {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #3b82f6;
    border: 3px solid white;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    transition: transform 0.2s ease;
  }
  
  .custom-marker:hover {
    transform: scale(1.1);
  }
  
  .mapboxgl-popup-content {
    border-radius: 8px;
    padding: 0;
  }
  
  .mapboxgl-popup-close-button {
    font-size: 20px;
    padding: 4px 8px;
  }
  
  @media (max-width: 768px) {
    .custom-marker {
      width: 28px;
      height: 28px;
    }
  }
`;

// Injecter les styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = markerStyles;
  document.head.appendChild(styleSheet);
}

// Token public Mapbox
(mapboxgl as any).accessToken = 'pk.eyJ1IjoibWJhcnJ5MjIiLCJhIjoiY21oM3FyZXZsMTZodTJqcXk0dTRybWVkMSJ9.A1RGamevhBLlCZFhz-EFqQ';

interface UserNeed {
  id: string;
  userId: string;
  userName: string;
  searchQuery?: string;
  category?: string;
  campus?: string;
  university?: string;
  createdAt: Date;
}

export const MapPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { listings, fetchListings, loading, subscribeToListings, unsubscribeAll } = useListingStore();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<Map<string, any>>(new Map());
  const popup = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userLocationObj, setUserLocationObj] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [filteredListings, setFilteredListings] = useState<ListingWithDistance[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [userNeeds, setUserNeeds] = useState<UserNeed[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<{
    campus: string;
    category: string;
    radius: number;
  }>({
    campus: 'all',
    category: 'all',
    radius: 5 // km
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowFilters(true); // Toujours afficher les filtres sur desktop
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce de la recherche - OPTIMISÉ
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Obtenir la position de l'utilisateur automatiquement au chargement - OPTIMISÉ
  useEffect(() => {
    const loadUserLocation = async () => {
      setIsLoadingLocation(true);

      let resolvedLocation: { lat: number; lng: number } | null = null;

      if (userProfile?.locationCoordinates?.lat && userProfile.locationCoordinates?.lng) {
        resolvedLocation = {
          lat: userProfile.locationCoordinates.lat,
          lng: userProfile.locationCoordinates.lng,
        };
      }

      if (!resolvedLocation) {
        const savedLocation = getSavedUserLocation();
        if (savedLocation) {
          resolvedLocation = savedLocation;
        }
      }

      if (!resolvedLocation) {
        const browserLocation = await getUserLocation();
        if (browserLocation) {
          resolvedLocation = browserLocation;
        }
      }

      if (!resolvedLocation) {
        const metadata = getUniversityMetadata(userProfile?.university || null);
        if (metadata.coordinates) {
          resolvedLocation = {
            lat: metadata.coordinates.lat,
            lng: metadata.coordinates.lng,
          };
        }
      }

      if (!resolvedLocation) {
        resolvedLocation = { lat: 48.8566, lng: 2.3522 };
      }

      setUserLocationObj(resolvedLocation);
      setUserLocation([resolvedLocation.lng, resolvedLocation.lat]);
      saveUserLocation(resolvedLocation);
      setIsLoadingLocation(false);
    };

    loadUserLocation();
  }, [
    userProfile?.university,
    userProfile?.locationCoordinates?.lat,
    userProfile?.locationCoordinates?.lng,
  ]);

  // Ajuster le filtre campus lorsque le profil change
  useEffect(() => {
    if (userProfile?.campus) {
      setFilters(prev =>
        prev.campus === userProfile.campus ? prev : { ...prev, campus: userProfile.campus }
      );
    } else {
      setFilters(prev => (prev.campus === 'all' ? prev : { ...prev, campus: 'all' }));
    }
  }, [userProfile?.campus]);

  // Recentrer la carte lorsque les coordonnées du profil changent
  useEffect(() => {
    const coords = userProfile?.locationCoordinates;
    if (!coords?.lat || !coords?.lng) return;

    const newCenter: [number, number] = [coords.lng, coords.lat];
    const sameAsState =
      userLocation &&
      Math.abs(userLocation[0] - newCenter[0]) < 0.0001 &&
      Math.abs(userLocation[1] - newCenter[1]) < 0.0001;

    if (!sameAsState) {
      setUserLocation(newCenter);
      setUserLocationObj({ lat: coords.lat, lng: coords.lng });
    }

    saveUserLocation({ lat: coords.lat, lng: coords.lng });

    if (map.current && !sameAsState) {
      map.current.flyTo({
        center: newCenter,
        zoom: Math.max(map.current.getZoom() || 12, 12),
        essential: true,
      });
    }
  }, [userProfile?.locationCoordinates?.lat, userProfile?.locationCoordinates?.lng]);

  // Charger les listings optimisés - OPTIMISÉ
  useEffect(() => {
    const searchFilters: SearchFilters = {
      campus: filters.campus !== 'all' ? filters.campus : undefined,
      category: filters.category !== 'all' ? filters.category : undefined,
    };

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToListings(searchFilters);
    } catch (error) {
      console.error('Erreur lors de la souscription aux listings:', error);
      toast.error('Erreur lors de la mise à jour des annonces');
      fetchListings(searchFilters, true).catch((err) => {
        console.error('Erreur fallback fetch listings:', err);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      } else {
        unsubscribeAll();
      }
    };
  }, [
    filters.campus,
    filters.category,
    subscribeToListings,
    unsubscribeAll,
    fetchListings,
  ]);

  // Charger les besoins d'autres utilisateurs du même campus
  useEffect(() => {
    const loadUserNeeds = async () => {
      if (!currentUser || !userProfile?.campus) return;

      try {
        // Récupérer les profils utilisateurs du même campus
        const usersQuery = query(
          collection(db, 'users'),
          where('campus', '==', userProfile.campus),
          limit(50)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const campusUserIds = new Set(usersSnapshot.docs.map(doc => doc.id));
        const userMap = new Map<string, { displayName: string }>();
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          userMap.set(doc.id, {
            displayName: userData.displayName || 'Utilisateur',
          });
        });

        // Récupérer les recherches sauvegardées d'autres utilisateurs du même campus
        const savedSearchesQuery = query(
          collection(db, 'savedSearches'),
          limit(50)
        );
        
        const searchesSnapshot = await getDocs(savedSearchesQuery);
        const needs: UserNeed[] = [];

        searchesSnapshot.forEach((doc) => {
          const data = doc.data();
          // Filtrer pour ne garder que les recherches des utilisateurs du même campus
          if (campusUserIds.has(data.userId) && data.userId !== currentUser.uid) {
            const userInfo = userMap.get(data.userId);
            needs.push({
              id: doc.id,
              userId: data.userId,
              userName: userInfo?.displayName || 'Utilisateur',
              searchQuery: data.filters?.query,
              category: data.filters?.category,
              campus: data.filters?.campus || userProfile.campus,
              university: data.filters?.university || userProfile.university,
              createdAt: safeToDate(data.createdAt),
            });
          }
        });

        // Trier par date de création (plus récentes en premier)
        needs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setUserNeeds(needs.slice(0, 10)); // Limiter à 10 suggestions
      } catch (error) {
        console.error('Erreur lors du chargement des besoins:', error);
      }
    };

    loadUserNeeds();
  }, [currentUser, userProfile?.campus, userProfile?.university]);

  // Filtrer et trier les listings selon les critères avec tri intelligent - OPTIMISÉ avec useMemo
  const filteredListingsMemo = useMemo(() => {
    let filtered = listings.filter(listing => {
      // Filtrer par statut actif
      if (listing.status !== 'active' || listing.moderationStatus !== 'approved') {
        return false;
      }

      // Filtrer par campus si spécifié
      if (filters.campus !== 'all' && listing.location.campus !== filters.campus) {
        return false;
      }

      // Filtrer par catégorie si spécifiée
      if (filters.category !== 'all' && listing.category !== filters.category) {
        return false;
      }

      // Filtrer par recherche textuelle (utiliser debouncedSearchQuery)
      if (debouncedSearchQuery.trim()) {
        const queryLower = debouncedSearchQuery.toLowerCase();
        const matchesTitle = listing.title.toLowerCase().includes(queryLower);
        const matchesDescription = listing.description.toLowerCase().includes(queryLower);
        const matchesTags = listing.tags.some(tag => tag.toLowerCase().includes(queryLower));
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // Filtrer par rayon si l'utilisateur a partagé sa localisation
      if (userLocationObj && filters.radius > 0 && listing.location.coordinates) {
        const distance = calculateDistance(
          userLocationObj.lat,
          userLocationObj.lng,
          listing.location.coordinates.lat,
          listing.location.coordinates.lng
        );
        if (distance > filters.radius) {
          return false;
        }
      }

      return true;
    });

    // Appliquer le tri intelligent par priorité
    return sortListingsByPriority(filtered, userLocationObj, userProfile || null);
  }, [listings, filters, debouncedSearchQuery, userLocationObj, userProfile]);

  useEffect(() => {
    setFilteredListings(filteredListingsMemo);
  }, [filteredListingsMemo]);

  // Handler de refresh mémorisé - OPTIMISÉ
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const location = await getUserLocation();
    if (location) {
      setUserLocationObj(location);
      setUserLocation([location.lng, location.lat]);
      saveUserLocation(location);
    }
    // Recharger les listings avec les filtres actuels
    const searchFilters: SearchFilters = {
      campus: filters.campus !== 'all' ? filters.campus : userProfile?.campus,
      category: filters.category !== 'all' ? filters.category : undefined,
    };
    await fetchListings(searchFilters, true);
    setIsRefreshing(false);
  }, [userProfile, filters.campus, filters.category, fetchListings]);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current || map.current || !userLocation) return;

    const isDarkMode = resolvedTheme === 'dark';
    
    map.current = new (mapboxgl as any).Map({
      container: mapContainer.current,
      style: isDarkMode 
        ? 'mapbox://styles/mapbox/dark-v11' 
        : 'mapbox://styles/mapbox/light-v11',
      center: userLocation,
      zoom: 13,
      attributionControl: false,
      logoPosition: 'bottom-left'
    });

    map.current.addControl(new (mapboxgl as any).NavigationControl(), 'top-right');

    map.current.on('click', () => {
      markers.current.forEach((marker) => {
        const popup = marker.getPopup();
        if (popup?.isOpen()) {
          popup.remove();
        }
      });
    });
    
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

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  // Mettre à jour le marqueur utilisateur lorsque la localisation change
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new mapboxgl.Marker({ color: '#3b82f6' })
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            '<div style="padding: 8px;"><strong>Votre position</strong></div>'
          )
        )
        .addTo(map.current);
    }

    userMarkerRef.current.setLngLat(userLocation);
  }, [userLocation]);

  }, [userLocation, resolvedTheme]);

  // Mettre à jour les marqueurs sur la carte
  useEffect(() => {
    if (!map.current) return;

    // Supprimer les anciens marqueurs
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    // Ajouter les nouveaux marqueurs
    filteredListings.forEach(listing => {
      if (!listing.location.coordinates) return;

      const { lat, lng } = listing.location.coordinates;
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

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

      const priceSection = listing.price !== undefined
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
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({
            offset: [0, -24],
            closeButton: false,
            closeOnClick: false,
            anchor: 'bottom',
            className: 'listing-map-popup',
          }).setHTML(popupContent)
        )
        .addTo(map.current);

      markers.current.set(listing.id, marker);
    });

    // Exposer la fonction globalement pour le popup
    (window as any).selectListing = (id: string) => {
      const listing = filteredListings.find(l => l.id === id);
      if (listing) {
        setSelectedListing(listing);
        navigate(`/listing/${id}`);
      }
    };

    // Ajuster la vue pour montrer tous les marqueurs
    if (filteredListings.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredListings.forEach(listing => {
        if (listing.location.coordinates) {
          bounds.extend([listing.location.coordinates.lng, listing.location.coordinates.lat]);
        }
      });
      if (userLocation) {
        bounds.extend(userLocation);
      }
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: { top: 100, bottom: 100, left: 100, right: 100 },
          maxZoom: 15
        });
      }
    }
  }, [filteredListings, navigate]);

  const categories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'electronics', label: 'Électronique' },
    { value: 'furniture', label: 'Mobilier' },
    { value: 'books', label: 'Livres' },
    { value: 'clothing', label: 'Vêtements' },
    { value: 'services', label: 'Services' },
    { value: 'housing', label: 'Logement' },
    { value: 'jobs', label: 'Emplois' },
    { value: 'events', label: 'Événements' },
  ];

  const campuses = userProfile?.campus 
    ? [{ value: 'all', label: 'Tous les campus' }, { value: userProfile.campus, label: userProfile.campus }]
    : [{ value: 'all', label: 'Tous les campus' }];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col md:flex-row h-screen">
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-background border-r border-border overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl font-bold">Carte interactive</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="h-5 w-5" />
              </Button>
            </div>

            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtres */}
            {(showFilters || !isMobile) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filtres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Campus</label>
                    <Select
                      value={filters.campus}
                      onValueChange={(value) => setFilters({ ...filters, campus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {campuses.map(campus => (
                          <SelectItem key={campus.value} value={campus.value}>
                            {campus.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Catégorie</label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => setFilters({ ...filters, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {userLocation && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Rayon: {filters.radius} km
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={filters.radius}
                        onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Suggestions basées sur les besoins d'autres utilisateurs */}
            {userNeeds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Suggestions du campus
                  </CardTitle>
                  <CardDescription>
                    Besoins d'autres étudiants de {userProfile?.campus || 'votre campus'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {userNeeds.map(need => (
                    <div
                      key={need.id}
                      className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors active:scale-95"
                      onClick={() => {
                        if (need.searchQuery) {
                          setSearchQuery(need.searchQuery);
                        }
                        if (need.category) {
                          setFilters({ ...filters, category: need.category });
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{need.userName}</p>
                          {need.searchQuery && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              Recherche: {need.searchQuery}
                            </p>
                          )}
                          {need.category && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {categories.find(c => c.value === need.category)?.label || need.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Liste des annonces */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">
                  {filteredListings.length} annonce{filteredListings.length > 1 ? 's' : ''} trouvée{filteredListings.length > 1 ? 's' : ''}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <Loader2 className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredListings.slice(0, 10).map(listing => {
                    const isSameCampus = userProfile?.campus && listing.location.campus === userProfile.campus;
                    const isSameCity = listing.location.city === userProfile?.location?.split(',')[0]?.trim();
                    const priorityBadge = isSameCampus ? 'Campus' : isSameCity ? 'Ville' : listing.distance < 5 ? 'Proche' : null;
                    
                    return (
                      <Card
                        key={listing.id}
                        className={`cursor-pointer hover:border-primary transition-colors active:scale-[0.98] ${
                          selectedListing?.id === listing.id ? 'border-primary' : ''
                        }`}
                        onClick={() => {
                          setSelectedListing(listing);
                          navigate(`/listing/${listing.id}`);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            {listing.images[0] && (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-16 h-16 object-cover rounded flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-sm truncate flex-1">{listing.title}</h3>
                                {priorityBadge && (
                                  <Badge variant={isSameCampus ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                                    {priorityBadge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-lg font-bold text-primary mt-1">{listing.price}€</p>
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {listing.location.campus || listing.location.city}
                                </span>
                                {listing.distance < Infinity && (
                                  <span className="text-muted-foreground ml-1">
                                    • {listing.distance.toFixed(1)} km
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carte */}
        <div className="flex-1 relative min-h-[400px] md:min-h-0">
          <div ref={mapContainer} className="w-full h-full" />
          
          {isLoadingLocation && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-10">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Chargement de votre position...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

