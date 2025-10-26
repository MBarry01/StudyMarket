# 🔐 Système de Vérification et Certification des Comptes

## 📋 Vue d'ensemble

StudyMarket dispose d'un système robuste de vérification et certification des comptes étudiants pour garantir la sécurité et la confiance sur la plateforme.

---

## 🎯 Types de Vérification

### 1. **Vérification Email** ✅ (Implémentée)

**Statut** : ✅ Opérationnel

**Processus** :
1. L'utilisateur s'inscrit avec son email universitaire
2. Un email de vérification est envoyé automatiquement
3. L'utilisateur clique sur le lien de vérification
4. Le compte est automatiquement vérifié et l'utilisateur connecté
5. Le profil est marqué `emailVerified: true` dans Firestore

**Fichiers clés** :
- `src/pages/AuthPage.tsx` : Inscription et envoi email
- `src/pages/EmailVerificationHandler.tsx` : Traitement du lien de vérification
- `src/lib/firebase.ts` : Configuration Firebase email

**Champs Firestore** :
```typescript
{
  emailVerified: boolean,
  profileCompleted: boolean,
  email: string
}
```

### 2. **Vérification Étudiant** 🚧 (Partiellement implémentée)

**Statut** : 🚧 Structure prête, UI manquante

**Champs TypeScript** :
```typescript
interface User {
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  university: string;
  studentId?: string;
  graduationYear?: number;
  fieldOfStudy?: string;
  campus?: string;
}
```

