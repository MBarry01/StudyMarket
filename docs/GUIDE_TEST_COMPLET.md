# 🧪 Guide de Test Complet - Système de Paiement

## 📋 Prérequis

### 1. Serveurs démarrés :

```bash
# Terminal 1 : Backend (port 3001)
node server.js

# Terminal 2 : Frontend (port 5174)
npm run dev

# Terminal 3 : Stripe CLI (pour webhooks en local)
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

### 2. Variables d'environnement configurées :

- ✅ `.env` : `FIREBASE_SERVICE_ACCOUNT`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- ✅ `vite.env` ou `vite.config.ts` : `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_API_BASE`

---

## 🎯 Test 1 : Création de commande AVANT paiement

### Objectif :
Vérifier que la commande est créée en status `pending` avant l'affichage du modal de paiement.

### Étapes :

1. **Ouvrir la console du navigateur** (F12)

2. **Aller sur une annonce** : `http://localhost:5174/StudyMarket/#/listing/[LISTING_ID]`
   - Remplacer `[LISTING_ID]` par un ID d'annonce existant

3. **Cliquer sur "Acheter maintenant"**

4. **Vérifier dans la console** :
   ```
   ✅ Commande créée: abc123xyz...
   ```

5. **Vérifier dans Firestore** :
   - Aller sur Firebase Console → Firestore Database
   - Collection `orders`
   - Chercher la commande créée
   - Vérifier :
     ```
     status: "pending"
     userId: "votre_user_id"
     listingId: "[LISTING_ID]"
     amountCents: [PRICE * 100]
     stripePaymentIntentId: null (pas encore payé)
     ```

### ✅ Résultat attendu :
- Modal de sélection de méthode s'affiche
- Commande existe dans Firestore avec status `pending`
- Log dans la console : `✅ Commande créée: ...`

---

## 🎯 Test 2 : Sélection de méthode de paiement

### Objectif :
Vérifier que le sélecteur de méthode fonctionne et que seule la carte est activée.

### Étapes :

1. **Dans le modal de sélection**, observer :
   - ✅ "Carte Bancaire" est cliquable
   - ⚠️ "PayPal", "Lydia", "Espèces" ont le badge "Bientôt" et sont grisés

2. **Cliquer sur "Carte Bancaire"**

3. **Cliquer sur "Continuer"**

### ✅ Résultat attendu :
- Modal de paiement Stripe s'affiche
- Récapitulatif des frais visible

---

## 🎯 Test 3 : Création du PaymentIntent avec orderId

### Objectif :
Vérifier que le PaymentIntent est créé avec `order_id` dans les métadonnées.

### Étapes :

1. **Observer le modal de paiement** :
   - Récapitulatif des frais doit être visible :
     ```
     Sous-total: 40,00 EUR
     Frais de service (5%): 2,00 EUR
     Frais de traitement: 0,25 EUR
     Total: 42,25 EUR
     ```

2. **Vérifier dans la console** :
   ```
   📦 Mise à jour commande existante: abc123xyz...
   ```

3. **Vérifier les logs du serveur** (Terminal 1) :
   ```
   create-payment-intent payload: {"orderId":"abc123xyz..."}
   ```

