# Guide de Configuration Stripe pour StudyMarket

## 🚀 Installation et Configuration

### 1. Installation des dépendances
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Configuration des clés Stripe

#### A. Créer un compte Stripe
1. Allez sur [stripe.com](https://stripe.com)
2. Créez un compte ou connectez-vous
3. Accédez au [Dashboard Stripe](https://dashboard.stripe.com)

#### B. Récupérer vos clés API
1. Dans le Dashboard, allez dans **Developers > API keys**
2. Copiez votre **Publishable key** (commence par `pk_test_`)
3. Copiez votre **Secret key** (commence par `sk_test_`)

#### C. Configurer les variables d'environnement
Créez un fichier `.env.local` à la racine du projet :

```env
# Clé publique Stripe (visible côté client)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique_ici

# Clé secrète Stripe (côté serveur uniquement)
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_ici

# Secret pour les webhooks
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret_ici
```

## 🛠️ Composants Créés

### 1. Configuration Stripe (`src/lib/stripe.ts`)
- Configuration des clés Stripe
- Options d'apparence pour les éléments
- Support du mode dark/light

### 2. Provider Stripe (`src/components/payment/StripePaymentProvider.tsx`)
- Wrapper pour les composants de paiement
- Gestion automatique du thème

### 3. Formulaire de Paiement (`src/components/payment/PaymentForm.tsx`)
- Formulaire complet avec PaymentElement
- Gestion des erreurs et états de chargement
- Interface utilisateur moderne

### 4. Bouton de Paiement Rapide (`src/components/payment/QuickPaymentButton.tsx`)
- Bouton intégré dans les annonces
- Modal de paiement rapide
- Validation automatique

### 5. Page de Checkout (`src/pages/CheckoutPage.tsx`)
- Page complète de finalisation d'achat
- Résumé de commande
- Informations vendeur

### 6. Page de Succès (`src/pages/PaymentSuccessPage.tsx`)
- Confirmation de paiement
- Redirection vers les bonnes pages

## 🔧 API Backend (Exemple)

### Endpoint de création de PaymentIntent
```typescript
// POST /api/create-payment-intent
export async function createPaymentIntent(req: any, res: any) {
  const { amount, currency = 'eur' } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convertir en centimes
    currency: currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
  });
  
  res.json({ client_secret: paymentIntent.client_secret });
}
```

### Webhook pour les événements
```typescript
// POST /api/webhook/stripe
export async function handleWebhook(req: any, res: any) {
  const event = stripe.webhooks.constructEvent(
    req.body, 
    req.headers['stripe-signature'], 
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Marquer l'annonce comme vendue
      // Envoyer email de confirmation
      break;
  }
  
  res.json({ received: true });
}
```

## 🎨 Personnalisation

### Apparence des éléments Stripe
```typescript
const stripeOptions = {
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#ffffff',
      colorText: '#1a202c',
      borderRadius: '8px',
    },
  },
};
```

### Mode sombre
```typescript
const stripeDarkOptions = {
  appearance: {
    theme: 'night',
    variables: {
      colorBackground: '#1a202c',
      colorText: '#f7fafc',
    },
  },
};
```

## 🧪 Tests

### Cartes de test Stripe
| Numéro | Description |
|--------|-------------|
| `4242424242424242` | Paiement réussi |
| `4000002500003155` | Authentification requise |
| `4000000000009995` | Carte refusée |

### Test complet
1. Créez une annonce avec un prix
2. Allez sur la page de détails
3. Cliquez sur "Acheter maintenant"
4. Utilisez une carte de test
5. Vérifiez la redirection vers la page de succès

## 🔒 Sécurité

### ⚠️ Points importants
- **JAMAIS** exposer la clé secrète côté client
- Toujours valider les montants côté serveur
- Utiliser HTTPS en production
- Configurer les webhooks pour les événements

### Variables d'environnement
```env
# ✅ Correct - Clé publique
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ❌ Incorrect - Clé secrète côté client
REACT_APP_STRIPE_SECRET_KEY=sk_test_...
```

## 📱 Intégration dans l'App

### Bouton dans ListingDetailPage
```tsx
<QuickPaymentButton 
  listing={listing} 
  className="w-full"
/>
```

### Page de checkout complète
```tsx
<Route path="/checkout/:id" element={<CheckoutPage />} />
```

## 🚀 Déploiement

### Variables d'environnement en production
1. Remplacez les clés de test par les clés live
2. Configurez les webhooks en production
3. Testez avec de vraies cartes (petits montants)

### Checklist de déploiement
- [ ] Clés live configurées
- [ ] Webhooks configurés
- [ ] HTTPS activé
- [ ] Tests de paiement effectués
- [ ] Monitoring configuré

## 📞 Support

### Ressources utiles
- [Documentation Stripe](https://stripe.com/docs)
- [React Stripe.js](https://stripe.com/docs/stripe-js/react)
- [Webhooks Stripe](https://stripe.com/docs/webhooks)
- [Testing Stripe](https://stripe.com/docs/testing)

### En cas de problème
1. Vérifiez les clés API
2. Consultez les logs du serveur
3. Testez avec les cartes de test
4. Vérifiez la configuration des webhooks
