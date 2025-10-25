# Configuration de Stripe pour StudyMarket

Ce guide vous explique comment configurer Stripe pour les paiements par carte bancaire dans votre application StudyMarket.

## Prérequis

1. Un compte Stripe (créez-en un sur [stripe.com](https://stripe.com) si vous n'en avez pas)
2. Un projet Supabase (pour les Edge Functions)

## Étapes de configuration

### 1. Créer un compte Stripe

- Inscrivez-vous sur [stripe.com](https://stripe.com)
- Complétez les informations de votre compte
- Activez le mode test pour commencer

### 2. Récupérer vos clés API Stripe

Dans le dashboard Stripe :
- Allez dans "Développeurs" > "Clés API"
- Notez votre "Clé publique" (publishable key) et votre "Clé secrète" (secret key)

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine de votre projet en vous basant sur `.env.example` :

```
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 4. Configurer les Edge Functions Supabase

Dans votre projet Supabase :
1. Allez dans "Settings" > "Edge Functions"
2. Ajoutez les variables d'environnement suivantes :
   - `STRIPE_SECRET_KEY` : Votre clé secrète Stripe
   - `STRIPE_WEBHOOK_SECRET` : Vous l'obtiendrez à l'étape suivante

### 5. Configurer le webhook Stripe

1. Dans le dashboard Stripe, allez dans "Développeurs" > "Webhooks"
2. Cliquez sur "Ajouter un endpoint"
3. Entrez l'URL de votre fonction webhook : `https://[VOTRE_PROJET].supabase.co/functions/v1/webhook-stripe`
4. Sélectionnez les événements à écouter :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Cliquez sur "Ajouter un endpoint"
6. Notez le "Signing secret" généré et ajoutez-le comme variable d'environnement `STRIPE_WEBHOOK_SECRET` dans Supabase

### 6. Déployer les Edge Functions

Utilisez la console Supabase pour déployer les Edge Functions :
- `create-payment-intent`
- `webhook-stripe`

### 7. Tester les paiements

En mode test, vous pouvez utiliser les cartes de test suivantes :
- Carte réussie : `4242 4242 4242 4242`
- Carte refusée : `4000 0000 0000 0002`
- Date d'expiration : n'importe quelle date future
- CVC : n'importe quel nombre à 3 chiffres
- Code postal : n'importe quel code postal valide

## Passage en production

Lorsque vous êtes prêt à passer en production :
1. Complétez votre profil d'entreprise dans Stripe
2. Passez votre compte Stripe en mode production
3. Mettez à jour vos clés API avec les clés de production
4. Mettez à jour l'URL de webhook pour pointer vers votre environnement de production

## Ressources utiles

- [Documentation Stripe](https://stripe.com/docs)
- [Documentation Stripe.js](https://stripe.com/docs/js)
- [Documentation React Stripe.js](https://stripe.com/docs/stripe-js/react)
- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)