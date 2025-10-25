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
  AuthError,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';
import { UserService } from '../services/userService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, additionalData?: Record<string, unknown>) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const createUserProfile = async (user: FirebaseUser, additionalData?: Record<string, unknown>) => {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await UserService.getUser(user.uid);
      
      if (!existingUser) {
        // Créer un nouveau profil et le retourner directement
        const newUserData = {
          email: user.email!,
          displayName: user.displayName || 'Utilisateur',
          photoURL: user.photoURL || null, // ✅ null au lieu de undefined
          university: additionalData?.university as string,
          fieldOfStudy: additionalData?.fieldOfStudy as string,
          graduationYear: additionalData?.graduationYear as number,
          campus: additionalData?.campus as string,
          ...additionalData
        };
        
        await UserService.createUser(user.uid, newUserData);
        
        // Utiliser les données qu'on vient de créer au lieu de refetch
        setUserProfile(newUserData as User);
      } else {
        // Utilisateur existant, utiliser les données récupérées
        setUserProfile(existingUser);
      }
      
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      toast.error('Erreur lors de la création du profil');
    }
  };

  const refreshUserProfile = async () => {
    if (!currentUser) return;
    
    try {
      const userProfile = await UserService.getUser(currentUser.uid);
      setUserProfile(userProfile);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Connexion réussie !');
    } catch (error: unknown) {
      let errorMessage = 'Erreur de connexion';
      
      if (error instanceof Error) {
        const authError = error as AuthError;
        switch (authError.code) {
          case 'auth/user-not-found':
            errorMessage = 'Aucun compte trouvé avec cet email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Mot de passe incorrect';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Format d\'email invalide';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Trop de tentatives. Réessayez plus tard';
            break;
          default:
            errorMessage = authError.message;
        }
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, additionalData?: Record<string, unknown>) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      await createUserProfile(user, additionalData);
      toast.success('Compte créé avec succès !');
    } catch (error: unknown) {
      let errorMessage = 'Erreur lors de la création du compte';
      
      if (error instanceof Error) {
        const authError = error as AuthError;
        switch (authError.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Cet email est déjà utilisé';
            break;
          case 'auth/weak-password':
            errorMessage = 'Le mot de passe est trop faible';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Format d\'email invalide';
            break;
          default:
            errorMessage = authError.message;
        }
      }
      
      toast.error(errorMessage);
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
    } catch (error: unknown) {
      console.error('Google sign in error:', error);
      if (error instanceof Error) {
        toast.error('Erreur de connexion Google : ' + error.message);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      toast.success('Déconnexion réussie !');
    } catch (error: unknown) {
      toast.error('Erreur lors de la déconnexion');
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!currentUser || !userProfile) return;

    try {
      await UserService.updateUser(currentUser.uid, data);
      setUserProfile({ ...userProfile, ...data });
      toast.success('Profil mis à jour !');
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
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
      } catch (error: unknown) {
        console.error('Redirect result error:', error);
        if (error instanceof Error) {
          const authError = error as AuthError;
          if (authError.code !== 'auth/null-user') {
            toast.error('Erreur de connexion Google : ' + authError.message);
          }
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
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};