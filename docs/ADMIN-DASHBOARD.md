# Dashboard Administrateur - StudyMarket

## 📋 Vue d'ensemble

Le dashboard administrateur permet une gestion complète de la plateforme StudyMarket. Il offre des outils pour surveiller l'activité, gérer les utilisateurs, les annonces, les commandes, et effectuer des actions administratives critiques.

## 🔐 Contrôle d'accès

### Configuration des administrateurs

L'accès au dashboard admin est contrôlé par des variables d'environnement dans le fichier `.env` :

```bash
# Emails autorisés (séparés par des virgules)
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com

# UIDs Firebase autorisés (optionnel, séparés par des virgules)
VITE_ADMIN_UIDS=uid1,uid2,uid3
```

### Accès au dashboard

- **URL** : `/admin`
- **Menu** : Lien "Administration" dans le menu déroulant utilisateur (visible uniquement pour les admins)
- **Protection** : Route protégée avec double vérification (authentification + rôle admin)

## 📊 Fonctionnalités

### 1. Overview (Vue d'ensemble)

**Route** : `/admin` ou `/admin/overview`

#### KPIs affichés :
- **Utilisateurs**
  - Total utilisateurs
  - Nouveaux utilisateurs (24h)
- **Annonces**
  - Total annonces
  - Annonces actives
  - Annonces en attente
- **Commandes**
  - Total commandes
  - Commandes en attente
  - Commandes payées
  - Commandes échouées
- **Revenus**
  - Revenus totaux
  - Revenus 24h
  - Taux de conversion

#### Alertes système :
- Liste des alertes critiques (commandes échouées, utilisateurs bloqués, etc.)

### 2. Gestion des commandes

**Route** : `/admin/orders`

#### Fonctionnalités :
- **Filtres**
  - Par statut (all, pending, paid, failed, refunded)
  - Par recherche (ID commande, nom utilisateur)
- **Actions disponibles**
  - 👁️ Voir détails
  - 💰 Remboursement (pour commandes payées)
  - 🔄 Rejouer webhook (pour commandes échouées)
- **Export CSV** de toutes les commandes filtrées

#### Détails d'une commande :
- ID commande
- Statut
- Montant et devise
- Acheteur et vendeur
- Annonce liée
- Stripe Payment Intent ID
- Dates (création, mise à jour)

### 3. Gestion des utilisateurs

**Route** : `/admin/users`

#### Fonctionnalités :
- **Filtres**
  - Par statut (tous, vérifiés, non vérifiés, bloqués)
  - Par recherche (nom, email, université, ID)
- **Actions disponibles**
  - 👁️ Voir profil complet
  - 🛡️ Vérifier l'utilisateur
  - 🔒 Bloquer / 🔓 Débloquer
  - 👤 Changer le rôle
- **Export CSV** de tous les utilisateurs filtrés

#### Détails d'un utilisateur :
- ID, nom, email
- Université
- Statut (vérifié, bloqué)
- Rôle (user, admin, moderator)
- CO₂ économisé
- Nombre de transactions
- Raison du blocage (si bloqué)

### 4. Gestion des annonces

**Route** : `/admin/listings`

#### Fonctionnalités :
- **Filtres**
  - Par statut (all, active, sold, pending, removed, draft)
  - Par recherche (titre, ID, vendeur)
- **Actions disponibles**
  - 👁️ Voir détails
  - ✅ Approuver (si en attente)
  - ❌ Retirer (si active)
  - 🗑️ Supprimer définitivement
- **Export CSV** de toutes les annonces filtrées

#### Détails d'une annonce :
- ID, titre, prix
- Catégorie
- Vendeur
- Nombre de vues
- Nombre d'images
- Statut

### 5. Webhook Logs

**Route** : `/admin/webhooks`

#### Fonctionnalités :
- **Visualisation des logs webhook Stripe**
  - Event type, statut, timestamp
  - Order ID, Payment Intent ID
  - Retry count et processing time
  - Erreurs détaillées
