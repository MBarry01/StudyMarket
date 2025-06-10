import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Note: Replace with your actual Firebase config
   apiKey: "AIzaSyDXD6WpZoQNLNU0DAqH1wd3q9Q4vthOWv4",
  authDomain: "annonces-app-44d27.firebaseapp.com",
  projectId: "annonces-app-44d27",
  storageBucket: "annonces-app-44d27.firebasestorage.app",
  messagingSenderId: "603697837611",
  appId: "1:603697837611:web:858cf99bb80004d0f25c6e",
  measurementId: "G-35RWYRR568"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);