# Guide de Démarrage StudyMarket

## 🚀 Démarrage Rapide

### Option 1: Démarrage complet (Frontend + Backend)
```bash
npm run dev:full
```
Cette commande démarre :
- **Frontend** sur `http://localhost:5173/StudyMarket/`
- **Backend API** sur `http://localhost:3001`

### Option 2: Démarrage séparé

#### Frontend uniquement
```bash
npm run dev
```

#### Backend API uniquement
```bash
npm run server
```

## 🔧 Configuration

### Variables d'environnement
Créez un fichier `.env` à la racine :
```env
# Clé secrète Stripe (pour le backend)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Secret webhook Stripe
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 🧪 Test des Paiements

### Cartes de test Stripe
- ✅ **Succès** : `4242424242424242`
- 🔐 **Auth requise** : `4000002500003155`
- ❌ **Refusée** : `4000000000009995`

### Comment tester
1. Créez une annonce avec un prix
2. Allez sur la page de détails
3. Cliquez sur "Acheter maintenant"
4. Utilisez une carte de test
5. Vérifiez la confirmation

## 📡 Endpoints API

- `POST /api/create-payment-intent` - Créer un PaymentIntent
- `POST /api/confirm-payment` - Confirmer un paiement
- `POST /api/webhook/stripe` - Webhook Stripe
- `GET /api/test` - Test de l'API

## 🐛 Résolution de problèmes

### Erreur 404 sur /api/create-payment-intent
- Vérifiez que le serveur backend est démarré
- Vérifiez que le port 3001 est libre

### Erreur de devise Stripe
- Les devises doivent être en minuscules (`eur`, `usd`)
- Vérifiez la configuration dans `src/lib/stripe.ts`

### Erreur de clé Stripe
- Vérifiez que vos clés Stripe sont correctes
- Utilisez les clés de test en développement

## 🚀 Déploiement

### Frontend
```bash
npm run build
npm run deploy
```

### Backend
- Déployez `server.js` sur votre serveur
- Configurez les variables d'environnement
- Utilisez HTTPS en production
