import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuration Firebase officielle
const firebaseConfig = {
  apiKey: "AIzaSyDXD6WpZoQNLNU0DAqH1wd3q9Q4vthOWv4",
  authDomain: "annonces-app-44d27.firebaseapp.com",
  projectId: "annonces-app-44d27",
  storageBucket: "annonces-app-44d27.firebasestorage.app",
  messagingSenderId: "603697837611",
  appId: "1:603697837611:web:858cf99bb80004d0f25c6e",
  measurementId: "G-35RWYRR568"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Network management
export const goOnline = () => enableNetwork(db);
export const goOffline = () => disableNetwork(db);

// Configuration Firestore optimisée
export const COLLECTIONS = {
  USERS: 'users',
  LISTINGS: 'listings', 
  REVIEWS: 'reviews',
  FAVORITES: 'favorites',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  REPORTS: 'reports',
  CHAT_HISTORY: 'chatHistory'
} as const;

// Configuration pour l'envoi d'emails
export const emailConfig = {
  // URL de redirection après vérification d'email
  actionCodeSettings: {
    // IMPORTANT: l'app tourne sous /StudyMarket en dev
    url: `${window.location.origin}/StudyMarket/auth`,
    handleCodeInApp: false,
  }
};

// Mode développement - connecter aux émulateurs si nécessaire
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    // connectAuthEmulator(auth, 'http://localhost:9099'); // This line is removed as per the new_code
    // connectFirestoreEmulator(db, 'localhost', 8080); // This line is removed as per the new_code
    // connectStorageEmulator(storage, 'localhost', 9199); // This line is removed as per the new_code
    console.log('🔧 Connecté aux émulateurs Firebase');
  } catch (error) {
    console.log('⚠️ Émulateurs Firebase déjà connectés ou non disponibles');
  }
}

// Configuration globale de l'authentification
auth.useDeviceLanguage();
auth.settings.appVerificationDisabledForTesting = import.meta.env.DEV;