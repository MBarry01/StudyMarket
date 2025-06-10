import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sampleUsers, sampleListings } from '../data/sampleData';
import toast from 'react-hot-toast';

export const populateDatabase = async () => {
  try {
    console.log('🚀 Début du peuplement de la base de données...');
    
    // Add users first
    const userIds: string[] = [];
    for (let i = 0; i < sampleUsers.length; i++) {
      const userData = sampleUsers[i];
      const userId = `user${i + 1}`;
      
      await setDoc(doc(db, 'users', userId), userData);
      userIds.push(userId);
      console.log(`✅ Utilisateur ${userData.displayName} ajouté`);
    }

    // Add listings
    for (let i = 0; i < sampleListings.length; i++) {
      const listingData = sampleListings[i];
      
      // Assign the listing to the correct user
      const userIndex = i % userIds.length;
      const finalListingData = {
        ...listingData,
        sellerId: userIds[userIndex],
      };

      await addDoc(collection(db, 'listings'), finalListingData);
      console.log(`✅ Annonce "${listingData.title}" ajoutée`);
    }

    console.log('🎉 Base de données peuplée avec succès !');
    toast.success('Données d\'exemple ajoutées avec succès !');
    
    // Refresh the page to see the new data
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error);
    toast.error('Erreur lors de l\'ajout des données d\'exemple');
  }
};