- **Filtres**
  - Par statut (success, failed, pending)
  - Par type d'événement (payment_intent, charge, refund)
  - Par recherche (event, order ID, payment intent)
- **Actions disponibles**
  - 👁️ Voir détails (payload, response)
  - ▶️ Retraiter (pour webhooks échoués)
- **Export CSV** de tous les logs filtrés
- **Stats en temps réel**
  - Total logs
  - Succès / Échecs / En attente

### 6. Gestion des Payouts

**Route** : `/admin/payouts`

#### Fonctionnalités :
- **Visualisation des demandes de payout vendeurs**
  - Vendeur, email, montant
  - Statut (pending, processing, completed, failed)
  - Informations bancaires
- **Filtres**
  - Par statut
  - Par recherche (vendeur, email, ID)
- **Actions disponibles**
  - 👁️ Voir détails complets
  - ✅ Approuver le payout
  - ❌ Rejeter le payout (avec raison)
- **Export CSV** de tous les payouts filtrés
- **Stats financières**
  - Montant total en attente
  - Montant total en traitement
  - Montant total complété
  - Nombre de payouts par statut

### 7. Gestion des Messages

**Route** : `/admin/messages`

#### Fonctionnalités :
- **Visualisation de toutes les conversations**
  - Affichage des conversations entre acheteurs et vendeurs
  - Annonce concernée, participants, nombre de messages
  - Statut (active, blocked, archived)
  - Dernier message envoyé avec timestamp
- **Filtres avancés**
  - Par statut (actives, bloquées, archivées)
  - Par recherche (titre annonce, nom participants, ID conversation)
  - Rafraîchissement manuel des données
- **Actions disponibles**
  - 👁️ **Voir conversation** : Affiche l'historique complet des messages
  - 🚫 **Bloquer conversation** : Empêche l'envoi de nouveaux messages
  - 🔓 **Débloquer conversation** : Réactive la conversation
  - 🗑️ **Supprimer** : Supprime définitivement la conversation et tous les messages
- **Export CSV** avec toutes les informations
- **Stats en temps réel**
  - Total conversations
  - Conversations actives
  - Conversations bloquées
  - Nombre total de messages sur la plateforme

**Collections Firestore utilisées** :
- `conversations` - Données des conversations
- `conversations/{id}/messages` - Sous-collection des messages

---

### 8. Gestion des Signalements (Modération)

**Route** : `/admin/reports`

#### Fonctionnalités :
- **Visualisation de tous les signalements**
  - Qui a signalé qui (avec noms)
  - Raison du signalement (spam, harassment, inappropriate, scam, fake, other)
  - Description détaillée fournie par le reporter
  - Statut (pending, reviewed, resolved, rejected)
  - Dates de création et de traitement
- **Filtres avancés**
  - Par statut
  - Par recherche (raison, description, noms utilisateurs)
  - Rafraîchissement manuel
- **Actions disponibles**
  - 👁️ **Voir détails** : Affiche toutes les informations du signalement
  - ✅ **Traiter le signalement** avec 3 options :
    - **Rejeter** : Aucune violation détectée, signalement non fondé
    - **Avertir** : Enregistre un avertissement pour l'utilisateur signalé
    - **Bloquer** : Bloque l'utilisateur signalé + sa conversation
  - 🗑️ **Supprimer** : Supprime définitivement le signalement
- **Export CSV** de tous les signalements
- **Stats en temps réel**
  - Total signalements
  - En attente de traitement
  - Résolus
  - Rejetés

**Actions automatiques** :
- Lors du blocage d'un utilisateur signalé :
  - ✅ L'utilisateur est marqué comme `blocked: true` dans la collection `users`
  - ✅ La conversation liée est automatiquement bloquée
  - ✅ Le signalement est marqué comme `resolved`

**Collections Firestore utilisées** :
- `reports` - Signalements
- `users` - Pour bloquer l'utilisateur
- `conversations` - Pour bloquer la conversation

---

### 9. Audit Trail

**Route** : `/admin/audit`