4. **Vérifier dans Stripe Dashboard** (https://dashboard.stripe.com/test/payments) :
   - Le PaymentIntent doit avoir :
     - `metadata.order_id`: `abc123xyz...`
     - `metadata.platform`: `studymarket`
     - `amount`: `4225` (centimes)

### ✅ Résultat attendu :
- Récapitulatif affiché
- PaymentIntent créé avec orderId
- Formulaire Stripe PaymentElement visible

---

## 🎯 Test 4 : Paiement avec carte test

### Objectif :
Effectuer un paiement complet avec une carte test.

### Étapes :

1. **Remplir les informations de carte** :
   ```
   Numéro: 4242 4242 4242 4242
   Date: 12/34 (n'importe quelle date future)
   CVC: 123 (n'importe quel 3 chiffres)
   ```

2. **Cliquer sur "Payer maintenant" ou "Confirmer le paiement"**

3. **Attendre la confirmation**

4. **Vérifier les logs du serveur** :
   ```
   ✅ Paiement réussi: pi_abc123...
   📦 Mise à jour commande existante: def456
   ✅ Commande mise à jour (paid): def456
   ✅ Annonce marquée comme vendue: xyz789
   ```

5. **Vérifier dans Stripe CLI** (Terminal 3) :
   ```
   payment_intent.succeeded [evt_abc123...]
   ```

6. **Vérifier la redirection** :
   - URL : `/payment/success?orderId=def456&payment_intent=pi_abc123...`

### ✅ Résultat attendu :
- Paiement réussi
- Webhook reçu et traité
- Commande mise à jour (paid)
- Annonce marquée comme vendue
- Redirection vers page de succès

---

## 🎯 Test 5 : Polling du statut sur page de succès

### Objectif :
Vérifier que la page de succès interroge le backend pour confirmer le paiement.

### Étapes :

1. **Sur la page de succès**, ouvrir la console (F12)

2. **Observer les requêtes réseau** (onglet Network) :
   - Requêtes régulières vers `/api/orders/[ORDER_ID]/status`
   - Toutes les 2 secondes pendant max 30 secondes

3. **Vérifier dans la console** :
   ```
   📊 Statut commande: {orderId: "...", status: "paid", ...}
   ```

4. **Vérifier l'affichage** :
   - ✅ Message de confirmation
   - ✅ Détails de la commande
   - ✅ Liste des articles achetés

### ✅ Résultat attendu :
- Polling fonctionne (requêtes toutes les 2s)
- Statut `paid` détecté
- Détails de la commande affichés

---

## 🎯 Test 6 : Vérification Firestore finale

### Objectif :
Confirmer que toutes les données sont correctement enregistrées.

### Étapes :

1. **Aller sur Firebase Console → Firestore**

2. **Collection `orders`** → Commande créée :
   ```
   status: "paid" ✅
   userId: "[BUYER_ID]"
   sellerId: "[SELLER_ID]"
   listingId: "[LISTING_ID]"
   amountCents: 4000
   totalCents: 4225
   stripePaymentIntentId: "pi_abc123..." ✅
   payment.transactionId: "pi_abc123..." ✅
   createdAt: Timestamp
   updatedAt: Timestamp
   ```

3. **Collection `listings`** → Annonce vendue :
   ```
   status: "sold" ✅
   soldAt: Timestamp ✅
   soldTo: "[BUYER_ID]" ✅
   ```

### ✅ Résultat attendu :
- Commande en status `paid`
- Annonce en status `sold`
- Tous les champs remplis correctement

---

## 🎯 Test 7 : Badge "VENDU" sur l'annonce

### Objectif :
Vérifier que le badge "VENDU" s'affiche sur les annonces vendues.

### Étapes :

1. **Aller sur la page d'accueil** : `http://localhost:5174/StudyMarket/`

2. **Chercher l'annonce qui vient d'être vendue**

3. **Vérifier l'affichage** :
   - Badge rouge "VENDU" visible en haut à gauche de la carte
   - Badge de condition masqué (remplacé par VENDU)

4. **Cliquer sur l'annonce**

5. **Sur la page détail** :
   - Badge "VENDU" visible
   - Bouton "Acheter maintenant" masqué ou désactivé

### ✅ Résultat attendu :
- Badge "VENDU" affiché
- Annonce non achetable

---

## 🎯 Test 8 : Tentative d'achat d'une annonce vendue

### Objectif :
Vérifier qu'on ne peut pas acheter une annonce déjà vendue.

### Étapes :

1. **Cliquer sur "Acheter maintenant"** (si visible)

2. **Vérifier le message d'erreur** :
   ```
   ❌ Cet article a déjà été vendu
   ```

### ✅ Résultat attendu :
- Message d'erreur affiché
- Aucune commande créée

---

## 🎯 Test 9 : Page "Mes Commandes"

### Objectif :
Vérifier que la commande apparaît dans le profil de l'acheteur.

### Étapes :

1. **Se connecter avec le compte acheteur**

2. **Aller sur "Mes Commandes"** : `http://localhost:5174/StudyMarket/#/orders`

3. **Vérifier l'affichage** :
   - Commande visible dans la liste
   - Status : "Livré" ou "Payé"
   - Montant correct
   - Article(s) listés

4. **Cliquer sur la commande** pour voir le détail

### ✅ Résultat attendu :
- Commande visible
- Détails corrects
- Lien vers Stripe Dashboard (si configuré)

---

## 🎯 Test 10 : Page "Mes Ventes"

### Objectif :
Vérifier que la vente apparaît dans le profil du vendeur.

### Étapes :

1. **Se connecter avec le compte vendeur**

2. **Aller sur "Mes Ventes"** : `http://localhost:5174/StudyMarket/#/sales`

3. **Vérifier l'affichage** :
   - Vente visible dans la liste
   - Statistiques affichées (total ventes, revenu, etc.)
   - Détails de la commande

### ✅ Résultat attendu :
- Vente visible pour le vendeur
- Statistiques correctes

---

## 🚨 Tests de cas d'erreur

### Test E1 : Carte refusée

**Carte test** : `4000 0000 0000 0002`

**Résultat attendu** :
- Message d'erreur Stripe affiché
- Commande reste en status `pending`
- Possibilité de réessayer

### Test E2 : Carte nécessitant 3DS

**Carte test** : `4000 0027 6000 3184`

**Résultat attendu** :
- Modal 3DS s'affiche
- Après authentification : paiement réussi

### Test E3 : Paiement timeout

**Scénario** : Arrêter le webhook pendant un test

**Résultat attendu** :
- Page success affiche "Vérification en cours..."
- Après 30 secondes : message "Veuillez vérifier votre email"

---

## 📊 Checklist complète

| Test | Description | Statut |
|------|-------------|--------|
| Test 1 | Création commande pending | ⬜ |
| Test 2 | Sélecteur méthode | ⬜ |
| Test 3 | PaymentIntent avec orderId | ⬜ |
| Test 4 | Paiement carte test | ⬜ |
| Test 5 | Polling statut | ⬜ |
| Test 6 | Vérification Firestore | ⬜ |
| Test 7 | Badge VENDU | ⬜ |
| Test 8 | Blocage achat annonce vendue | ⬜ |
| Test 9 | Page Mes Commandes | ⬜ |
| Test 10 | Page Mes Ventes | ⬜ |
| Test E1 | Carte refusée | ⬜ |
| Test E2 | 3DS authentification | ⬜ |
| Test E3 | Timeout webhook | ⬜ |

---

## 🎉 Tout est OK ?

Si tous les tests passent, **le système de paiement est fonctionnel** ! 🚀

Prochaines étapes :
1. Tests en mode staging avec vraies cartes (mode test Stripe)
2. Configuration des emails de confirmation
3. Déploiement en production

---

## 🆘 Problèmes courants

### Problème 1 : Commande pas créée
**Cause** : Backend non accessible  
**Solution** : Vérifier que `VITE_API_BASE=http://localhost:3001` dans `vite.config.ts`

### Problème 2 : Webhook ne reçoit rien
**Cause** : Stripe CLI non démarré  
**Solution** : Lancer `stripe listen --forward-to localhost:3001/api/webhook/stripe`

### Problème 3 : Annonce pas marquée vendue
**Cause** : Firebase Admin non configuré  
**Solution** : Vérifier `FIREBASE_SERVICE_ACCOUNT` dans `.env`

### Problème 4 : Badge VENDU pas affiché
**Cause** : Cache du navigateur  
**Solution** : Rafraîchir la page (Ctrl+F5) ou vider le cache

---

*Dernière mise à jour : 25 octobre 2025*  
*Pour support : consulter `SYSTEME_PAIEMENT_COMPLET.md`*

