# 🎯 Configuration Finale - StudyMarket

## ✅ Ce qui est fait

### 1. Système de paiement Stripe
- ✅ PaymentIntent créé côté serveur
- ✅ Calcul des frais (service 5% + traitement 0,25€)
- ✅ Formulaire de paiement sécurisé
- ✅ Vérification d'éligibilité (authentifié, pas son propre article, article actif, prix > 0)
- ✅ Acceptation des conditions générales
- ✅ Affichage du détail des frais

### 2. Page "Mes Commandes"
- ✅ Liste des commandes avec filtres (statut, période, tri)
- ✅ Onglets (toutes, en cours, terminées, annulées)
- ✅ Recherche par numéro de commande
- ✅ Export JSON
- ✅ Page de détails de commande complète
- ✅ Affichage des informations de paiement
- ✅ Lien vers le dashboard Stripe

### 3. Backend Express
- ✅ Endpoint `POST /api/create-payment-intent`
- ✅ Endpoint `POST /api/webhook/stripe` (pour production)
- ✅ Endpoint `POST /api/test-create-order` (temporaire, pour tests)
- ✅ Firebase Admin configuré
- ✅ Persistance des commandes dans Firestore

---

## 🔧 Configuration requise

### 1️⃣ Index Firestore **OBLIGATOIRE**

Pour que la page "Mes Commandes" fonctionne, vous **devez** créer cet index Firestore :

#### 📋 Étapes :

1. **Allez sur Firebase Console** : https://console.firebase.google.com/project/annonces-app-44d27/firestore/indexes

2. **Cliquez sur "Créer un index"**

3. **Configurez l'index** :
   - **Collection** : `orders`
   - **Champs** :
     - `userId` → **Ascending**
     - `createdAt` → **Descending**
   
4. **❌ IMPORTANT** : Si Firebase ajoute automatiquement un champ `__name__`, **SUPPRIMEZ-LE** !

5. **Cliquez sur "Créer"**

6. **Attendez** 1-2 minutes que l'index soit construit.

#### ✅ Vérification :
Une fois l'index créé, actualisez la page "Mes Commandes" (F5). L'erreur `The query requires an index` devrait disparaître.

---

### 2️⃣ Webhooks Stripe (pour production)

#### En développement local (actuellement) :
- ✅ Webhook configuré dans `server.js`
- ⚠️ Stripe ne peut pas envoyer de webhooks à `localhost:3001`
- 🧪 Solution temporaire : endpoint `/api/test-create-order` pour créer manuellement des commandes

#### Pour la production :

1. **Déployez votre backend** (sur Heroku, Railway, Render, etc.)

2. **Configurez le webhook Stripe** :
   - Allez sur : https://dashboard.stripe.com/test/webhooks
   - Cliquez sur "Ajouter un endpoint"
   - URL : `https://votre-domaine.com/api/webhook/stripe`
   - Événements à écouter :
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   
3. **Copiez le "Signing secret"** et ajoutez-le dans votre `.env` :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

4. **Redémarrez votre serveur**

---

## 🚀 Utilisation

### Démarrer l'application :

#### Terminal 1 - Frontend :
```powershell
npm run dev
```

#### Terminal 2 - Backend :
```powershell
node server.js
```

### Faire un paiement test :

1. **Connectez-vous** à votre compte
2. **Allez sur une annonce** (ex: "Chargeur Mac Book")
3. **Cliquez sur "Acheter maintenant"**
4. **Acceptez les conditions**
5. **Entrez les informations** :
   - Carte : `4242 4242 4242 4242`
   - Date : n'importe quelle date future (ex: `12/25`)
   - CVC : `123`
6. **Cliquez sur "Payer"**

### Voir vos commandes :

1. **Allez sur** : http://localhost:5173/StudyMarket/#/orders
2. **Vous devriez voir** votre commande avec tous les détails !

---

## 📊 Structure des données

### Collection `orders` (Firestore)

