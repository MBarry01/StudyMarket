# Système Temps Réel Firestore

## Vue d'ensemble

Le système de mise à jour en temps réel permet de synchroniser automatiquement les données entre Firestore et l'interface utilisateur sans rechargement de page.

## Architecture

### 1. Listener Firestore (`onSnapshot`)

Firestore offre l'API `onSnapshot` qui écoute les changements de documents ou de collections et déclenche automatiquement une callback à chaque modification.

```typescript
import { onSnapshot, doc, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Exemple: Écouter un document spécifique
const unsubscribe = onSnapshot(
  doc(db, 'users', userId),
  (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      // Mettre à jour l'état React
      setUserProfile(data);
    }
  },
  (error) => {
    console.error('Erreur listener:', error);
  }
);

// N'oubliez pas de nettoyer le listener
return () => unsubscribe();
```

### 2. Écouter une collection avec filtres

```typescript
const q = query(
  collection(db, 'verification_requests'),
  where('userId', '==', userId),
  where('status', '==', 'documents_submitted')
);

const unsubscribe = onSnapshot(
  q,
  (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setRequests(requests);
  }
);
```

## Implémentation dans StudyMarket

### 1. AuthContext - Profil utilisateur en temps réel

**Fichier:** `src/contexts/AuthContext.tsx`

```typescript
useEffect(() => {
  let firestoreUnsubscribe: (() => void) | null = null;
  
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    // Nettoyer l'ancien listener si existant
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
      firestoreUnsubscribe = null;
    }
    
    setCurrentUser(user);
    if (user) {
      await createUserProfile(user);
      
      // Écouter les changements du profil en temps réel
      const { onSnapshot, doc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      firestoreUnsubscribe = onSnapshot(
        doc(db, 'users', user.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserProfile(data as User);
          }
        },
        (error) => {
          console.error('Erreur listener Firestore userProfile:', error);
        }
      );
    } else {
      setUserProfile(null);
    }
    setLoading(false);
  });

  return () => {
    unsubscribe();
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }
  };
}, []);
```

**Avantages:**
- Le badge de vérification se met à jour instantanément après approbation admin
- Toutes les pages qui utilisent `userProfile` affichent les changements immédiatement
- Pas de rechargement de page nécessaire

### 2. VerificationService - Statut de vérification en temps réel

**Fichier:** `src/services/verificationService.ts`

```typescript
static subscribeToVerificationStatus(
  userId: string,
  callback: (status: VerificationRequest | null) => void
): Unsubscribe {
  const q = query(
    collection(db, this.COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      // Trier manuellement par date (plus récent en premier)
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return { doc, data };
      }).sort((a, b) => {
        const dateA = a.data.submittedAt?.toDate?.()?.getTime() || a.data.requestedAt?.toDate?.()?.getTime() || 0;
        const dateB = b.data.submittedAt?.toDate?.()?.getTime() || b.data.requestedAt?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      }).map(({ doc, data }) => {
        const status = data.status;
        
        return {
          id: doc.id,
          ...data,
          status: this.mapStatus(status),
          submittedAt: data.submittedAt?.toDate() || data.requestedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
          documents: data.documents?.map((d: any) => ({
            ...d,
            uploadedAt: typeof d.uploadedAt === 'number' 
              ? new Date(d.uploadedAt) 
              : (d.uploadedAt?.toDate?.() || new Date()),
          })) || [],
        } as VerificationRequest;
      });

      // Retourner le plus récent
      callback(docs[0]);
    },
    (error) => {
      console.error('Erreur listener Firestore:', error);
      callback(null);
    }
  );
}
```

**Utilisation:**
```typescript
useEffect(() => {
  if (!currentUser) return;

  const unsubscribe = VerificationService.subscribeToVerificationStatus(
    currentUser.uid,
    (status) => {
      setVerificationStatus(status);
      setLoadingStatus(false);
    }
  );

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, [currentUser]);
```

### 3. VerificationRequestPage - Interface utilisateur

**Fichier:** `src/pages/VerificationRequestPage.tsx`

