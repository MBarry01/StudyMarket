# 🗺️ Schéma des Connexions - StudyMarket

## 📊 Architecture Globale

```
┌────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Pages   │  │Components│  │  Stores  │  │ Contexts │      │
│  │  (25+)   │──│  (50+)   │──│ (Zustand)│──│  (Auth)  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│       │             │              │              │            │
│       └─────────────┴──────────────┴──────────────┘            │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Backend    │  │   Firebase   │  │    Stripe    │
│  (Express)   │  │  (Firestore) │  │     API      │
│   Port 3001  │  │   + Auth     │  │  + Webhooks  │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🔄 Flux de Données Complets

### 1. **Flux Paiement**

```
┌──────────────────────────────────────────────────────────────┐
│                    FLUX PAIEMENT COMPLET                      │
└──────────────────────────────────────────────────────────────┘

USER ACTION
    │
    ├─► ListingDetailPage
    │       │
    │       ├─► QuickPaymentButton
    │       │       │
    │       │       └─► onClick: handleCreateOrder()
    │       │               │
    │       │               └─► POST /api/orders
    │       │                       │
    │       │                       └─► Firestore: orders (status: pending)
    │       │
    │       └─► PaymentMethodSelectorModal (s'ouvre)
    │               │
    │               └─► User sélectionne "Carte Bancaire"
    │                       │
    │                       └─► POST /api/create-payment-intent
    │                               │
    │                               └─► Stripe.paymentIntents.create()
    │
    ├─► StripePaymentForm (s'affiche)
    │       │
    │       ├─► Affiche récapitulatif:
    │       │   - Sous-total: XX,XX €
    │       │   - Frais service (5%): X,XX €
    │       │   - Frais traitement: 0,25 €
    │       │   - TOTAL: XX,XX €
    │       │
    │       └─► User entre carte et paie
    │               │
    │               └─► stripe.confirmCardPayment()
    │
    ├─► Stripe traite le paiement
    │       │
    │       └─► POST /api/webhook/stripe
    │               │
    │               ├─► Firestore: orders (status: paid)
    │               │
    │               └─► Firestore: listings (status: sold)
    │
    └─► PaymentSuccessPage
            │
            ├─► Poll status (GET /api/orders/:id/status)
            │
            └─► ✅ Affiche confirmation

COLLECTIONS TOUCHÉES:
- orders (create, update)
- listings (update)
- webhook_logs (create)
```

---

### 2. **Flux Messaging**

```
┌──────────────────────────────────────────────────────────────┐
│                   FLUX MESSAGING COMPLET                      │
└──────────────────────────────────────────────────────────────┘

USER ACTION
    │
    ├─► ListingDetailPage
    │       │
    │       └─► ContactButton
    │               │
    │               ├─► onClick: handleContact()
    │               │       │
    │               │       └─► Vérifie si conversation existe
    │               │               │
    │               │               ├─► OUI → Navigate('/messages')
    │               │               │
    │               │               └─► NON → Modal s'ouvre
    │               │                       │
    │               │                       └─► Message pré-rempli
    │               │
    │               └─► User envoie message
    │                       │
    │                       └─► useMessageStore.createConversation()
    │                               │
    │                               ├─► Firestore: conversations
    │                               │
    │                               ├─► Firestore: conversations/{id}/messages
    │                               │
    │                               └─► Email notification (optionnel)
    │
    ├─► Navigate('/messages')
    │       │
    │       └─► MessagesPage
    │               │
    │               ├─► ConversationList (gauche)
    │               │   - Charge toutes les conversations
    │               │   - Badge non lus
    │               │   - Temps réel (onSnapshot)
    │               │
    │               └─► ChatArea (droite)
    │                   │
    │                   ├─► Affiche messages
    │                   │   - Temps réel
    │                   │   - Scroll auto
    │                   │
    │                   ├─► Input message
    │                   │   - sendMessage()
    │                   │
    │                   └─► Menu Actions (⋮)
    │                       │
    │                       ├─► Voir l'annonce → ListingDetailPage
    │                       ├─► Bloquer → blockUser()
    │                       ├─► Signaler → reportUser()
    │                       └─► Supprimer → deleteConversation()
    │
    └─► Actions Spéciales
            │
            ├─► blockUser()
            │   └─► Firestore: conversations (blockedBy: [userId])
            │
            ├─► reportUser()
            │   └─► Firestore: reports (create)
            │
            └─► deleteConversation()
                └─► Firestore: conversations (deleted: true)

COLLECTIONS TOUCHÉES:
- conversations (create, read, update)
- conversations/{id}/messages (create, read)
- reports (create)
```

---

### 3. **Flux Signalement**

```
┌──────────────────────────────────────────────────────────────┐
│                 FLUX SIGNALEMENT COMPLET                      │
└──────────────────────────────────────────────────────────────┘

USER ACTION (Signaler)
    │
    ├─► MessagesPage → Menu (⋮) → "Signaler"
    │       │
    │       └─► Dialog s'ouvre
    │               │
    │               ├─► Select raison:
    │               │   - Spam
    │               │   - Contenu inapproprié
    │               │   - Arnaque
    │               │   - Harcèlement
    │               │   - Autre
    │               │
    │               ├─► Textarea description
    │               │
    │               └─► Bouton "Signaler"
    │                       │
    │                       └─► useMessageStore.reportUser()
    │                               │
    │                               └─► Firestore: reports
    │                                   {
    │                                     reporterId,
    │                                     reportedUserId,
    │                                     conversationId,
    │                                     reason,
    │                                     description,
    │                                     status: "pending",
    │                                     createdAt
    │                                   }
    │
    └─► ✅ Toast "Signalement envoyé"

────────────────────────────────────────────────────────────────

ADMIN ACTION (Traiter)
    │
    ├─► AdminReportsPage
    │       │
    │       ├─► Liste tous les signalements
    │       │   - Filtres: Tous / Pending / Resolved / Rejected
    │       │   - Recherche par nom
    │       │   - Stats en temps réel
    │       │
    │       └─► Clic "Traiter" (✅) sur un report
    │               │
    │               └─► Dialog s'ouvre
    │                       │
    │                       ├─► 3 Options:
    │                       │   │
    │                       │   ├─► 1. Rejeter
    │                       │   │   └─► Update: status = "rejected"
    │                       │   │
    │                       │   ├─► 2. Avertir
    │                       │   │   └─► Update: status = "resolved"
    │                       │   │       action = "warn"
    │                       │   │
    │                       │   └─► 3. Bloquer
    │                       │       │
    │                       │       └─► Actions automatiques:
    │                       │           │
    │                       │           ├─► Firestore: users/{reportedUserId}
    │                       │           │   - blocked: true
    │                       │           │   - blockedReason: "..."
    │                       │           │   - blockedAt: timestamp
    │                       │           │
    │                       │           ├─► Firestore: conversations/{conversationId}
    │                       │           │   - status: "blocked"
    │                       │           │   - blockedAt: timestamp
    │                       │           │
    │                       │           └─► Firestore: reports/{reportId}
    │                       │               - status: "resolved"
    │                       │               - action: "block"
    │                       │               - resolvedBy: adminId
    │                       │               - resolvedAt: timestamp
    │                       │
    │                       └─► Note optionnelle
    │
    └─► ✅ Toast "Signalement traité"

COLLECTIONS TOUCHÉES:
- reports (create, read, update)
- users (update: blocked)
- conversations (update: status)
```

---

### 4. **Flux Admin Dashboard**

```
┌──────────────────────────────────────────────────────────────┐
│              FLUX ADMIN DASHBOARD COMPLET                     │
└──────────────────────────────────────────────────────────────┘

ADMIN LOGIN
    │
    ├─► AuthPage → Login
    │       │
    │       └─► AuthContext.login()
    │               │
    │               └─► Firebase Auth
    │
    ├─► Header → Dropdown Menu
    │       │
    │       └─► "Administration" (visible si admin)
    │               │
    │               └─► Vérifie:
    │                   - currentUser.email dans VITE_ADMIN_EMAILS
    │                   - OU currentUser.uid dans VITE_ADMIN_UIDS
    │
    ├─► Navigate('/admin')
    │       │
    │       └─► AdminRoute (protection)
    │               │
    │               ├─► Si NON admin → Redirect '/'
    │               │
    │               └─► Si admin → AdminDashboardPage
    │
    └─► AdminDashboardPage (Layout)
            │
            ├─► Sidebar Navigation
            │   │
            │   ├─► Vue d'ensemble → /admin
            │   ├─► Commandes → /admin/orders
            │   ├─► Annonces → /admin/listings
            │   ├─► Utilisateurs → /admin/users
            │   ├─► Webhook Logs → /admin/webhooks
            │   ├─► Payouts → /admin/payouts
            │   ├─► Messages → /admin/messages
            │   ├─► Signalements → /admin/reports
            │   └─► Audit Trail → /admin/audit
            │
            └─► <Outlet /> (render child route)

────────────────────────────────────────────────────────────────

MODULE: ADMIN OVERVIEW
    │
    ├─► AdminOverview.tsx
    │       │
    │       ├─► Fetch KPIs (temps réel)
    │       │   │
    │       │   ├─► Total users / nouveaux 24h
    │       │   ├─► Total listings / active / pending
    │       │   ├─► Total orders / pending / paid / failed
    │       │   ├─► Revenus total / 24h / taux conversion
    │       │   │
    │       │   └─► Firestore: onSnapshot (temps réel)
    │       │
    │       ├─► Affiche Cartes KPIs
    │       │
    │       └─► Section Alertes
    │           - Commandes en attente
    │           - Annonces à approuver
    │           - Signalements non traités

────────────────────────────────────────────────────────────────

MODULE: ADMIN ORDERS
    │
    ├─► AdminOrdersPage.tsx
    │       │
    │       ├─► Fetch toutes les commandes
    │       │   └─► Firestore: orders (onSnapshot)
    │       │
    │       ├─► Filtres:
    │       │   - Tous / Pending / Paid / Failed / Refunded
    │       │
    │       ├─► Tableau avec actions:
    │       │   │
    │       │   ├─► 👁️ Voir détails → Dialog
    │       │   │
    │       │   ├─► 💰 Remboursement
    │       │   │   └─► POST /api/admin/orders/:id/refund
    │       │   │       └─► Stripe.refunds.create()
    │       │   │           └─► Firestore: orders (status: refunded)
    │       │   │
    │       │   └─► 🔄 Rejouer webhook
    │       │       └─► POST /api/admin/orders/:id/replay-webhook
    │       │           └─► Reprocess webhook event
    │       │
    │       └─► Stats:
    │           - Total commandes
    │           - Revenus
    │           - Taux réussite

────────────────────────────────────────────────────────────────

MODULE: ADMIN USERS
    │
    ├─► AdminUsersPage.tsx
    │       │
    │       ├─► Fetch tous les utilisateurs
    │       │   └─► Firestore: users (onSnapshot)
    │       │
    │       ├─► Filtres:
    │       │   - Tous / Vérifiés / Bloqués / Non vérifiés
    │       │
    │       ├─► Tableau avec actions:
    │       │   │
    │       │   ├─► 👁️ Voir profil → Dialog
    │       │   │
    │       │   ├─► 🔒 Bloquer / 🔓 Débloquer
    │       │   │   └─► POST /api/admin/users/:id/block
    │       │   │       └─► Firestore: users (blocked: true/false)
    │       │   │
    │       │   ├─► ✅ Vérifier manuellement
    │       │   │   └─► Firestore: users (emailVerified: true)
    │       │   │
    │       │   └─► 👤 Changer rôle
    │       │       └─► Firestore: users (role: admin/user)
    │       │
    │       └─► Stats:
    │           - Total utilisateurs
    │           - Nouveaux 24h
    │           - Taux vérification

────────────────────────────────────────────────────────────────

MODULE: ADMIN LISTINGS
    │
    ├─► AdminListingsPage.tsx
    │       │
    │       ├─► Fetch toutes les annonces
    │       │   └─► Firestore: listings (onSnapshot)
    │       │
    │       ├─► Filtres:
    │       │   - Toutes / Active / Pending / Sold / Removed
    │       │
    │       ├─► Tableau avec actions:
    │       │   │
    │       │   ├─► 👁️ Voir détails → Navigate ListingDetailPage
    │       │   │
    │       │   ├─► ✅ Approuver
    │       │   │   └─► Firestore: listings (status: active)
    │       │   │
    │       │   ├─► ⛔ Retirer
    │       │   │   └─► Firestore: listings (status: removed)
    │       │   │
    │       │   └─► 🗑️ Supprimer
    │       │       └─► Firestore: listings (delete)
    │       │           └─► Storage: images (delete)
    │       │
    │       └─► Stats:
    │           - Total annonces
    │           - Pending
    │           - Vendues

────────────────────────────────────────────────────────────────

MODULE: ADMIN MESSAGES
    │
    ├─► AdminMessagesPage.tsx
    │       │
    │       ├─► Fetch toutes les conversations
    │       │   └─► Firestore: conversations (onSnapshot)
    │       │
    │       ├─► Filtres:
    │       │   - Toutes / Actives / Bloquées / Supprimées
    │       │
    │       ├─► Tableau avec actions:
    │       │   │
    │       │   ├─► 👁️ Voir messages → Dialog
    │       │   │   └─► Affiche historique complet
    │       │   │
    │       │   ├─► 🚫 Bloquer / 🔓 Débloquer
    │       │   │   └─► Firestore: conversations (status: blocked/active)
    │       │   │
    │       │   └─► 🗑️ Supprimer
    │       │       └─► Firestore: conversations (deleted: true)
    │       │
    │       └─► Stats:
    │           - Total conversations
    │           - Actives
    │           - Bloquées

────────────────────────────────────────────────────────────────

MODULE: ADMIN REPORTS
    │
    ├─► AdminReportsPage.tsx
    │       │
    │       ├─► Fetch tous les signalements
    │       │   └─► Firestore: reports (onSnapshot)
    │       │
    │       ├─► Filtres:
    │       │   - Tous / Pending / Resolved / Rejected
    │       │
    │       ├─► Tableau avec actions:
    │       │   │
    │       │   ├─► 👁️ Voir détails → Dialog
    │       │   │
    │       │   ├─► ✅ Traiter → Dialog
    │       │   │   │
    │       │   │   ├─► Rejeter
    │       │   │   ├─► Avertir
    │       │   │   └─► Bloquer (auto: user + conversation)
    │       │   │
    │       │   └─► 🗑️ Supprimer
    │       │       └─► Firestore: reports (delete)
    │       │
    │       └─► Stats:
    │           - Total signalements
    │           - Pending
    │           - Traités 7j
```

---

## 🎨 Composants Réutilisables

```
┌────────────────────────────────────────────────────────────┐
│                COMPOSANTS UI (shadcn/ui)                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Button  │  │   Card   │  │  Dialog  │  │  Input   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Badge   │  │  Avatar  │  │  Select  │  │  Alert   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dropdown  │  │Separator │  │ Textarea │  │  Table   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘

UTILISÉS PARTOUT:
- 25+ pages
- 50+ composants métier
- Tous responsive
- Tous dark mode compatible
```

---

## 📦 Stores Zustand

```
┌────────────────────────────────────────────────────────────┐
│                    STORES (État Global)                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  useListingStore                                            │
│  ├─ listings: Listing[]                                     │
│  ├─ featuredListings: Listing[]                            │
│  ├─ fetchListings()                                         │
│  ├─ fetchFeaturedListings()                                │
│  ├─ createListing()                                         │
│  ├─ updateListing()                                         │
│  └─ deleteListing()                                         │
│                                                             │
│  useMessageStore                                            │
│  ├─ conversations: Conversation[]                          │
│  ├─ messages: Message[]                                     │
│  ├─ fetchConversations()                                    │
│  ├─ fetchMessages()                                         │
│  ├─ sendMessage()                                           │
│  ├─ createConversation()                                    │
│  ├─ blockUser()                                             │
│  ├─ reportUser()                                            │
│  └─ deleteConversation()                                    │
│                                                             │
│  useOrderStore                                              │
│  ├─ orders: Order[]                                         │
│  ├─ fetchOrders()                                           │
│  ├─ createOrder()                                           │
│  └─ updateOrderStatus()                                     │
│                                                             │
│  useFavoritesStore                                          │
│  ├─ favorites: string[]                                     │
│  ├─ fetchFavorites()                                        │
│  └─ toggleFavorite()                                        │
│                                                             │
│  usePaymentStore                                            │
│  ├─ paymentMethods: PaymentMethod[]                        │
│  ├─ paymentRequests: PaymentRequest[]                      │
│  ├─ createPaymentRequest()                                 │
│  └─ updatePaymentRequest()                                 │
│                                                             │
└────────────────────────────────────────────────────────────┘

CONNEXION FIRESTORE:
- onSnapshot() pour temps réel
- Sync automatique
- Cache local
```

---

## 🔐 Protection des Routes

```
┌────────────────────────────────────────────────────────────┐
│                   PROTECTION ROUTES                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Route Publique                                             │
│  └─► Accessible sans login                                  │
│      Exemples: /, /listings, /listing/:id, /auth           │
│                                                             │
│  Route Protégée (ProtectedRoute)                           │
│  └─► Vérifie: currentUser exists                           │
│      └─► Si NON → Redirect '/auth'                         │
│      └─► Si OUI → Render children                          │
│      Exemples: /messages, /profile, /create-listing        │
│                                                             │
│  Route Admin (ProtectedRoute + AdminRoute)                 │
│  └─► Vérifie: currentUser exists                           │
│      └─► Vérifie: email/uid dans env vars                  │
│          └─► Si NON → Redirect '/' + Toast error           │
│          └─► Si OUI → Render admin pages                   │
│      Exemples: /admin, /admin/orders, /admin/users         │
│                                                             │
└────────────────────────────────────────────────────────────┘

VÉRIFICATION ADMIN:
- VITE_ADMIN_EMAILS="email1@ex.com,email2@ex.com"
- VITE_ADMIN_UIDS="uid1,uid2"
- Check côté client (AdminRoute.tsx)
- À améliorer: Check côté serveur (JWT verification)
```

---

## 🌐 Endpoints API

```
┌────────────────────────────────────────────────────────────┐
│                    BACKEND ENDPOINTS                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  PUBLIC ENDPOINTS                                           │
│  ├─ POST   /api/orders                                      │
│  ├─ GET    /api/orders/:orderId/status                      │
│  ├─ POST   /api/create-payment-intent                       │
│  ├─ POST   /api/confirm-payment                             │
│  └─ POST   /api/webhook/stripe                              │
│                                                             │
│  ADMIN ENDPOINTS (protected by isAdmin)                     │
│  ├─ GET    /api/admin/users                                 │
│  ├─ POST   /api/admin/users/:id/block                       │
│  ├─ POST   /api/admin/orders/:id/refund                     │
│  ├─ POST   /api/admin/orders/:id/replay-webhook             │
│  ├─ POST   /api/admin/webhooks/:logId/reprocess             │
│  └─ POST   /api/admin/payouts/:id/approve                   │
│                                                             │
└────────────────────────────────────────────────────────────┘

MIDDLEWARE:
- isAdmin: Vérifie Authorization header
- À améliorer: Vérifier Firebase JWT token
```

---

## ✅ TOUTES LES CONNEXIONS SONT OPÉRATIONNELLES

### **Chaque bouton → Action définie** ✅
### **Chaque action → Backend/Firestore** ✅
### **Chaque page → Données chargées** ✅
### **Navigation complète** ✅
### **Stores synchronisés** ✅
### **Admin dashboard fonctionnel** ✅

---

🚀 **La plateforme StudyMarket est 100% connectée et prête !**

