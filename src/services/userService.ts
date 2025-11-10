import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase';
import { User } from '../types';
import { getUniversityMetadata } from '../constants/universities';

export class UserService {
  
  static async createUser(uid: string, userData: Partial<User>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);

    const sanitizedUserData = Object.fromEntries(
      Object.entries(userData).filter(([, value]) => value !== undefined)
    ) as Partial<User>;

    const metadata = getUniversityMetadata(sanitizedUserData.university || '');
    const campus =
      sanitizedUserData.campus ??
      (metadata.campus ? metadata.campus : 'Campus principal');
    const location =
      sanitizedUserData.location ??
      (metadata.location ? metadata.location : 'Paris, France');
    const locationCoordinates =
      sanitizedUserData.locationCoordinates ??
      metadata.coordinates ??
      null;
    
    const newUser: User = {
      id: uid,
      email: sanitizedUserData.email!,
      displayName: sanitizedUserData.displayName || 'Utilisateur',
      photoURL: sanitizedUserData.photoURL || null,
      phone: null,
      isVerified: false,
      verificationStatus: 'pending',
      university: sanitizedUserData.university || 'Université non spécifiée',
      fieldOfStudy: sanitizedUserData.fieldOfStudy || 'Non spécifié',
      graduationYear: sanitizedUserData.graduationYear || new Date().getFullYear() + 2,
      campus,
      bio: null,
      location,
      locationCoordinates: locationCoordinates || undefined,
      rating: 0,
      reviewCount: 0,
      trustScore: 0,
      co2Saved: 0,
      transactionsCount: 0,
      donationsCount: 0,
      notificationPreferences: {
        email: true,
        push: true,
        sms: false,
        alerts: true,
      },
      createdAt: new Date(),
      lastSeen: new Date(),
    };
    
    // ✅ Fusionner avec TOUTES les données passées (firstName, lastName, otherUniversity, otherFieldOfStudy, etc.)
    await setDoc(userRef, {
      ...newUser,
      ...sanitizedUserData, // Ajouter toutes les données supplémentaires
      id: uid, // S'assurer que l'ID n'est pas écrasé
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });

