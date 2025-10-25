# ✅ Checklist de Test Utilisateur - StudyMarket

## 🧪 Tests à Effectuer

### 1. **Authentification & Compte**

- [ ] **Inscription**
  1. Aller sur `/auth`
  2. Remplir formulaire inscription
  3. Vérifier email de confirmation
  4. ✅ Compte créé dans Firestore `users`

- [ ] **Connexion**
  1. Aller sur `/auth`
  2. Se connecter avec email/password
  3. ✅ Redirection vers HomePage

- [ ] **Profil**
  1. Aller sur `/profile`
  2. Vérifier infos affichées
  3. Modifier photo de profil
  4. ✅ Changes sauvegardées

---

### 2. **Annonces**

- [ ] **Créer une Annonce**
  1. Cliquer "Créer une annonce" (Header)
  2. Remplir tous les champs
  3. Upload 1-5 images
  4. Sélectionner localisation sur carte
  5. Cliquer "Publier"
  6. ✅ Annonce visible sur `/listings`

- [ ] **Modifier une Annonce**
  1. Aller sur mon profil
  2. Cliquer "Modifier" sur une annonce
  3. Changer le titre
  4. Cliquer "Sauvegarder"
  5. ✅ Annonce mise à jour

- [ ] **Supprimer une Annonce**
  1. Sur mon profil
  2. Cliquer "Supprimer" sur une annonce
  3. Confirmer
  4. ✅ Annonce supprimée

- [ ] **Ajouter aux Favoris**
  1. Sur une annonce
  2. Cliquer le cœur ❤️
  3. Aller sur `/favorites`
  4. ✅ Annonce dans mes favoris

---

### 3. **Messaging**

- [ ] **Contacter un Vendeur (Nouvelle Conversation)**
  1. Aller sur une annonce (pas la mienne)
  2. Cliquer "Contacter le vendeur"
  3. Modal s'ouvre avec message pré-rempli
  4. Modifier le message
  5. Envoyer
  6. ✅ Redirection vers `/messages`
  7. ✅ Conversation créée

- [ ] **Continuer une Conversation Existante**
  1. Retourner sur la même annonce
  2. Bouton devient "Continuer la conversation"
  3. Cliquer
  4. ✅ Direct vers `/messages` avec conversation active

- [ ] **Envoyer des Messages**
  1. Dans `/messages`
  2. Taper un message
  3. Appuyer Entrée
  4. ✅ Message envoyé et affiché

- [ ] **Bloquer un Utilisateur**
  1. Dans une conversation
  2. Menu (⋮) → "Bloquer"
  3. Confirmer
  4. ✅ Conversation bloquée
  5. ✅ Ne peut plus envoyer de messages

- [ ] **Signaler un Utilisateur**
  1. Dans une conversation
  2. Menu (⋮) → "Signaler"
  3. Sélectionner raison
  4. Ajouter description
  5. Envoyer
  6. ✅ Toast "Signalement envoyé"

---

### 4. **Paiement**

- [ ] **Acheter avec Carte (Flux Complet)**
  1. Aller sur une annonce à vendre
  2. Cliquer "Acheter maintenant"
  3. ✅ Commande créée (vérifier dans Firestore)
  4. Modal sélection méthode s'ouvre
  5. Choisir "Carte Bancaire"
  6. ✅ Formulaire Stripe s'affiche
  7. Voir récapitulatif :
     - Sous-total : XX,XX €
     - Frais de service (5%) : X,XX €
     - Frais de traitement : 0,25 €
     - **Total** : XX,XX €
  8. Entrer carte test : `4242 4242 4242 4242`
  9. Date : `12/34`, CVC : `123`
  10. Cliquer "Payer"
  11. ✅ Redirection vers `/payment/success`
  12. ✅ Page poll le statut (loading...)
  13. ✅ Confirmation affichée avec détails

- [ ] **Vérifier Backend (après paiement)**
  1. Ouvrir Firestore
  2. Collection `orders` → Chercher la commande
  3. ✅ `status: "paid"`
  4. ✅ `stripePaymentIntentId: "pi_..."`
  5. Collection `listings` → Chercher l'annonce
  6. ✅ `status: "sold"`
  7. ✅ Badge "VENDU" s'affiche sur l'annonce

- [ ] **Voir Mes Commandes**
  1. Header → "Mes commandes"
  2. ✅ Liste des commandes avec statuts

---

### 5. **Admin Dashboard**

> ⚠️ Nécessite email dans `VITE_ADMIN_EMAILS` du `.env`

- [ ] **Accès Admin**
  1. Se connecter avec email admin
  2. Avatar → Voir "Administration" dans menu
  3. Cliquer
  4. ✅ Redirection vers `/admin`

- [ ] **Overview (KPI)**
  1. Sur `/admin`
  2. ✅ Voir stats en temps réel :
     - Total utilisateurs / nouveaux 24h
     - Total annonces / actives / pending
     - Total commandes / pending / paid / failed
     - Revenus total / 24h / taux conversion

- [ ] **Gestion des Commandes**
  1. Aller sur `/admin/orders`
  2. ✅ Voir toutes les commandes
  3. Filtrer par "paid"
  4. Cliquer "👁️" sur une commande
  5. ✅ Voir tous les détails
  6. Sur une commande payée, cliquer "💰"
  7. Confirmer le remboursement
  8. ✅ Toast "Remboursement effectué"

