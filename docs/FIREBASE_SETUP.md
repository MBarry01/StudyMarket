# Configuration Firebase Admin pour la persistance des commandes

## Étapes pour activer la persistance des commandes

### 1. Créer un fichier `.env` à la racine du projet avec :

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Firebase Admin SDK (Service Account)
FIREBASE_SERVICE_ACCOUNT={"project_id":"annonces-app-44d27","client_email":"firebase-adminsdk-xxx@annonces-app-44d27.iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"}

# Frontend Stripe Keys (pour Vite)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RY7Vw2XLhzYQhT9mWGOChkOK9Lp7QGPlTA5mqrZhHCDwiRGdgXeEpCanybQGuvXy4FsNTyDOTlYNkGsBGXEGNhS00ORRyOHto
```

### 2. Obtenir la clé de service Firebase Admin

1. Aller dans la console Firebase : https://console.firebase.google.com/
2. Sélectionner le projet "annonces-app-44d27"
3. Aller dans "Paramètres du projet" > "Comptes de service"
4. Cliquer sur "Générer une nouvelle clé privée"
5. Télécharger le fichier JSON
6. Copier le contenu du JSON dans `FIREBASE_SERVICE_ACCOUNT`
7. **Important** : Échapper les sauts de ligne du `private_key` avec `\\n`

### 3. Configurer le webhook Stripe

1. Installer Stripe CLI : https://stripe.com/docs/stripe-cli
2. Se connecter : `stripe login`
3. Écouter les webhooks : `stripe listen --forward-to http://localhost:3001/api/webhook/stripe`
4. Copier la valeur "Signing secret" dans `STRIPE_WEBHOOK_SECRET`

### 4. Redémarrer le serveur

```bash
node server.js
```

### 5. Tester

1. Faire un paiement test avec la carte 4242 4242 4242 4242
2. Vérifier dans Firestore la collection `orders` :
   - Un document doit apparaître avec `userId`, `sellerId`, `listingId`
   - `subtotalCents`, `serviceFeeCents`, `processingFeeCents`, `totalCents`
   - `currency`, `paymentIntentId`, `status=paid`, `createdAt`

## Structure des commandes dans Firestore

```javascript
{
  userId: "buyer_user_id",
  sellerId: "seller_user_id", 
  listingId: "listing_id",
  subtotalCents: 1000,        // Prix de l'annonce (10€)
  serviceFeeCents: 50,        // Frais de service (0.50€)
  processingFeeCents: 25,    // Frais de traitement (0.25€)
  totalCents: 1075,          // Total (10.75€)
  currency: "eur",
  paymentIntentId: "pi_xxx",
  status: "paid",
  createdAt: serverTimestamp()
}
```