```typescript
{
  userId: string;              // ID de l'acheteur
  items: [{
    id: string;                // ID de l'annonce
    title: string;             // Titre de l'article
    price: number;             // Prix unitaire (en euros)
    quantity: number;          // Quantité
    image: string | null;      // URL de l'image
    sellerId: string;          // ID du vendeur
  }];
  total: number;               // Total de la commande (en euros)
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    university: string;
  };
  payment: {
    method: string;            // "card"
    details: {
      paymentIntentId: string; // ID du PaymentIntent Stripe
      subtotalCents: number;   // Sous-total en centimes
      serviceFeeCents: number; // Frais de service en centimes (5%)
      processingFeeCents: number; // Frais de traitement (25 centimes)
      totalCents: number;      // Total en centimes
      currency: string;        // "eur"
    };
    transactionId: string;     // ID de la transaction
  };
  status: string;              // "delivered", "pending", "processing", "shipped", "cancelled"
  trackingNumber: string;      // Numéro de suivi
  notes: string;               // Notes
  createdAt: Timestamp;        // Date de création
  updatedAt: Timestamp;        // Date de mise à jour
}
```

---

## 🎨 Pages créées/modifiées

### Nouvelles pages :
- ✅ `src/components/checkout/OrderDetailPage.tsx` - Détails d'une commande
- ✅ `src/pages/PaymentSuccessPage.tsx` - Page de succès après paiement
- ✅ `src/pages/CheckoutPage.tsx` - Page de paiement avec détail des frais

### Pages modifiées :
- ✅ `src/components/checkout/OrdersPage.tsx` - Correction du bug `item.name` → `item.title`
- ✅ `src/App.tsx` - Ajout de la route `/order/:id`
- ✅ `src/components/payment/QuickPaymentButton.tsx` - Vérifications d'éligibilité
- ✅ `src/components/payment/PaymentWrapper.tsx` - Envoi des items au serveur
- ✅ `server.js` - Webhook et endpoint de test

---

## 🧪 Tests

### Cartes de test Stripe :

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | ✅ Succès |
| `4000 0000 0000 9995` | ❌ Fonds insuffisants |
| `4000 0000 0000 0002` | ❌ Carte déclinée |
| `4000 0025 0000 3155` | 🔐 Authentification 3D Secure requise |

**Date** : N'importe quelle date future  
**CVC** : N'importe quel code à 3 chiffres

---

## 📱 Navigation

- **Accueil** → **Annonce** → **"Acheter maintenant"** → **Paiement** → **Mes Commandes**
- **Mes Commandes** → **Détails** → Voir toutes les infos (articles, prix, paiement, Stripe)

---

## 🔐 Sécurité

- ✅ Routes protégées avec `<ProtectedRoute>`
- ✅ Calcul des montants **côté serveur** (pas de manipulation possible côté client)
- ✅ Vérification d'éligibilité avant paiement
- ✅ Signature des webhooks Stripe pour authentifier les requêtes
- ✅ Idempotence des requêtes PaymentIntent

---

## 🐛 Dépannage

### "The query requires an index"
👉 **Solution** : Créez l'index Firestore (voir section 1️⃣ ci-dessus)

### "Cannot POST /api/test-create-order"
👉 **Solution** : Redémarrez le serveur avec `node server.js`

### "Firebase Admin non configuré"
👉 **Solution** : Vérifiez que `FIREBASE_SERVICE_ACCOUNT` est dans votre `.env`

### La page "Mes Commandes" est vide après un paiement
👉 **Solution** : 
1. Vérifiez que le serveur affiche "✅ Firebase Admin initialisé"
2. Vérifiez que l'index Firestore est créé
3. Actualisez la page (F5)

---

## 🎉 Félicitations !

Vous avez maintenant un système de paiement Stripe complet et fonctionnel ! 🚀

### Prochaines étapes (optionnelles) :
- [ ] Ajouter la pagination des commandes
- [ ] Permettre l'annulation de commandes
- [ ] Générer des factures PDF
- [ ] Notifications par email (via SendGrid ou Mailgun)
- [ ] Tableau de bord vendeur pour voir les ventes

---

**Besoin d'aide ?** Consultez la documentation Stripe : https://stripe.com/docs

