# 📱 Plan d'Implémentation - Système de Notifications Push

## 🎯 Objectif

Implémenter un système complet de notifications push (Firebase Cloud Messaging) pour StudyMarket qui permet aux utilisateurs de recevoir des notifications en temps réel même quand l'application est fermée.

## 📊 Analyse du Système Actuel

### ✅ Ce qui existe déjà
1. **Structure de données `Notification`** dans `src/types/index.ts`
2. **Préférences de notifications** dans Settings
3. **Service de notification toast** dans `src/services/notificationService.ts`
4. **Configuration Firebase** avec `messagingSenderId`
5. **Email notifications** pour les messages

### ❌ Ce qui manque
1. **Firebase Cloud Messaging** pas encore configuré
2. **Service de push notifications** à créer
3. **Permission demandée** pour les notifications navigateur
4. **Gestion des tokens FCM** côté utilisateur
5. **Backend handler** pour envoyer les push

## 🏗️ Architecture Proposée

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│ 1. PushNotificationService                                 │
│    - Demander permission navigateur                         │
│    - Obtenir token FCM                                      │
│    - Sauvegarder token dans Firestore                      │
│    - Écouter les notifications                             │
│    - Afficher les notifications                            │
├─────────────────────────────────────────────────────────────┤
│ 2. Composants UI                                            │
│    - Badge compteur de notifications                       │
│    - Dropdown notifications                                 │
│    - Notifications in-app                                   │
├─────────────────────────────────────────────────────────────┤
│ 3. Service Worker (firebase-messaging-sw.js)                │
│    - Gérer les notifications background                     │
│    - Afficher les notifications hors app                    │
└─────────────────────────────────────────────────────────────┘
                        ↕ WebSocket FCM
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Firestore)                     │
├─────────────────────────────────────────────────────────────┤
│ Collection: user_tokens                                     │
│ {                                                           │
│   userId: string,                                          │
│   fcmToken: string,                                        │
│   deviceType: 'web' | 'mobile',                            │
│   createdAt: Timestamp,                                     │
│   lastActive: Timestamp                                    │
│ }                                                           │
├─────────────────────────────────────────────────────────────┤
│ Collection: notifications                                  │
│ {                                                           │
│   id: string,                                              │
│   userId: string,                                          │
│   type: 'message' | 'listing' | 'system',                  │
│   title: string,                                           │
│   message: string,                                         │
│   read: boolean,                                           │
│   createdAt: Timestamp,                                     │
│   data?: any                                               │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                        ↕ Cloud Functions
┌─────────────────────────────────────────────────────────────┐
│              FIREBASE CLOUD MESSAGING                       │
├─────────────────────────────────────────────────────────────┤
│ - Envoi push via Admin SDK                                 │
│ - Gestion des tokens                                       │
│ - Notifications multicast                                   │
│ - Analytics notifications                                   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Étape 1 : Configuration Firebase Cloud Messaging

### 1.1 Créer le Service Worker pour FCM

Fichier : `public/firebase-messaging-sw.js`

```javascript
// Import Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDXD6WpZoQNLNU0DAqH1wd3q9Q4vthOWv4",
  authDomain: "annonces-app-44d27.firebaseapp.com",
  projectId: "annonces-app-44d27",
  storageBucket: "annonces-app-44d27.firebasestorage.app",
  messagingSenderId: "603697837611",
  appId: "1:603697837611:web:858cf99bb80004d0f25c6e",
  measurementId: "G-35RWYRR568"
});

const messaging = firebase.messaging();

// Gérer les messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en background:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
```

## 🔧 Étape 2 : Service Push Notifications Frontend

### Créer `src/services/pushNotificationService.ts`

Fonctionnalités :
- Demander permission navigateur
- Obtenir et sauvegarder le token FCM
- Écouter les notifications
- Gérer les interactions
- Badge de compteur non lu

## 🎨 Étape 3 : UI de Notifications

### Créer `src/components/ui/NotificationBell.tsx`

Composants :
- Badge de compteur
- Dropdown liste notifications
- Actions (marquer lu, ouvrir, supprimer)
- Animations

### Créer `src/pages/NotificationsPage.tsx`

Page complète :
- Liste toutes les notifications
- Filtres par type
- Actions en masse
- Historique

## 📱 Étape 4 : Intégration dans Header

Ajouter l'icône de notifications dans :
- `src/components/layout/Header.tsx`
- `src/components/layout/HeaderMobile.tsx`

## 🔔 Étape 5 : Types de Notifications

### Catégories à implémenter :

1. **Messages** 📬
   - Nouveau message reçu
   - Message lu
   - Réponse rapide

2. **Annonces** 📝
   - Match avec votre recherche
   - Changement de prix
   - Nouvelle annonce dans votre catégorie

3. **Commandes** 🛒
   - Nouvelle commande
   - Changement de statut
   - Feedback demandé

4. **Vérification** ✅
   - Document approuvé
   - Demande rejetée
   - Badge obtenu

5. **Système** ⚙️
   - Maintenance
   - Mise à jour
   - Sécurité

## 🗄️ Étape 6 : Base de Données Firestore

### Collection : `user_tokens`
```typescript
{
  userId: string;
  fcmToken: string;
  deviceType: 'web' | 'ios' | 'android';
  userAgent: string;
  createdAt: Timestamp;
  lastActive: Timestamp;
  enabled: boolean;
}
```

### Collection : `notifications`
```typescript
{
  id: string;
  userId: string;
  type: 'message' | 'listing' | 'order' | 'verification' | 'system';
  title: string;
  message: string;
  imageUrl?: string;
  data?: {
    url?: string;
    listingId?: string;
    orderId?: string;
    [key: string]: any;
  };
  read: boolean;
  readAt?: Timestamp;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}
```

## ⚙️ Étape 7 : Backend - Cloud Functions (optionnel)

Pour envoyer des notifications programmées :

### `functions/sendPushNotification.ts`
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const sendPushNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(notification.userId)
      .get();
    
    const userData = userDoc.data();
    const tokens = userData?.fcmTokens || [];
    
    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type,
        url: `/notifications/${snap.id}`
      },
      tokens: tokens
    };
    
    try {
      await admin.messaging().sendEachForMulticast(message);
    } catch (error) {
      console.error('Error sending push:', error);
    }
  });