    // Deduplication côté Firestore: un email ne doit exister qu'une seule fois
    if (newUser.email) {
      await this.deduplicateUsersByEmail(uid, newUser.email);
    }
  }

  // Trouver tous les profils avec le même email et supprimer les doublons (sauf uid courant)
  static async deduplicateUsersByEmail(uid: string, email: string): Promise<void> {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const qUsers = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(qUsers);
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
      if (docSnap.id !== uid) {
        batch.delete(docSnap.ref);
      }
    });
    await batch.commit();
  }
  
  static async getUser(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const data = userDoc.data();
      
      // Gérer les dates qui peuvent être des strings, des Timestamps, ou des objets Date
      let createdAt = new Date();
      let lastSeen = new Date();
      
      if (data.createdAt) {
        if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt);
        } else if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt;
        }
      }
      
      if (data.lastSeen) {
        if (typeof data.lastSeen === 'string') {
          lastSeen = new Date(data.lastSeen);
        } else if (data.lastSeen.toDate && typeof data.lastSeen.toDate === 'function') {
          lastSeen = data.lastSeen.toDate();
        } else if (data.lastSeen instanceof Date) {
          lastSeen = data.lastSeen;
        }
      }
      
      return {
        ...data,
        id: uid,
        createdAt,
        lastSeen,
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
  
  static async updateUser(uid: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    
    // Nettoyer les valeurs undefined
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    ) as Partial<User>;
    
    await updateDoc(userRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    });

    const propagateKeys: (keyof User)[] = [
      'displayName',
      'photoURL',
      'university',
      'campus',
      'isVerified',
      'verificationStatus',
    ];

    if (propagateKeys.some(key => key in cleanUpdates)) {
      await this.propagateProfileToListings(uid, cleanUpdates);
    }
  }
  
  static async updateUserStats(uid: string, stats: {
    reviewCount?: number;
    averageRating?: number;
    transactionsCount?: number;
    co2Saved?: number;
  }): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    
    const updates: any = {};
    
    if (stats.reviewCount !== undefined) {
      updates.reviewCount = stats.reviewCount;
    }
    
    if (stats.averageRating !== undefined) {
      updates.rating = stats.averageRating;
    }
    
    if (stats.transactionsCount !== undefined) {
      updates.transactionsCount = increment(stats.transactionsCount);
    }
    
    if (stats.co2Saved !== undefined) {
      updates.co2Saved = increment(stats.co2Saved);
    }
    
    await updateDoc(userRef, updates);
  }
  
  static async deleteUser(uid: string): Promise<void> {
    const batch = writeBatch(db);
    
    // Supprimer le profil utilisateur
    batch.delete(doc(db, COLLECTIONS.USERS, uid));
    
    // Supprimer les annonces
    const listingsQuery = query(
      collection(db, COLLECTIONS.LISTINGS),
      where('sellerId', '==', uid)
    );
    const listingsSnapshot = await getDocs(listingsQuery);
    listingsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Supprimer les favoris
    const favoritesQuery = query(
      collection(db, COLLECTIONS.FAVORITES),
      where('userId', '==', uid)
    );
    const favoritesSnapshot = await getDocs(favoritesQuery);
    favoritesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Supprimer les avis donnés
    const reviewsQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('reviewerId', '==', uid)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    reviewsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }
  
  static async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef,
        where('displayName', '>=', query),
        where('displayName', '<=', query + '\uf8ff'),
        orderBy('displayName'),
        limit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastSeen: doc.data().lastSeen?.toDate() || new Date(),
      })) as User[];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
  
  static async getUsersByUniversity(university: string, limit: number = 20): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef,
        where('university', '==', university),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastSeen: doc.data().lastSeen?.toDate() || new Date(),
      })) as User[];
    } catch (error) {
      console.error('Error getting users by university:', error);
      return [];
    }
  }

  private static async propagateProfileToListings(
    uid: string,
    updates: Partial<User>
  ): Promise<void> {
    try {
      const listingsRef = collection(db, COLLECTIONS.LISTINGS);
      const q = query(listingsRef, where('sellerId', '==', uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return;
      }

      const batches: ReturnType<typeof writeBatch>[] = [];
      let currentBatch = writeBatch(db);
      let batchCount = 0;

      const prepareListingUpdates = (listingRef: any) => {
        const listingUpdates: Record<string, unknown> = {
          updatedAt: serverTimestamp(),
        };

        if (updates.displayName !== undefined) {
          listingUpdates.sellerName = updates.displayName;
        }
        if (updates.photoURL !== undefined) {
          listingUpdates.sellerAvatar = updates.photoURL;
        }
        if (updates.university !== undefined) {
          listingUpdates.sellerUniversity = updates.university || 'Université non spécifiée';
          listingUpdates['location.university'] = updates.university || null;
        }
        if (updates.campus !== undefined) {
          listingUpdates['location.campus'] = updates.campus || null;
        }
        if (updates.isVerified !== undefined) {
          listingUpdates.sellerVerified = updates.isVerified;
        }
        if (updates.verificationStatus !== undefined) {
          listingUpdates.sellerVerificationStatus = updates.verificationStatus;
        }

        if (Object.keys(listingUpdates).length > 1) {
          currentBatch.update(listingRef, listingUpdates);
          batchCount += 1;
        }
      };

      snapshot.docs.forEach((docSnap) => {
        prepareListingUpdates(docSnap.ref);

        if (batchCount >= 450) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          batchCount = 0;
        }
      });

      if (batchCount > 0) {
        batches.push(currentBatch);
      }

      for (const batch of batches) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error propagating profile updates to listings:', error);
    }
  }
}