#### Fonctionnalités :
- **Journal complet des actions administratives**
  - Qui a fait quoi, quand, et sur quelle entité
  - Traçabilité complète de toutes les opérations
- **Informations trackées**
  - Admin (nom, email)
  - Action effectuée (block, approve, refund, etc.)
  - Entité concernée (user, order, listing, payout, webhook)
  - Timestamp précis
  - Adresse IP et User Agent
  - État avant/après pour certaines actions
- **Filtres avancés**
  - Par type d'action
  - Par type d'entité
  - Par recherche (admin, action, entity)
- **Export CSV** pour analyse externe
- **Stats par entité**
  - Nombre d'actions par type d'entité

## 🔧 Backend API

Les opérations admin nécessitent des endpoints backend :

### Endpoints disponibles :

```typescript
// Blocage utilisateur
POST /api/admin/users/:userId/block
Body: { blocked: boolean, reason?: string }

// Remboursement commande
POST /api/admin/orders/:orderId/refund
Body: { reason?: string }

// Rejouer webhook commande
POST /api/admin/orders/:orderId/replay-webhook
Body: { provider?: 'stripe' }

// Retraiter webhook depuis logs
POST /api/admin/webhooks/:logId/reprocess
Body: { orderId: string, paymentIntentId?: string, event: string }

// Approuver un payout
POST /api/admin/payouts/:payoutId/approve

// Liste des utilisateurs
GET /api/admin/users?limit=100
```

### Configuration backend :

Le serveur backend doit être démarré pour que ces fonctionnalités soient disponibles :

```bash
npm run server
```

## 📈 Export de données

Toutes les sections (Utilisateurs, Annonces, Commandes) permettent l'export CSV avec les colonnes pertinentes pour analyse externe.

## 🎨 Interface utilisateur

- **Design** : Interface moderne avec Tailwind CSS
- **Dark mode** : Support complet du mode sombre
- **Responsive** : Sidebar collapsible sur mobile
- **Accessibilité** : Actions confirmées par des dialogs

## 🚀 Fonctionnalités avancées à implémenter

### Prochaines étapes suggérées :

1. **Statistiques avancées**
   - Graphiques de croissance
   - Analyse des tendances
   - Rapports personnalisables

2. **Modération & Disputes**
   - Gestion des signalements
   - Résolution de litiges
   - Communication avec les utilisateurs

3. **Messages & Support**
   - Chat support intégré
   - Suivi des tickets
   - Réponses automatiques

## 🔒 Sécurité

- **Vérification côté client** : AdminRoute vérifie l'email/UID
- **Vérification backend** : Toutes les API admin doivent vérifier le token Firebase
- **Logs d'audit** : À implémenter pour tracer toutes les actions admin
- **Permissions granulaires** : À implémenter via le champ `role` dans Firestore

## 📝 Notes techniques

### Structure des composants :

```
src/
├── components/
│   └── auth/
│       └── AdminRoute.tsx           # Garde de route admin
├── pages/
│   ├── AdminDashboardPage.tsx       # Layout principal avec sidebar
│   ├── AdminOverview.tsx            # Dashboard KPI
│   ├── AdminOrdersPage.tsx          # Gestion commandes
│   ├── AdminUsersPage.tsx           # Gestion utilisateurs
│   ├── AdminListingsPage.tsx        # Gestion annonces
│   ├── AdminWebhookLogsPage.tsx     # Logs webhook
│   ├── AdminPayoutsPage.tsx         # Gestion payouts
│   └── AdminAuditTrailPage.tsx      # Audit trail
└── App.tsx                           # Routes admin configurées
```

### Dépendances :

- `react-router-dom` : Navigation
- `lucide-react` : Icônes
- `react-hot-toast` : Notifications
- `@/components/ui/*` : Composants shadcn/ui

## 🆘 Support

Pour toute question ou problème :
1. Vérifier que les variables d'environnement sont correctes
2. S'assurer que le serveur backend est démarré
3. Consulter les logs console pour les erreurs
4. Vérifier les permissions Firebase

---

**Dernière mise à jour** : 2025-10-25

