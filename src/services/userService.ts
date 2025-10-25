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

export class UserService {
  
  static async createUser(uid: string, userData: Partial<User>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    
    const newUser: User = {
      id: uid,
      email: userData.email!,
      displayName: userData.displayName || 'Utilisateur',
      photoURL: userData.photoURL || null,
      phone: null,
      isVerified: false,
      verificationStatus: 'pending',
      university: userData.university || 'Université non spécifiée',
      fieldOfStudy: userData.fieldOfStudy || 'Non spécifié',
      graduationYear: userData.graduationYear || new Date().getFullYear() + 2,
      campus: userData.campus || 'Campus principal',
      bio: null,
      location: 'Paris, France',
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
      ...userData, // Ajouter toutes les données supplémentaires
      id: uid, // S'assurer que l'ID n'est pas écrasé
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
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
    );
    
    await updateDoc(userRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    });
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
}
