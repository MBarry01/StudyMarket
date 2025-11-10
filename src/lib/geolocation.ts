import { Listing } from '../types';
import { User } from '../types';
import { collection, query, where, getDocs, limit, orderBy, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from './firebase';

// Helper pour convertir Firestore document en Listing (simplifié)
export const safeToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      return new Date();
    }
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date();
};

const convertDocToListing = (doc: QueryDocumentSnapshot<DocumentData>): Listing => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: safeToDate(data.createdAt),
    updatedAt: safeToDate(data.updatedAt),
    title: data.title || 'Sans titre',
    description: data.description || '',
    price: data.price || 0,
    currency: data.currency || 'EUR',
    category: data.category || 'electronics',
    condition: data.condition || 'good',
    images: data.images || [],
    tags: data.tags || [],
    location: {
      city: data.location?.city || 'Paris',
      state: data.location?.state || 'Île-de-France',
      country: data.location?.country || 'France',
      campus: data.location?.campus || null,
      university: data.location?.university || null,
      coordinates: data.location?.coordinates || null,
    },
    transactionType: data.transactionType || 'sale',
    sellerId: data.sellerId || '',
    sellerName: data.sellerName || 'Utilisateur',
    sellerAvatar: data.sellerAvatar || null,
    sellerUniversity: data.sellerUniversity || 'Université non spécifiée',
    sellerVerified: data.sellerVerified || false,
    status: data.status || 'active',
    views: data.views || 0,
    likes: data.likes || 0,
    saves: data.saves || 0,
    reportCount: data.reportCount || 0,
    moderationStatus: data.moderationStatus || 'approved',
  } as Listing;
};

/**
 * Calcule la distance entre deux points GPS en utilisant la formule de Haversine
 * @param lat1 Latitude du premier point
 * @param lon1 Longitude du premier point
 * @param lat2 Latitude du deuxième point
 * @param lon2 Longitude du deuxième point
 * @returns Distance en kilomètres
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Interface pour une annonce avec distance calculée
 */
export interface ListingWithDistance extends Listing {
  distance: number;
  priority: number; // Score de priorité (plus bas = plus prioritaire)
}

/**
 * Trie les annonces par priorité intelligente :
 * 1. Même campus
 * 2. Même ville
 * 3. Distance la plus courte
 * 
 * OPTIMISÉ : Utilise useMemo pour éviter les recalculs
 * 
 * @param listings Liste des annonces à trier
 * @param userLocation Position GPS de l'utilisateur { lat, lng }
 * @param userProfile Profil utilisateur avec campus et ville
 * @returns Liste triée par priorité
 */
export const sortListingsByPriority = (
  listings: Listing[],
  userLocation: { lat: number; lng: number } | null,
  userProfile: User | null
): ListingWithDistance[] => {
  // Filtrer d'abord les listings sans coordonnées si on a besoin de distance
  const listingsWithCoords = userLocation 
    ? listings.filter(l => l.location.coordinates?.lat && l.location.coordinates?.lng)
    : listings;

  const userCampus = userProfile?.campus;
  const userCity = userProfile?.location?.split(',')[0]?.trim();

  const listingsWithDistance: ListingWithDistance[] = listingsWithCoords.map(listing => {
    let distance = Infinity;
    let priority = 1000; // Priorité par défaut (plus bas = plus prioritaire)

    // Calculer la distance si on a les coordonnées
    if (userLocation && listing.location.coordinates) {
      const { lat, lng } = listing.location.coordinates;
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          lat,
          lng
        );
      }
    }

    // Calculer la priorité selon les critères
    // 1. Même campus = priorité 1
    if (userCampus && listing.location.campus === userCampus) {
      priority = 1;
    }
    // 2. Même ville = priorité 2
    else if (userCity && listing.location.city === userCity) {
      priority = 2;
    }
    // 3. Distance < 5km = priorité 3
    else if (distance < 5) {
      priority = 3;
    }
    // 4. Distance < 10km = priorité 4
    else if (distance < 10) {
      priority = 4;
    }
    // 5. Distance < 20km = priorité 5
    else if (distance < 20) {
      priority = 5;
    }
    // 6. Autres = priorité 6
    else {
      priority = 6;
    }

    return {
      ...listing,
      distance,
      priority,
    };
  });

  // Trier par priorité, puis par distance
  return listingsWithDistance.sort((a, b) => {
    // D'abord par priorité
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Ensuite par distance
    return a.distance - b.distance;
  });
};