- [ ] **Gestion des Utilisateurs**
  1. Aller sur `/admin/users`
  2. ✅ Voir tous les utilisateurs
  3. Rechercher un utilisateur
  4. Cliquer "🔒" (Bloquer)
  5. Entrer raison
  6. Confirmer
  7. ✅ User bloqué (vérifier dans Firestore)

- [ ] **Gestion des Annonces**
  1. Aller sur `/admin/listings`
  2. ✅ Voir toutes les annonces
  3. Filtrer par "pending"
  4. Cliquer "✅" (Approuver)
  5. ✅ Annonce approuvée (status: active)

- [ ] **Gestion des Messages**
  1. Aller sur `/admin/messages`
  2. ✅ Voir toutes les conversations
  3. Cliquer "👁️" sur une conversation
  4. ✅ Voir historique complet des messages
  5. Cliquer "🚫" pour bloquer
  6. ✅ Conversation bloquée

- [ ] **Gestion des Signalements**
  1. Aller sur `/admin/reports`
  2. ✅ Voir tous les signalements
  3. Filtrer par "pending"
  4. Cliquer "✅" (Traiter)
  5. Sélectionner action : "Bloquer"
  6. Confirmer
  7. ✅ User bloqué automatiquement
  8. ✅ Conversation bloquée automatiquement
  9. ✅ Signalement marqué "resolved"

- [ ] **Webhook Logs**
  1. Aller sur `/admin/webhooks`
  2. ✅ Voir logs webhook Stripe
  3. Si logs vides : Normal si pas de webhooks reçus

- [ ] **Payouts**
  1. Aller sur `/admin/payouts`
  2. ✅ Voir demandes de payout vendeurs
  3. Si vide : Normal si pas de payouts demandés

- [ ] **Audit Trail**
  1. Aller sur `/admin/audit`
  2. ✅ Voir historique des actions admin
  3. Si vide : Normal si collection pas alimentée

---

### 6. **Navigation & UI**

- [ ] **Header Navigation**
  1. Cliquer logo → ✅ HomePage
  2. Cliquer "Annonces" → ✅ `/listings`
  3. Cliquer "Messages" → ✅ `/messages`
  4. Badge non lus affiché si messages non lus

- [ ] **Dark Mode**
  1. Cliquer icône 🌙/☀️ dans Header
  2. ✅ Theme change instantanément
  3. ✅ Tous les composants s'adaptent

- [ ] **Responsive**
  1. Réduire fenêtre (mobile)
  2. ✅ Menu burger s'affiche
  3. ✅ Cartes s'adaptent
  4. ✅ Tout reste utilisable

---

## 🎯 Scénarios de Test Complets

### **Scénario A : Acheteur Achète un Article**

1. [ ] S'inscrire/Se connecter
2. [ ] Parcourir annonces (`/listings`)
3. [ ] Sélectionner une annonce
4. [ ] Ajouter aux favoris
5. [ ] Contacter le vendeur
6. [ ] Échanger quelques messages
7. [ ] Acheter l'article (carte test)
8. [ ] Vérifier email de confirmation
9. [ ] Voir commande dans "Mes commandes"
10. [ ] ✅ Annonce affiche "VENDU"

**Temps estimé** : 5-10 minutes

---

### **Scénario B : Vendeur Crée et Vend**

1. [ ] S'inscrire/Se connecter
2. [ ] Créer une annonce avec images
3. [ ] Attendre qu'un acheteur contacte
4. [ ] Répondre aux messages
5. [ ] Recevoir notification de vente
6. [ ] Voir commande complétée
7. [ ] (Si payout configuré) Demander payout

**Temps estimé** : 10-15 minutes

---

### **Scénario C : Modérateur Gère Plateforme**

1. [ ] Se connecter comme admin
2. [ ] Accéder dashboard (`/admin`)
3. [ ] Vérifier KPIs
4. [ ] Approuver annonces en attente
5. [ ] Traiter un signalement → Bloquer user
6. [ ] Rembourser une commande problématique
7. [ ] Vérifier audit trail

**Temps estimé** : 5-10 minutes

---

## 📊 Résultats Attendus

### ✅ **Tout Fonctionne Si...**

- Les commandes passent de `pending` → `paid`
- Les annonces vendues affichent "VENDU"
- Les messages s'envoient en temps réel
- Les signalements arrivent dans admin
- Les blocages empêchent l'envoi de messages
- Les remboursements Stripe fonctionnent
- Toutes les pages admin affichent les vraies données
- Le dark mode s'applique partout
- Responsive sur mobile

### ⚠️ **Vérifier les Logs Si...**

- Erreurs dans console
- Commandes restent `pending`
- Messages ne s'envoient pas
- Admin ne voit pas les données

**Console logs à surveiller** :
```
✅ Commande créée: xxx
✅ Paiement réussi: pi_xxx
✅ Webhook reçu
✅ Message envoyé
✅ Conversation créée
```

---

## 🚀 Prêt pour les Tests !

Toutes les fonctionnalités sont connectées et opérationnelles.
Utilisez cette checklist pour valider chaque partie de la plateforme.

**Bon test !** 🎉

