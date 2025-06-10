import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithRedirect,
  GoogleAuthProvider,
  getRedirectResult,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, additionalData?: any) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to safely convert Firestore timestamps to JavaScript dates
const safeToDate = (value: any): Date => {
  if (!value) return new Date();
  
  // If it's already a Date object, return it
  if (value instanceof Date) return value;
  
  // If it's a Firestore Timestamp, convert it
  if (value && typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch (error) {
      console.warn('Error converting Firestore timestamp:', error);
      return new Date();
    }
  }
  
  // If it's a string or number, try to parse it
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  // If it's an object with seconds (Firestore timestamp format)
  if (value && typeof value === 'object' && value.seconds) {
    return new Date(value.seconds * 1000);
  }
  
  // Fallback to current date
  return new Date();
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const createUserProfile = async (user: FirebaseUser, additionalData?: any) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const userData: User = {
        id: user.uid,
        email: user.email!,
        displayName: user.displayName || 'Utilisateur',
        photoURL: user.photoURL || null,
        phone: null,
        isVerified: false,
        verificationStatus: 'pending',
        university: additionalData?.university || 'Université non spécifiée',
        studentId: null,
        graduationYear: additionalData?.graduationYear || new Date().getFullYear() + 2,
        fieldOfStudy: additionalData?.fieldOfStudy || 'Non spécifié',
        campus: additionalData?.campus || 'Campus principal',
        bio: null,
        rating: 0,
        reviewCount: 0,
        trustScore: 0,
        co2Saved: 0,
        transactionsCount: 0,
        donationsCount: 0,
        location: 'Paris, France',
        notificationPreferences: {
          email: true,
          push: true,
          sms: false,
          alerts: true,
        },
        createdAt: new Date(),
        lastSeen: new Date(),
      };

      await setDoc(userRef, userData);
      setUserProfile(userData);
    } else {
      const existingData = userSnap.data() as User;
      // Ensure all required fields are present and convert Firestore timestamps to Date objects
      const completeUserData: User = {
        ...existingData,
        id: user.uid,
        email: user.email!,
        displayName: existingData.displayName || user.displayName || 'Utilisateur',
        photoURL: existingData.photoURL || user.photoURL || null,
        phone: existingData.phone || null,
        isVerified: existingData.isVerified || false,
        verificationStatus: existingData.verificationStatus || 'pending',
        university: existingData.university || 'Université non spécifiée',
        studentId: existingData.studentId || null,
        graduationYear: existingData.graduationYear || new Date().getFullYear() + 2,
        fieldOfStudy: existingData.fieldOfStudy || 'Non spécifié',
        campus: existingData.campus || 'Campus principal',
        bio: existingData.bio || null,
        rating: existingData.rating || 0,
        reviewCount: existingData.reviewCount || 0,
        trustScore: existingData.trustScore || 0,
        co2Saved: existingData.co2Saved || 0,
        transactionsCount: existingData.transactionsCount || 0,
        donationsCount: existingData.donationsCount || 0,
        location: existingData.location || 'Paris, France',
        notificationPreferences: existingData.notificationPreferences || {
          email: true,
          push: true,
          sms: false,
          alerts: true,
        },
        createdAt: safeToDate(existingData.createdAt),
        lastSeen: safeToDate(existingData.lastSeen),
      };
      
      // Update the document with complete data
      await setDoc(userRef, completeUserData);
      setUserProfile(completeUserData);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Connexion réussie !');
    } catch (error: any) {
      toast.error('Erreur de connexion : ' + error.message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, additionalData?: any) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      await createUserProfile(user, additionalData);
      toast.success('Compte créé avec succès !');
    } catch (error: any) {
      toast.error('Erreur lors de la création du compte : ' + error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Configure the provider for better compatibility
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      await signInWithRedirect(auth, provider);
      // Note: The redirect result will be handled in the useEffect below
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error('Erreur de connexion Google : ' + error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      toast.success('Déconnexion réussie !');
    } catch (error: any) {
      toast.error('Erreur lors de la déconnexion');
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!currentUser || !userProfile) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updateData = { ...data, updatedAt: new Date() };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });
      
      await updateDoc(userRef, updateData);
      setUserProfile({ ...userProfile, ...data });
      toast.success('Profil mis à jour !');
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour du profil');
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await createUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Handle Google Sign-In redirect result
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await createUserProfile(result.user);
          toast.success('Connexion Google réussie !');
        }
      } catch (error: any) {
        console.error('Redirect result error:', error);
        if (error.code !== 'auth/null-user') {
          toast.error('Erreur de connexion Google : ' + error.message);
        }
      }
    };

    handleRedirectResult();

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};