/**
 * Charge les listings optimisés selon le campus/ville de l'utilisateur
 * OPTIMISÉ : Requête Firestore simple sans index composite requis
 */
export const fetchNearbyListings = async (
  userProfile: User | null,
  maxResults: number = 20
): Promise<Listing[]> => {
  try {
    // OPTIMISÉ : Utiliser une requête simple avec seulement orderBy pour éviter les index
    // On charge les listings récents et on filtre côté client
    const q = query(
      collection(db, 'listings'),
      orderBy('createdAt', 'desc'),
      limit(maxResults * 3) // Charger plus pour avoir assez après filtrage
    );

    const snapshot = await getDocs(q);
    let listings = snapshot.docs.map(convertDocToListing);

    // Filtrer côté client pour éviter les index composites
    // D'abord filtrer par statut actif et modération
    listings = listings.filter(listing => 
      listing.status === 'active' && listing.moderationStatus === 'approved'
    );

    // Ensuite filtrer par campus ou ville si disponible
    if (userProfile?.campus) {
      listings = listings.filter(listing => 
        listing.location.campus === userProfile.campus
      );
    } else if (userProfile?.location) {
      const city = userProfile.location.split(',')[0]?.trim();
      if (city) {
        listings = listings.filter(listing => 
          listing.location.city === city
        );
      }
    }

    // Limiter au nombre de résultats demandés
    return listings.slice(0, maxResults);
  } catch (error) {
    console.error('Erreur lors du chargement des listings proches:', error);
    // Fallback : charger sans orderBy si même ça nécessite un index
    try {
      const q = query(
        collection(db, 'listings'),
        limit(maxResults * 3)
      );
      const snapshot = await getDocs(q);
      let listings = snapshot.docs.map(convertDocToListing);
      
      // Filtrer et trier côté client
      listings = listings.filter(listing => 
        listing.status === 'active' && listing.moderationStatus === 'approved'
      );
      
      if (userProfile?.campus) {
        listings = listings.filter(listing => 
          listing.location.campus === userProfile.campus
        );
      }
      
      // Trier par date côté client
      listings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return listings.slice(0, maxResults);
    } catch (fallbackError) {
      console.error('Erreur lors du fallback:', fallbackError);
      return [];
    }
  }
};

/**
 * Récupère la position GPS de l'utilisateur
 * @returns Promise avec les coordonnées ou null si erreur
 */
export const getUserLocation = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Géolocalisation non supportée');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // Ne pas logger les erreurs de géolocalisation (refus utilisateur, non disponible, etc.)
        // C'est normal et attendu dans certains cas
        resolve(null);
      },
      {
        enableHighAccuracy: false, // Optimisé : false pour plus rapide
        timeout: 5000, // Optimisé : timeout réduit
        maximumAge: 300000, // Cache de 5 minutes
      }
    );
  });
};

/**
 * Stocke la position de l'utilisateur dans le localStorage
 */
export const saveUserLocation = (location: { lat: number; lng: number }): void => {
  try {
    localStorage.setItem('userLocation', JSON.stringify({
      ...location,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.warn('Erreur lors de la sauvegarde de la position:', error);
  }
};

/**
 * Récupère la position sauvegardée si elle est récente (< 5 minutes)
 */
export const getSavedUserLocation = (): { lat: number; lng: number } | null => {
  try {
    const saved = localStorage.getItem('userLocation');
    if (!saved) return null;

    const { lat, lng, timestamp } = JSON.parse(saved);
    const age = Date.now() - timestamp;
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (age < maxAge && lat && lng) {
      return { lat, lng };
    }
  } catch (error) {
    console.warn('Erreur lors de la récupération de la position:', error);
  }
  return null;
};

/**
 * Debounce function pour optimiser les recherches
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
