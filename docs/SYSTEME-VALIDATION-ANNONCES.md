# 📋 Système de Validation d'Annonces

## ✅ Fonctionnalités Implémentées

### 1. Création d'annonces en attente de validation

**Fichier modifié** : `src/stores/useListingStore.ts`

- Les annonces sont maintenant créées avec le statut `'pending'` et `moderationStatus: 'pending'`
- Une notification est automatiquement envoyée à l'utilisateur : "⏳ Ton annonce est en cours de vérification"
- Message de succès : "Annonce créée ! En attente de validation"

```typescript
moderationStatus: 'pending', // ⚠️ Changé en pending pour validation
status: 'pending', // ⚠️ Changé en pending pour validation
```

### 2. Filtrage des annonces actives

**Fichier modifié** : `src/stores/useListingStore.ts`

- Les listings publics n'affichent QUE les annonces ayant :
  - `status === 'active'`
  - `moderationStatus === 'approved'`
- Les annonces en attente ne sont visibles que par leur créateur et les admins

```typescript
// ⚠️ IMPORTANT: Only show active listings (approved by admin)
newListings = newListings.filter(
  listing => listing.status === 'active' && listing.moderationStatus === 'approved'
);
```

### 3. Interface Admin pour validation/rejet

**Fichier modifié** : `src/pages/AdminListingsPage.tsx`

#### Nouvelles fonctionnalités :
- **Approuver une annonce** (bouton vert ✅)
  - Change le statut vers `active` et `moderationStatus: 'approved'`
  - Envoie une notification : "✅ Ton annonce a été approuvée !"
- **Refuser une annonce** (bouton rouge ❌)
  - Dialogue avec champ de texte obligatoire pour le motif
  - Change le statut vers `removed` et `moderationStatus: 'removed'`
  - Enregistre le motif de refus dans `rejectionReason`
  - Envoie une notification : "❌ Ton annonce a été refusée" + motif

#### Fonctions ajoutées :
- `handleApproveListing()` - Approuve et envoie notification
- `handleRejectListing()` - Refuse avec motif et envoie notification

### 4. Service de notifications

**Fichier modifié** : `src/services/notificationService.ts`

#### Nouvelles méthodes ajoutées :

```typescript
// Notification : Annonce en attente de validation
notifyListingPending(userId, listingId, listingTitle)

// Notification : Annonce approuvée
notifyListingApproved(userId, listingId, listingTitle)

// Notification : Annonce refusée (avec motif)
notifyListingRejected(userId, listingId, listingTitle, reason)
```

### 5. Types TypeScript mis à jour

**Fichier modifié** : `src/types/index.ts`

- Ajout du statut `'pending'` et `'removed'` dans `status`
- Ajout du champ `rejectionReason?: string` - Motif de refus si l'annonce a été rejetée

```typescript
status: 'draft' | 'pending' | 'active' | 'reserved' | 'sold' | 'completed' | 'paused' | 'removed';
moderationStatus: 'approved' | 'pending' | 'flagged' | 'removed';
rejectionReason?: string; // Motif de refus si l'annonce a été rejetée
```

## 🔄 Flux de Validation d'Annonces

```
1. UTILISATEUR CRÉE UNE ANNONCE
   ↓
   Statut: 'pending'
   ModerationStatus: 'pending'
   Notification: "⏳ Ton annonce est en cours de vérification"
   ↓
2. ANnonce en attente de validation
   ↓
3. ADMIN VALIDE OU REFUSE
   ├─ Approuver ✅
   │   ├─ Statut: 'active'
   │   ├─ ModerationStatus: 'approved'
   │   └─ Notification: "✅ Ton annonce a été approuvée !"
   │
   └─ Refuser ❌
       ├─ Statut: 'removed'
       ├─ ModerationStatus: 'removed'
       ├─ RejectionReason: [motif du refus]
       └─ Notification: "❌ Ton annonce a été refusée" + motif
```

## 📊 États des Annonces

| Statut | ModerationStatus | Visible publiquement ? | Description |
|--------|------------------|------------------------|-------------|
| `pending` | `pending` | ❌ Non | En attente de validation admin |
| `active` | `approved` | ✅ Oui | Approuvée et visible publiquement |
| `removed` | `removed` | ❌ Non | Refusée par l'admin |
| `active` | `flagged` | ⚠️ Non | Signalée, en attente de révision |
| `sold` | `approved` | ✅ Oui | Vendue |
| `draft` | - | ❌ Non | Brouillon |

## 🎯 Fonctionnalités à Ajouter (Optionnelles)

### Prochaines améliorations possibles :

1. **Affichage dans le profil utilisateur** :
   - Section "Mes annonces en attente"
   - Section "Annonces refusées" avec le motif de refus
   - Possibilité de modifier et réenvoyer une annonce refusée

2. **Dashboard admin** :
   - Statistiques : nombre d'annonces en attente
   - Vue d'ensemble rapide des annonces à valider
   - Filtres par université/campus

3. **Prévisualisation avant publication** :
   - Écran de prévisualisation dans CreateListingPage
   - Bouton "Modifier" avant de confirmer la publication

4. **Auto-validation pour vendeurs vérifiés** :
   - Les utilisateurs vérifiés peuvent avoir leurs annonces approuvées automatiquement
   - Option configurable dans le dashboard admin

5. **Email notifications** :
   - Envoyer un email en plus de la notification in-app
   - Template d'email pour approbation/refus

## 🔒 Sécurité

- Les annonces en attente sont **invisibles publiquement**
- Seul le créateur et les admins peuvent voir les annonces `pending`
- Les admins peuvent voir toutes les annonces (y compris supprimées)
- Le motif de refus est loggé pour traçabilité

## 📝 Notes Techniques

- Les notifications sont créées dans la collection `notifications` de Firestore
- Les utilisateurs peuvent consulter leurs notifications dans l'application
- Les notifications persistantes sont stockées jusqu'à lecture manuelle
- Les admins ont accès à l'interface de validation via `/admin/listings`

## 🚀 Déploiement

Aucune migration de base de données nécessaire. Les modifications sont rétrocompatibles avec les annonces existantes qui ont :
- `status: 'active'` 
- `moderationStatus: 'approved'`

Ces annonces continuent de fonctionner normalement.

