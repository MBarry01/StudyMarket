import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc, 
  deleteDoc,
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import toast from 'react-hot-toast';

interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImage?: string;
  listingCategory: string;
  listingTransactionType: string;
  sellerName: string;
  sellerUniversity: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface FavoritesStore {
  favorites: Favorite[];
  userFavoriteIds: Set<string>;
  loading: boolean;
  
  // Actions
  fetchUserFavorites: (userId: string) => Promise<void>;
  addToFavorites: (userId: string, listing: Listing) => Promise<void>;
  removeFromFavorites: (userId: string, listingId: string) => Promise<void>;
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (userId: string, listing: Listing) => Promise<void>;
  clearFavorites: () => void;
}

// Helper function to safely convert dates
const safeToDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (date && typeof date.toDate === 'function') {
    try {
      return date.toDate();
    } catch (error) {
      return new Date();
    }
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }
  if (date && typeof date === 'object' && date.seconds) {
    return new Date(date.seconds * 1000);
  }
  return new Date();
};

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],
  userFavoriteIds: new Set(),
  loading: false,

  fetchUserFavorites: async (userId: string) => {
    if (!userId) return;

    set({ loading: true });

    try {
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(favoritesQuery);
      const favorites: Favorite[] = [];
      const favoriteIds = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const favorite = {
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        } as Favorite;
        
        favorites.push(favorite);
        favoriteIds.add(favorite.listingId);
      });
      
      // No need to sort since we're using orderBy in the query
      
      set({ 
        favorites, 
        userFavoriteIds: favoriteIds,
        loading: false 
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      toast.error('Erreur lors du chargement des favoris');
      set({ loading: false });
    }
  },

  addToFavorites: async (userId: string, listing: Listing) => {
    if (!userId || !listing) return;

    try {
      // Check if already in favorites
      if (get().userFavoriteIds.has(listing.id)) {
        toast.info('Déjà dans vos favoris');
        return;
      }

      const favoriteData = {
        userId,
        listingId: listing.id,
        listingTitle: listing.title,
        listingPrice: listing.price,
        listingImage: listing.images?.[0] || null,
        listingCategory: listing.category,
        listingTransactionType: listing.transactionType,
        sellerName: listing.sellerName,
        sellerUniversity: listing.sellerUniversity,
        notes: '',
        tags: listing.tags || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'favorites'), favoriteData);

      // Update local state
      const newFavorite: Favorite = {
        id: docRef.id,
        ...favoriteData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Favorite;

      const { favorites, userFavoriteIds } = get();
      const newFavoriteIds = new Set(userFavoriteIds);
      newFavoriteIds.add(listing.id);

      set({
        favorites: [newFavorite, ...favorites],
        userFavoriteIds: newFavoriteIds
      });

      // Update listing likes count
      try {
        await updateDoc(doc(db, 'listings', listing.id), {
          likes: (listing.likes || 0) + 1
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour du compteur de likes:', error);
      }

      toast.success('Ajouté aux favoris ❤️');
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      toast.error('Erreur lors de l\'ajout aux favoris');
    }
  },

  removeFromFavorites: async (userId: string, listingId: string) => {
    if (!userId || !listingId) return;

    try {
      // Find the favorite document
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        where('listingId', '==', listingId)
      );
      
      const querySnapshot = await getDocs(favoritesQuery);
      
      if (querySnapshot.empty) {
        toast.info('Pas dans vos favoris');
        return;
      }

      // Delete the favorite document
      const favoriteDoc = querySnapshot.docs[0];
      await deleteDoc(doc(db, 'favorites', favoriteDoc.id));

      // Update local state
      const { favorites, userFavoriteIds } = get();
      const newFavoriteIds = new Set(userFavoriteIds);
      newFavoriteIds.delete(listingId);

      set({
        favorites: favorites.filter(fav => fav.listingId !== listingId),
        userFavoriteIds: newFavoriteIds
      });

      // Update listing likes count
      try {
        const listingRef = doc(db, 'listings', listingId);
        const listingDoc = await getDocs(query(collection(db, 'listings'), where('__name__', '==', listingId)));
        if (!listingDoc.empty) {
          const currentLikes = listingDoc.docs[0].data().likes || 0;
          await updateDoc(listingRef, {
            likes: Math.max(0, currentLikes - 1)
          });
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour du compteur de likes:', error);
      }

      toast.success('Retiré des favoris');
      
    } catch (error) {
      console.error('Erreur lors de la suppression des favoris:', error);
      toast.error('Erreur lors de la suppression des favoris');
    }
  },

  isFavorite: (listingId: string) => {
    return get().userFavoriteIds.has(listingId);
  },

  toggleFavorite: async (userId: string, listing: Listing) => {
    const { isFavorite, addToFavorites, removeFromFavorites } = get();
    
    if (isFavorite(listing.id)) {
      await removeFromFavorites(userId, listing.id);
    } else {
      await addToFavorites(userId, listing);
    }
  },

  clearFavorites: () => {
    set({ 
      favorites: [], 
      userFavoriteIds: new Set(),
      loading: false 
    });
  }
}));