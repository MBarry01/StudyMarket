import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQ",
  authDomain: "annonces-app-44d27.firebaseapp.com",
  projectId: "annonces-app-44d27",
  storageBucket: "annonces-app-44d27.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop",
  measurementId: "G-ABCDEFGHIJ"
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
  REPORTS: 'reports'
} as const;