```typescript
useEffect(() => {
  if (!currentUser) {
    setLoadingStatus(false);
    return;
  }

  // Listener Firestore en temps réel pour mettre à jour le statut automatiquement
  const unsubscribe = VerificationService.subscribeToVerificationStatus(
    currentUser.uid,
    (status) => {
      setVerificationStatus(status);
      setLoadingStatus(false);
    }
  );

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, [currentUser]);
```

**Résultat:**
- Le badge "Documents soumis" → "En revue" → "Vérifié" se met à jour instantanément
- Le message d'alerte change automatiquement
- La timeline de progression se met à jour

### 4. AdminVerificationsPage - Panel admin

**Fichier:** `src/pages/AdminVerificationsPage.tsx`

```typescript
useEffect(() => {
  const unsubscribe = VerificationService.subscribeToAllRequests(
    filter === 'all' ? undefined : filter,
    (data) => {
      setRequests(data);
      setLoading(false);
    }
  );

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, [filter]);
```

**Fonctionnalités:**
- Toutes les demandes s'affichent en temps réel
- Les badges changent automatiquement quand un admin ouvre une demande
- Les filtres s'appliquent instantanément

## Patterns de nettoyage

### Nettoyage automatique dans useEffect

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(/* ... */);
  
  return () => {
    unsubscribe(); // Cleanup automatique
  };
}, [dependencies]);
```

### Nettoyage multiple

```typescript
useEffect(() => {
  let unsubscribes: Array<() => void> = [];
  
  unsubscribes.push(onSnapshot(/* ... */));
  unsubscribes.push(onSnapshot(/* ... */));
  
  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}, []);
```

### Nettoyage conditionnel avec état

```typescript
useEffect(() => {
  let firestoreUnsubscribe: (() => void) | null = null;
  
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    // Nettoyer l'ancien listener
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
      firestoreUnsubscribe = null;
    }
    
    if (user) {
      firestoreUnsubscribe = onSnapshot(/* ... */);
    }
  });

  return () => {
    unsubscribe();
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }
  };
}, []);
```

## Gestion des erreurs

### Erreur réseau

```typescript
onSnapshot(
  doc(db, 'users', userId),
  (snapshot) => {
    // Success
  },
  (error) => {
    console.error('Erreur listener:', error);
    // Retry logic, fallback, etc.
  }
);
```

### Vérification d'existence

```typescript
onSnapshot(
  doc(db, 'users', userId),
  (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      // Traiter les données
    } else {
      // Document n'existe pas
    }
  }
);
```

## Performance et optimisations

### 1. Désactiver temporairement les listeners

```typescript
const [isListening, setIsListening] = useState(true);

useEffect(() => {
  if (!isListening) return;
  
  const unsubscribe = onSnapshot(/* ... */);
  return () => unsubscribe();
}, [isListening]);
```

### 2. Debounce pour les mises à jour fréquentes

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    // Mettre à jour l'état uniquement après un délai
    setData(latestData);
  }, 300);
  
  return () => clearTimeout(timer);
}, [latestData]);
```

### 3. Limiter les documents écoutés

```typescript
// Ne pas écouter toute la collection, filtrer dès la requête
const q = query(
  collection(db, 'messages'),
  where('conversationId', '==', conversationId),
  orderBy('createdAt', 'desc'),
  limit(50) // Limiter à 50 messages
);
```

## Cas d'usage dans StudyMarket

### ✅ Implémenté

1. **Badge de vérification** - Se met à jour instantanément sur toutes les pages
2. **Page de demande utilisateur** - Statut en temps réel
3. **Panel admin vérifications** - Liste des demandes en temps réel
4. **Profil utilisateur** - Données du profil en temps réel

### 🔄 À implémenter (notifications push)

1. **Messages** - Nouveaux messages en temps réel
   ```typescript
   // Dans MessageService
   static subscribeToConversation(
     conversationId: string,
     callback: (messages: Message[]) => void
   ): Unsubscribe {
     const q = query(
       collection(db, 'conversations', conversationId, 'messages'),
       orderBy('createdAt', 'desc'),
       limit(50)
     );
     
     return onSnapshot(q, (snapshot) => {
       const messages = snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
       }));
       callback(messages);
     });
   }
   ```

