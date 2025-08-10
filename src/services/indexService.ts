import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase';

export interface IndexInfo {
  collection: string;
  fields: string[];
  description: string;
  required: boolean;
}

export class IndexService {
  
  // Liste des index Firestore requis pour de bonnes performances
  static readonly REQUIRED_INDEXES: IndexInfo[] = [
    // Index pour les annonces
    {
      collection: COLLECTIONS.LISTINGS,
      fields: ['sellerId', 'createdAt'],
      description: 'Recherche des annonces par vendeur, triées par date',
      required: true
    },
    {
      collection: COLLECTIONS.LISTINGS,
      fields: ['category', 'status', 'createdAt'],
      description: 'Recherche des annonces par catégorie et statut, triées par date',
      required: true
    },
    {
      collection: COLLECTIONS.LISTINGS,
      fields: ['university', 'status', 'createdAt'],
      description: 'Recherche des annonces par université et statut, triées par date',
      required: true
    },
    {
      collection: COLLECTIONS.LISTINGS,
      fields: ['status', 'createdAt'],
      description: 'Recherche des annonces par statut, triées par date',
      required: true
    },
    {
      collection: COLLECTIONS.LISTINGS,
      fields: ['searchTerms', 'createdAt'],
      description: 'Recherche textuelle des annonces, triées par date',
      required: true
    },
    
    // Index pour les avis
    {
      collection: COLLECTIONS.REVIEWS,
      fields: ['revieweeId', 'createdAt'],
      description: 'Recherche des avis reçus par utilisateur, triés par date',
      required: true
    },
    {
      collection: COLLECTIONS.REVIEWS,
      fields: ['reviewerId', 'createdAt'],
      description: 'Recherche des avis donnés par utilisateur, triés par date',
      required: true
    },
    {
      collection: COLLECTIONS.REVIEWS,
      fields: ['listingId', 'createdAt'],
      description: 'Recherche des avis par annonce, triés par date',
      required: true
    },
    
    // Index pour les favoris
    {
      collection: COLLECTIONS.FAVORITES,
      fields: ['userId', 'createdAt'],
      description: 'Recherche des favoris par utilisateur, triés par date',
      required: true
    },
    
    // Index pour les conversations
    {
      collection: COLLECTIONS.CONVERSATIONS,
      fields: ['participants', 'lastMessageAt'],
      description: 'Recherche des conversations par participants, triées par dernier message',
      required: true
    },
    
    // Index pour les messages
    {
      collection: COLLECTIONS.MESSAGES,
      fields: ['conversationId', 'createdAt'],
      description: 'Recherche des messages par conversation, triés par date',
      required: true
    }
  ];
  
  // Vérifier si un index est nécessaire en testant une requête
  static async testIndex(collectionName: string, fields: string[]): Promise<boolean> {
    try {
      const collectionRef = collection(db, collectionName);
      
      // Construire la requête avec les champs spécifiés
      let q = query(collectionRef);
      
      // Ajouter les clauses where et orderBy selon les champs
      if (fields.includes('sellerId')) {
        q = query(q, where('sellerId', '==', 'test'));
      }
      if (fields.includes('category')) {
        q = query(q, where('category', '==', 'test'));
      }
      if (fields.includes('status')) {
        q = query(q, where('status', '==', 'active'));
      }
      if (fields.includes('university')) {
        q = query(q, where('university', '==', 'test'));
      }
      if (fields.includes('searchTerms')) {
        q = query(q, where('searchTerms', 'array-contains', 'test'));
      }
      if (fields.includes('participants')) {
        q = query(q, where('participants', 'array-contains', 'test'));
      }
      if (fields.includes('conversationId')) {
        q = query(q, where('conversationId', '==', 'test'));
      }
      if (fields.includes('revieweeId')) {
        q = query(q, where('revieweeId', '==', 'test'));
      }
      if (fields.includes('reviewerId')) {
        q = query(q, where('reviewerId', '==', 'test'));
      }
      if (fields.includes('listingId')) {
        q = query(q, where('listingId', '==', 'test'));
      }
      if (fields.includes('userId')) {
        q = query(q, where('userId', '==', 'test'));
      }
      
      // Ajouter orderBy si nécessaire
      if (fields.includes('createdAt')) {
        q = query(q, orderBy('createdAt', 'desc'));
      }
      if (fields.includes('lastMessageAt')) {
        q = query(q, orderBy('lastMessageAt', 'desc'));
      }
      
      // Limiter à 1 pour éviter de charger trop de données
      q = query(q, limit(1));
      
      // Tenter d'exécuter la requête
      await getDocs(q);
      return true; // Index existe
      
    } catch (error: any) {
      // Si l'erreur indique qu'un index est manquant
      if (error.code === 'failed-precondition' || error.message.includes('index')) {
        return false; // Index manquant
      }
      // Autre erreur, on considère que l'index existe
      return true;
    }
  }
  
  // Vérifier tous les index requis
  static async checkAllIndexes(): Promise<{
    existing: IndexInfo[];
    missing: IndexInfo[];
  }> {
    const existing: IndexInfo[] = [];
    const missing: IndexInfo[] = [];
    
    for (const indexInfo of this.REQUIRED_INDEXES) {
      const exists = await this.testIndex(indexInfo.collection, indexInfo.fields);
      if (exists) {
        existing.push(indexInfo);
      } else {
        missing.push(indexInfo);
      }
    }
    
    return { existing, missing };
  }
  
  // Générer un rapport des index
  static async generateIndexReport(): Promise<string> {
    const { existing, missing } = await this.checkAllIndexes();
    
    let report = '📊 Rapport des Index Firestore\n';
    report += '================================\n\n';
    
    if (existing.length > 0) {
      report += `✅ Index existants (${existing.length}):\n`;
      existing.forEach(index => {
        report += `  • ${index.collection}: [${index.fields.join(', ')}] - ${index.description}\n`;
      });
      report += '\n';
    }
    
    if (missing.length > 0) {
      report += `❌ Index manquants (${missing.length}):\n`;
      missing.forEach(index => {
        report += `  • ${index.collection}: [${index.fields.join(', ')}] - ${index.description}\n`;
      });
      report += '\n';
      report += '💡 Pour créer ces index, allez dans la Console Firebase > Firestore > Index\n';
      report += '   ou attendez que Firebase les crée automatiquement lors de la première utilisation.\n';
    } else {
      report += '🎉 Tous les index requis sont configurés !\n';
    }
    
    return report;
  }
}
