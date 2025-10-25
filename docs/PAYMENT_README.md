# 🚀 StudyMarket - Système de Paiement Stripe

## ✅ Configuration terminée

Le système de paiement Stripe est maintenant entièrement configuré avec :

- ✅ **Frontend** : Composants Stripe React avec gestion des frais
- ✅ **Backend** : Serveur Express avec calcul des frais côté serveur
- ✅ **Webhook** : Persistance automatique des commandes dans Firestore
- ✅ **Sécurité** : Validation des signatures webhook Stripe

## 🎯 Fonctionnalités

### Calcul des frais automatique
- **Frais de service** : 5% du montant
- **Frais de traitement** : 0,25€ fixe
- **Total** : Montant + frais de service + frais de traitement

### Persistance des commandes
- Sauvegarde automatique dans Firestore via webhook
- Données complètes : utilisateur, vendeur, annonce, frais, statut
- Horodatage automatique

## 🚀 Démarrage rapide

### 1. Variables d'environnement
Créez un fichier `.env` à la racine avec :

```env
# Stripe (obligatoire)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Firebase Admin (pour la persistance)
FIREBASE_SERVICE_ACCOUNT={"project_id":"annonces-app-44d27","client_email":"firebase-adminsdk-xxx@annonces-app-44d27.iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"}

# Frontend
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RY7Vw2XLhzYQhT9mWGOChkOK9Lp7QGPlTA5mqrZhHCDwiRGdgXeEpCanybQGuvXy4FsNTyDOTlYNkGsBGXEGNhS00ORRyOHto
```

### 2. Démarrer le serveur
```bash
# Option 1 : Script PowerShell (Windows)
.\start-server.ps1

# Option 2 : Script Bash (Linux/Mac)
./start-server.sh

# Option 3 : Directement
npm run server
```

### 3. Démarrer le frontend
```bash
npm run dev
```

### 4. Démarrer les deux ensemble
```bash
npm run dev:full
```

## 🔧 Configuration Stripe CLI (pour les webhooks)

1. Installer Stripe CLI : https://stripe.com/docs/stripe-cli
2. Se connecter : `stripe login`
3. Écouter les webhooks : `stripe listen --forward-to http://localhost:3001/api/webhook/stripe`
4. Copier le "Signing secret" dans `STRIPE_WEBHOOK_SECRET`

## 🧪 Test de paiement

Utilisez la carte de test Stripe :
- **Numéro** : 4242 4242 4242 4242
- **Date** : n'importe quelle date future
- **CVC** : n'importe quel code à 3 chiffres

## 📊 Structure des commandes dans Firestore

```javascript
{
  userId: "buyer_user_id",           // ID de l'acheteur
  sellerId: "seller_user_id",        // ID du vendeur  
  listingId: "listing_id",          // ID de l'annonce
  subtotalCents: 1000,              // Prix de l'annonce (10€)
  serviceFeeCents: 50,             // Frais de service (0.50€)
  processingFeeCents: 25,          // Frais de traitement (0.25€)
  totalCents: 1075,                // Total (10.75€)
  currency: "eur",
  paymentIntentId: "pi_xxx",       // ID Stripe
  status: "paid",
  createdAt: serverTimestamp()     // Horodatage automatique
}
```

## 🔍 Endpoints API

- `POST /api/create-payment-intent` - Créer un paiement
- `POST /api/confirm-payment` - Confirmer un paiement
- `POST /api/webhook/stripe` - Webhook Stripe (persistance)
- `GET /api/test` - Test de l'API

## 📝 Notes importantes

- Les frais sont calculés côté serveur pour la sécurité
- La persistance Firebase est optionnelle (fonctionne sans)
- Les webhooks Stripe garantissent la fiabilité des paiements
- Le système gère automatiquement les erreurs et les échecs

## 🆘 Dépannage

### Erreur "Firebase Admin non disponible"
- Vérifiez que `firebase-admin` est installé : `npm install firebase-admin`
- Vérifiez la configuration `FIREBASE_SERVICE_ACCOUNT` dans `.env`

### Erreur "Webhook Error"
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- Redémarrez Stripe CLI et copiez le nouveau secret

### Erreur "process is not defined"
- Utilisez `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY` côté frontend
- Utilisez `process.env.STRIPE_SECRET_KEY` côté backend

---

🎉 **Le système de paiement est prêt à l'emploi !**