2. **Commandes** - Changement de statut en temps réel
   ```typescript
   // Dans OrderService
   static subscribeToUserOrders(
     userId: string,
     callback: (orders: Order[]) => void
   ): Unsubscribe {
     const q = query(
       collection(db, 'orders'),
       where('userId', '==', userId),
       orderBy('createdAt', 'desc')
     );
     
     return onSnapshot(q, (snapshot) => {
       const orders = snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
       }));
       callback(orders);
     });
   }
   ```

3. **Signalements** - Nouveaux signalements pour admins
   ```typescript
   // Dans ReportService
   static subscribeToReports(
     callback: (reports: Report[]) => void
   ): Unsubscribe {
     const q = query(
       collection(db, 'reports'),
       where('status', '==', 'pending'),
       orderBy('createdAt', 'desc')
     );
     
     return onSnapshot(q, (snapshot) => {
       const reports = snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
       }));
       callback(reports);
     });
   }
   ```

4. **Paiements Stripe** - Webhooks en temps réel
   ```typescript
   // Dans PayoutService
   static subscribeToPayouts(
     statusFilter?: 'pending' | 'approved' | 'paid',
     callback?: (payouts: Payout[]) => void
   ): Unsubscribe {
     let q;
     
     if (statusFilter) {
       q = query(
         collection(db, 'payouts'),
         where('status', '==', statusFilter),
         orderBy('requestedAt', 'desc')
       );
     } else {
       q = query(
         collection(db, 'payouts'),
         orderBy('requestedAt', 'desc')
       );
     }
     
     return onSnapshot(q, (snapshot) => {
       const payouts = snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
       }));
       callback?.(payouts);
     });
   }
   ```

## Exemple complet: Système de notifications

```typescript
// services/notificationService.ts

export class NotificationService {
  /**
   * Écouter les notifications non lues en temps réel
   */
  static subscribeToUnreadNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];
        
        callback(notifications);
      },
      (error) => {
        console.error('Erreur listener notifications:', error);
      }
    );
  }

  /**
   * Marquer une notification comme lue
   */
  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  }

  /**
   * Créer une nouvelle notification
   */
  static async createNotification(
    userId: string,
    data: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ): Promise<string> {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    
    const notificationData = {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(notificationsRef, notificationData);
    return docRef.id;
  }
}

// components/NotificationBell.tsx

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = NotificationService.subscribeToUnreadNotifications(
      currentUser.uid,
      (notifs) => {
        setNotifications(notifs);
        setUnreadCount(notifs.length);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </Button>
  );
};
```

## Checklist d'implémentation

Pour ajouter un nouveau système temps réel:

- [ ] Créer une méthode `subscribeTo*` dans le service approprié
- [ ] Utiliser `onSnapshot` pour écouter les changements
- [ ] Implémenter la logique de tri/débounce si nécessaire
- [ ] Gérer les erreurs avec une callback d'erreur
- [ ] Nettoyer le listener dans le `return` du `useEffect`
- [ ] Tester avec plusieurs onglets ouverts (synchronisation cross-tab)
- [ ] Gérer les cas où le document n'existe pas
- [ ] Limiter le nombre de documents écoutés si nécessaire
- [ ] Ajouter des logs pour le debugging

## Troubleshooting

### Le listener ne se déclenche pas

1. Vérifier que les règles Firestore permettent la lecture
2. Vérifier que l'utilisateur est authentifié
3. Vérifier les requêtes Firestore dans la console Firebase

### Trop d'appels au listener

1. Ajouter un debounce
2. Limiter avec `limit()`
3. Filtrer plus précisément avec `where()`

### Performance dégradée

1. Réduire le nombre de listeners actifs
2. Utiliser `limit()` pour limiter les documents
3. Indexer les champs utilisés dans `where()` et `orderBy()`

## Ressources

- [Firebase Firestore onSnapshot](https://firebase.google.com/docs/firestore/query-data/listen)
- [React useEffect cleanup](https://react.dev/learn/synchronizing-with-effects#step-3-add-cleanup-if-needed)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

