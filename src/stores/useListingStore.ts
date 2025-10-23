import { create } from 'zustand';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing, SearchFilters } from '../types';
import toast from 'react-hot-toast';

interface ListingStore {
  listings: Listing[];
  featuredListings: Listing[];
  currentListing: Listing | null;
  loading: boolean;
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  error: string | null;
  
  // Actions
  fetchListings: (filters?: SearchFilters, refresh?: boolean) => Promise<void>;
  fetchFeaturedListings: () => Promise<void>;
  fetchListingById: (id: string) => Promise<void>;
  createListing: (listing: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateListing: (id: string, updates: Partial<Listing>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  searchListings: (filters: SearchFilters) => Promise<void>;
  clearListings: () => void;
}

// Helper function to clean data before sending to Firestore
const cleanDataForFirestore = (data: any): any => {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (Array.isArray(data)) {
    return data.map(cleanDataForFirestore).filter(item => item !== undefined);
  }
  
  if (typeof data === 'object' && data !== null) {
    const cleaned: any = {};
    Object.keys(data).forEach(key => {
      const value = cleanDataForFirestore(data[key]);
      if (value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
  
  return data;
};

// Helper function to safely convert Firestore timestamps to dates
const safeToDate = (timestamp: any): Date => {
  if (!timestamp) {
    return new Date();
  }
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If it's a Firestore Timestamp with toDate method
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      console.warn('Error converting timestamp:', error);
      return new Date();
    }
  }
  
  // If it's a string or number, try to parse it
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  // If it's an object with seconds (Firestore timestamp format)
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  
  // Fallback to current date
  return new Date();
};

// Helper function to convert Firestore document to Listing
const convertDocToListing = (doc: QueryDocumentSnapshot<DocumentData>): Listing => {
  const data = doc.data();
  
  return {
    id: doc.id,
    ...data,
    createdAt: safeToDate(data.createdAt),
    updatedAt: safeToDate(data.updatedAt),
    // Ensure all required fields have default values
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

export const useListingStore = create<ListingStore>((set, get) => ({
  listings: [],
  featuredListings: [],
  currentListing: null,
  loading: false,
  hasMore: true,
  lastDoc: null,
  error: null,

  fetchListings: async (filters = {}, refresh = false) => {
    const { listings, lastDoc: currentLastDoc } = get();
    
    if (!refresh && !currentLastDoc) return;
    
    set({ loading: true, error: null });

    try {
      // Simple query without complex filtering to avoid index requirements
      let q = query(
        collection(db, 'listings'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      if (!refresh && currentLastDoc) {
        q = query(q, startAfter(currentLastDoc));
      }

      const snapshot = await getDocs(q);
      let newListings = snapshot.docs.map(convertDocToListing);

      // Apply filters client-side to avoid complex Firestore queries
      if (filters.category && filters.category !== 'all') {
        newListings = newListings.filter(listing => listing.category === filters.category);
      }
      
      if (filters.minPrice !== undefined) {
        newListings = newListings.filter(listing => listing.price >= filters.minPrice!);
      }
      
      if (filters.maxPrice !== undefined) {
        newListings = newListings.filter(listing => listing.price <= filters.maxPrice!);
      }

      if (filters.query) {
        const searchTerm = filters.query.toLowerCase();
        newListings = newListings.filter(listing => 
          listing.title.toLowerCase().includes(searchTerm) ||
          listing.description.toLowerCase().includes(searchTerm) ||
          listing.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (filters.condition && filters.condition.length > 0) {
        newListings = newListings.filter(listing => 
          filters.condition!.includes(listing.condition)
        );
      }

      // Sort results
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price-asc':
            newListings.sort((a, b) => a.price - b.price);
            break;
          case 'price-desc':
            newListings.sort((a, b) => b.price - a.price);
            break;
          case 'date':
          default:
            newListings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
        }
      }

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      set({
        listings: refresh ? newListings : [...listings, ...newListings],
        lastDoc: lastVisible,
        hasMore: snapshot.docs.length === 20,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching listings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors du chargement des annonces: ${errorMessage}`);
      set({ loading: false, error: errorMessage });
    }
  },

  fetchFeaturedListings: async () => {
    try {
      console.log('🔍 Fetching featured listings...');
      
      // Very simple query - just get the most recent listings
      const q = query(
        collection(db, 'listings'),
        orderBy('createdAt', 'desc'),
        limit(6)
      );

      const snapshot = await getDocs(q);
      console.log(`📊 Found ${snapshot.docs.length} documents`);
      
      const featuredListings = snapshot.docs.map((doc, index) => {
        try {
          console.log(`🔄 Processing document ${index + 1}:`, doc.id);
          const listing = convertDocToListing(doc);
          console.log(`✅ Successfully converted listing: ${listing.title}`);
          return listing;
        } catch (error) {
          console.error(`❌ Error converting document ${doc.id}:`, error);
          // Return a minimal listing object to prevent crashes
          return {
            id: doc.id,
            title: 'Annonce non disponible',
            description: 'Cette annonce ne peut pas être affichée pour le moment.',
            price: 0,
            currency: 'EUR',
            category: 'electronics' as const,
            condition: 'good' as const,
            images: [],
            tags: [],
            location: {
              city: 'Paris',
              state: 'Île-de-France',
              country: 'France',
              campus: null,
              university: null,
              coordinates: null,
            },
            transactionType: 'sale' as const,
            sellerId: '',
            sellerName: 'Utilisateur',
            sellerAvatar: null,
            sellerUniversity: 'Université non spécifiée',
            sellerVerified: false,
            status: 'active' as const,
            views: 0,
            likes: 0,
            saves: 0,
            reportCount: 0,
            moderationStatus: 'approved' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Listing;
        }
      });

      console.log(`🎉 Successfully processed ${featuredListings.length} featured listings`);
      set({ featuredListings });
    } catch (error) {
      console.error('❌ Error fetching featured listings:', error);
      // Don't show error toast for featured listings as it's not critical
      // Just set empty array so the app continues to work
      set({ featuredListings: [] });
    }
  },

  fetchListingById: async (id: string) => {
    set({ loading: true });
    
    try {
      const docRef = doc(db, 'listings', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const listing = convertDocToListing(docSnap);

        // Increment view count
        await updateDoc(docRef, { views: (listing.views || 0) + 1 });

        set({ currentListing: listing, loading: false });
      } else {
        set({ currentListing: null, loading: false });
        toast.error('Annonce introuvable');
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Erreur lors du chargement de l\'annonce');
      set({ currentListing: null, loading: false });
    }
  },

  createListing: async (listingData) => {
    try {
      // Clean the data to ensure no undefined values
      const cleanedData = cleanDataForFirestore({
        ...listingData,
        views: 0,
        likes: 0,
        saves: 0,
        reportCount: 0,
        moderationStatus: 'approved',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        // Ensure location has all required fields
        location: {
          city: listingData.location?.city || 'Paris',
          state: listingData.location?.state || 'Île-de-France',
          country: listingData.location?.country || 'France',
          campus: listingData.location?.campus || null,
          university: listingData.location?.university || null,
          coordinates: listingData.location?.coordinates || null,
        },
        // Ensure all required fields are present
        currency: listingData.currency || 'EUR',
        images: listingData.images || [],
        tags: listingData.tags || [],
        condition: listingData.condition || 'good',
        transactionType: listingData.transactionType || 'sale',
      });

      console.log('Creating listing with data:', cleanedData);

      const docRef = await addDoc(collection(db, 'listings'), cleanedData);

      toast.success('Annonce créée avec succès !');
      return docRef.id;
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Erreur lors de la création de l\'annonce');
      throw error;
    }
  },

  updateListing: async (id: string, updates: Partial<Listing>) => {
    try {
      const docRef = doc(db, 'listings', id);
      const cleanedUpdates = cleanDataForFirestore({
        ...updates,
        updatedAt: new Date(),
      });

      await updateDoc(docRef, cleanedUpdates);

      // Update local state
      const { listings, currentListing } = get();
      const updatedListings = listings.map(listing =>
        listing.id === id ? { ...listing, ...updates } : listing
      );

      set({
        listings: updatedListings,
        currentListing: currentListing?.id === id 
          ? { ...currentListing, ...updates } 
          : currentListing,
      });

      toast.success('Annonce mise à jour !');
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  },

  deleteListing: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'listings', id));

      // Update local state
      const { listings } = get();
      const updatedListings = listings.filter(listing => listing.id !== id);

      set({ listings: updatedListings });
      toast.success('Annonce supprimée !');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  },

  searchListings: async (filters: SearchFilters) => {
    await get().fetchListings(filters, true);
  },

  clearListings: () => {
    set({ 
      listings: [], 
      lastDoc: null, 
      hasMore: true,
      currentListing: null 
    });
  },
}));