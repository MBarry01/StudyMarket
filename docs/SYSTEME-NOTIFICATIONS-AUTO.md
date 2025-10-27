# 🔔 Système de Notifications Automatiques

## ✅ Système Implémenté

Un système complet de notifications automatiques selon les actions des utilisateurs et admins.

## 📋 Types de Notifications Automatiques

### 💬 Messages
**Trigger** : Nouveau message envoyé
**Service** : `NotificationService.notifyNewMessage()`
**Utilisation** : Dès qu'un utilisateur envoie un message
**Données** : Conversation ID, nom expéditeur, titre annonce

### 📝 Annonces
**Trigger** : Nouvelle annonce correspondant à votre recherche
**Service** : `NotificationService.notifyNewListingMatch()`
**Utilisation** : À implémenter dans la création d'annonces
**Données** : Listing ID, titre, catégorie

### 🛒 Commandes
**Trigger** : Nouvelle commande créée
**Service** : `NotificationService.notifyNewOrder()`
**Utilisation** : Quand un acheteur passe commande
**Données** : Order ID, titre annonce, nom acheteur

**Trigger** : Changement de statut de commande
**Service** : `NotificationService.notifyOrderStatusChange()`
**Utilisation** : Quand le statut change (confirmé, expédié, livré)
**Données** : Order ID, nouveau statut

### ✅ Vérification
**Trigger** : Document approuvé
**Service** : `NotificationService.notifyVerificationApproved()`
**Utilisation** : Quand admin approuve la vérification
**Données** : User ID

**Trigger** : Document rejeté
**Service** : `NotificationService.notifyVerificationRejected()`
**Utilisation** : Quand admin rejette la vérification
**Données** : User ID, raison

**Trigger** : Changement de statut
**Service** : `NotificationService.notifyVerificationStatusChange()`
**Utilisation** : Tout changement de statut
**Données** : User ID, nouveau statut

### ⭐ Avis
**Trigger** : Nouvel avis reçu
**Service** : `NotificationService.notifyNewReview()`
**Utilisation** : Quand quelqu'un laisse un avis
**Données** : Reviewer name, rating

### 🚨 Sécurité
**Trigger** : Rapport de sécurité créé
**Service** : `NotificationService.notifySafetyReport()`
**Utilisation** : Quand un rapport est créé
**Données** : Report type, listing title

### 📢 Système
**Trigger** : Annonce administrative
**Service** : `NotificationService.notifySystemAnnouncement()`
**Utilisation** : Notifications générales
**Données** : Titre, message, URL

### 💰 Paiement
**Trigger** : Paiement reçu
**Service** : `NotificationService.notifyPaymentReceived()`
**Utilisation** : Quand un paiement est confirmé
**Données** : Amount, order ID

### 📉 Changement de Prix
**Trigger** : Réduction de prix
**Service** : `NotificationService.notifyPriceDrop()`
**Utilisation** : Quand un prix baisse
**Données** : Listing ID, nouveaux/ancien prix

### 🎁 Offres Spéciales
**Trigger** : Offre spéciale créée
**Service** : `NotificationService.notifySpecialOffer()`
**Utilisation** : Offres promotionnelles
**Données** : Listing ID, offre

## 🔧 Intégrations Actives

### 1. Messages (✅ IMPLÉMENTÉ)
**Fichier** : `src/stores/useMessageStore.ts`
**Fonction** : `sendMessage()`
**Ligne** : 373-386

Chaque fois qu'un message est envoyé :
1. Email notification (déjà existante)
2. Push notification (nouveau)

### 2. À Implémenter

#### Annonces
- **Fichier** : `src/pages/CreateListingPage.tsx`
- **Après** : Création d'annonce réussie
- **Action** : Notifier les utilisateurs avec saved searches correspondantes

#### Commandes
- **Fichier** : `src/stores/useOrderStore.ts`
- **Après** : Création/Changement de statut
- **Action** : Notifier acheteur et vendeur

#### Vérification
- **Fichier** : `src/services/verificationService.ts`
- **Après** : Changement de statut
- **Action** : Notifier l'utilisateur

#### Avis
- **Fichier** : `src/components/listing/ReviewForm.tsx`
- **Après** : Soumission d'avis
- **Action** : Notifier le vendeur

## 📊 Exemple d'Utilisation

### Créer une notification manuelle

```typescript
import { NotificationService } from '@/services/notificationService';

// Notifier un nouveau message
await NotificationService.notifyNewMessage(
  'userId_du_destinataire',
  'Jean Dupont',
  'MacBook Pro 15"',
  'conversation_id'
);

// Notifier une nouvelle commande
await NotificationService.notifyNewOrder(
  'userId_du_vendeur',
  'order_id_123',
  'MacBook Pro 15"',
  'Marie Martin'
);

// Notifier une vérification approuvée
await NotificationService.notifyVerificationApproved(
  'userId_à_notifier'
);
```

## 🎯 Tests

### Test 1 : Notification de Message

1. **Se connecter** sur http://localhost:5175/StudyMarket/
2. **Aller sur** une annonce
3. **Cliquer** "Contacter le vendeur"
4. **Envoyer** un message
5. **Vérifier** :
   - Notifications : badge +1
   - Dropdown : nouvelle notification
   - Firestore : document créé dans `notifications`

### Test 2 : Vérifier Firestore

1. **Aller sur** : https://console.firebase.google.com
2. **Firestore Database** → Collection `notifications`
3. **Vérifier** qu'un document a été créé avec :
   - `userId` : ID du destinataire
   - `type` : `message`
   - `title` : `💬 Message de...`
   - `read` : `false`

## 🚀 Prochaines Étapes

### Phase 1 : Messages (✅ FAIT)
- ✅ Implémenté dans `useMessageStore`

### Phase 2 : Commander (⏳ À FAIRE)
- [ ] Intégrer dans `useOrderStore`
- [ ] Notifier à la création
- [ ] Notifier au changement de statut

### Phase 3 : Vérification (⏳ À FAIRE)
- [ ] Intégrer dans `verificationService`
- [ ] Notifier à l'approbation
- [ ] Notifier au rejet

### Phase 4 : Annonces (⏳ À FAIRE)
- [ ] Intégrer dans `CreateListingPage`
- [ ] Vérifier saved searches
- [ ] Notifier correspondances

### Phase 5 : Avis (⏳ À FAIRE)
- [ ] Intégrer dans ReviewForm
- [ ] Notifier le vendeur

---

**Status** : ✅ Notifications automatiques pour MESSAGES  
**Prochaine** : Implémenter pour ORDERS et VERIFICATION
