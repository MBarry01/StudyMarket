// Script de test pour créer une notification de test
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getAuth, onAuthStateChanged } from 'firebase/firestore';
import { getDocs, query, where, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDXD6WpZoQNLNU0DAqH1wd3q9Q4vthOWv4",
  authDomain: "annonces-app-44d27.firebaseapp.com",
  projectId: "annonces-app-44d27",
  storageBucket: "annonces-app-44d27.firebasestorage.app",
  messagingSenderId: "603697837611",
  appId: "1:603697837611:web:858cf99bb80004d0f25c6e",
  measurementId: "G-35RWYRR568"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log('🧪 Script de test notifications push');
console.log('================================\n');

// Attendre que l'utilisateur soit connecté
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.log('❌ Aucun utilisateur connecté');
    console.log('👉 Connectez-vous d\'abord sur http://localhost:5175/StudyMarket/');
    process.exit(1);
  }

  console.log(`✅ Utilisateur connecté: ${user.uid}`);
  console.log(`📧 Email: ${user.email}`);
  console.log('');

  try {
    // Créer une notification de test
    const notificationData = {
      userId: user.uid,
      type: 'system',
      title: '🎉 Notification de test réussie !',
      message: 'Le système de notifications push fonctionne correctement.',
      read: false,
      createdAt: new Date().toISOString(),
      data: {
        url: '/',
        action: 'test'
      }
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log('✅ Notification de test créée !');
    console.log(`📝 ID: ${docRef.id}`);
    console.log('');
    console.log('👉 Retournez sur http://localhost:5175/StudyMarket/');
    console.log('👉 Rechargez la page (F5)');
    console.log('👉 Cliquez sur l\'icône 🔔 dans le header');
    console.log('👉 Vous devriez voir la notification de test');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
});

// Garder le script en vie pendant 5 secondes
setTimeout(() => {
  console.log('\n⏱️ Timeout - Aucun utilisateur connecté');
  process.exit(1);
}, 5000);