**Champs manquants** :
- UI pour demander la vérification
- Document upload (carte étudiante, certificat d'inscription)
- Processus d'approbation admin
- Badge "Vérifié" affiché sur le profil

### 3. **Certification Vendeur** 🚧 (Partiellement implémentée)

**Statut** : 🚧 Champ existe, logique manquante

**Champs TypeScript** :
```typescript
interface Listing {
  sellerVerified: boolean;
}
```

**Fonctionnalités nécessaires** :
- Processus de certification pour vendre sur la plateforme
- Critères de certification (nombre de ventes, rating, etc.)
- Badge "Vendeur certifié"
- Priorité dans les résultats de recherche

---

## 🏗️ Structure Actuelle

### Types de Données

```typescript
// src/types/index.ts

export interface User {
  // Student verification
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  university: string;
  studentId?: string;
  graduationYear?: number;
  fieldOfStudy?: string;
  campus?: string;
}

export interface Listing {
  sellerVerified: boolean;
}

export interface SearchFilters {
  verifiedOnly?: boolean;
}
```

### States de Vérification

1. **`pending`** : Demande en attente
2. **`verified`** : Compte vérifié
3. **`rejected`** : Demande rejetée

---

## 🚀 Plan d'Implémentation

### Phase 1 : Interface Utilisateur de Vérification

#### 1.1 Page de Demande de Vérification

**Fichier** : `src/pages/VerificationRequestPage.tsx`

**Fonctionnalités** :
- Formulaire avec upload de documents
- Liste des documents acceptés
- Statut de la demande en temps réel
- Historique des tentatives

**Documents acceptés** :
- Carte étudiante
- Certificat d'inscription
- Relevé de notes officiel
- Carte d'identité (en complément)

#### 1.2 Badge de Vérification

**Fichier** : `src/components/ui/VerificationBadge.tsx`

**Affichage** :
- Badge vérifié sur le profil
- Badge sur les annonces du vendeur
- Icône dans les résultats de recherche

#### 1.3 Section Profil

**Mise à jour** : `src/pages/ProfilePage.tsx`

**Ajout de** :
- Statut de vérification visible
- Bouton "Demander la vérification"
- Indicateur de progression
- Date de vérification

### Phase 2 : Processus Administrateur

#### 2.1 Dashboard Admin - Section Vérifications

**Fichier** : `src/pages/AdminVerificationsPage.tsx`

**Fonctionnalités** :
- Liste des demandes en attente
- Visualisation des documents
- Actions : Approuver / Rejeter
- Commentaires admin
- Historique complet

**Filtres** :
- Statut : pending / verified / rejected
- Université
- Date de demande
- Recherche par nom/email

#### 2.2 Notifications

**Fichier** : `src/services/notificationService.ts`

**Notifications à envoyer** :
- Demande reçue (admin)
- Demande approuvée (utilisateur)
- Demande rejetée (utilisateur)
- Documents manquants (utilisateur)

### Phase 3 : Logique Backend

#### 3.1 Service de Vérification

**Fichier** : `src/services/verificationService.ts`

**Méthodes** :
```typescript
class VerificationService {
  // Demander la vérification
  async requestVerification(userId: string, documents: Document[]): Promise<void>
  
  // Approuver une demande
  async approveVerification(requestId: string, adminId: string): Promise<void>
  
  // Rejeter une demande
  async rejectVerification(requestId: string, reason: string, adminId: string): Promise<void>
  
  // Obtenir le statut de vérification
  async getVerificationStatus(userId: string): Promise<VerificationStatus>
  
  // Obtenir l'historique
  async getVerificationHistory(userId: string): Promise<VerificationHistory[]>
}
```

#### 3.2 Collection Firestore

**Collection** : `verification_requests`

**Structure** :
```typescript
interface VerificationRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  university: string;
  studentId?: string;
  documents: {
    type: string;
    url: string;
    uploadedAt: Date;
  }[];
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  comments?: string;
}
```

### Phase 4 : Intégration et Expérience Utilisateur

#### 4.1 Filtres de Recherche

**Mise à jour** : `src/pages/ListingsPage.tsx`

**Ajout** :
- Checkbox "Utilisateurs vérifiés uniquement"
- Badge de vérification visible
- Priorité dans les résultats

#### 4.2 Fonctionnalités Premium

**Bonus pour utilisateurs vérifiés** :
- Annonces gratuites
- Badge spécial
- Priorité dans les résultats
- Accès anticipé aux nouvelles fonctionnalités

#### 4.3 Sécurité

**Restrictions pour non-vérifiés** :
- Limite d'annonces (ex: 3 max)
- Ventes limitées à un montant max
- Aucune annonce sur les paiements Stripe

---

## 📊 État Actuel vs Objectif

| Fonctionnalité | État Actuel | Objectif |
|----------------|-------------|----------|
| Vérification email | ✅ Implémentée | ✅ Maintenu |
| Vérification étudiant | 🚧 Champs seulement | ✅ UI + Backend |
| Certification vendeur | 🚧 Champ seulement | ✅ Logique complète |
| Dashboard admin | ❌ Manquant | ✅ Nouvelle page |
| Badge utilisateur | ❌ Manquant | ✅ Composant |
| Filtres recherche | ✅ Champ existe | ✅ Checkbox |
| Upload documents | ❌ Manquant | ✅ Interface |
| Notifications | ❌ Manquant | ✅ Service |

---

## 🎯 Priorités d'Implémentation

### Priorité 1 (Critique)
1. ✅ Documenter le système actuel
2. Page de demande de vérification (`VerificationRequestPage.tsx`)
3. Badge de vérification (`VerificationBadge.tsx`)
4. Collection Firestore `verification_requests`

### Priorité 2 (Important)
5. Dashboard admin vérifications (`AdminVerificationsPage.tsx`)
6. Service de vérification (`verificationService.ts`)
7. Upload de documents
8. Notifications

### Priorité 3 (Améliorations)
9. Certification vendeur automatique
10. Filtres de recherche améliorés
11. Statistiques et analytics
12. Programme de fidélité pour vérifiés

---

## 🔐 Sécurité et Modération

### Documents Acceptés
- Carte étudiante photo
- Certificat d'inscription officiel
- Carte d'identité (en complément)
- Relevé de notes (si nécessaire)

### Vérification Documents
- Validation admin obligatoire
- Anti-fraude par similarity matching
- Expiration après X années

### Revocation
- Si compte signalé
- Si documents expirés
- Si fraude détectée

---

## 📈 Métriques et KPIs

### À suivre
- Taux de vérification (demandes vs approuvées)
- Temps moyen de traitement
- Taux de rejet
- Documents les plus utilisés
- Université avec le plus de vérifications

### Dashboard Admin
- Nombre total vérifiés
- Demandes en attente (24h/7j)
- Taux de conversion
- Documents rejetés (motifs)

---

## 🧪 Tests

### Scénarios à tester
1. Inscription et demande de vérification
2. Upload de documents valides
3. Approuver une demande (admin)
4. Rejeter une demande avec motif
5. Afficher badge vérifié
6. Filtrer par "vérifiés uniquement"
7. Expiration de documents
8. Notification de statut

---

## 📝 Notes de Développement

### Technologies
- **React** : Composants UI
- **Firebase Storage** : Upload de documents
- **Firestore** : Base de données
- **TypeScript** : Types et interfaces
- **React Hook Form** : Formulaires
- **Zod** : Validation

### Composants existants à réutiliser
- `Button` : Actions
- `Card` : Affichage documents
- `Dialog` : Modal approbation
- `Badge` : Badge vérifié
- `Alert` : Notifications
- `Input` : Champs formulaire

---

## 🎉 Résultat Final

Un système complet de vérification qui :
- ✅ Protège la communauté contre la fraude
- ✅ Garantit que seuls les étudiants réels utilisent la plateforme
- ✅ Crée de la confiance entre utilisateurs
- ✅ Offre des avantages aux membres vérifiés
- ✅ Permet un contrôle qualité par les admins

---

**Prochaines étapes** : Implémenter la Phase 1 (Interface utilisateur)