```

## 📋 Checklist d'Implémentation

### Phase 1 : Setup (1-2 heures)
- [ ] Créer `firebase-messaging-sw.js`
- [ ] Configurer FCM dans Firebase Console
- [ ] Installer `firebase/messaging` package
- [ ] Créer service push notifications

### Phase 2 : Frontend (2-3 heures)
- [ ] Service PushNotificationService
- [ ] Composant NotificationBell
- [ ] Page NotificationsPage
- [ ] Intégration dans Headers

### Phase 3 : Backend (1-2 heures)
- [ ] Collection user_tokens
- [ ] Collection notifications
- [ ] Sauvegarder tokens FCM
- [ ] Queries pour notifications

### Phase 4 : Cloud Functions (optionnel, 2-3 heures)
- [ ] Function sendPushNotification
- [ ] Triggers Firestore
- [ ] Gestion des erreurs
- [ ] Analytics

## 🎯 Types de Notifications à Implémenter

1. **Message Nouveau** 📬
   - Quand : Nouveau message dans une conversation
   - Trigger : `onSend` dans useMessageStore
   - Action : Ouvrir conversation

2. **Match Recherche** 🔍
   - Quand : Nouvelle annonce correspond à saved search
   - Trigger : `onListingCreated` + vérification match
   - Action : Ouvrir annonce

3. **Statut Commande** 📦
   - Quand : Commande créée/modifiée
   - Trigger : `onOrderChange` dans orders
   - Action : Ouvrir commande

4. **Vérification Update** ✅
   - Quand : Statut vérification change
   - Trigger : `onVerificationUpdate`
   - Action : Ouvrir profil

## 🔒 Sécurité

- ❌ Ne jamais exposer clés FCM côté client
- ✅ Utiliser Cloud Functions pour l'envoi
- ✅ Valider permissions utilisateur
- ✅ Respecter les préférences de notification
- ✅ Gérer opt-in/opt-out
- ✅ Expiration des tokens

## 📊 Métriques à Suivre

- Taux de permission accordée
- Taux d'ouverture des notifications
- Taux de clic sur les notifications
- Nombre de tokens actifs
- Fréquence d'envoi par type

## 💰 Coûts Estimés

- **Firebase Cloud Messaging** : Gratuit jusqu'à 10M notifications/mois
- **Cloud Functions** : $0.40 pour 1M invocations
- **Firestore** : $0.06/GB stockage
- **Total estimé** : $5-20/mois pour 1000-5000 utilisateurs

---

**Priorité** : High ⭐⭐⭐
**Temps estimé** : 6-10 heures
**Complexité** : Moyenne

**Prochaine étape** : Créer le fichier `firebase-messaging-sw.js` et commencer l'implémentation du service de push.

