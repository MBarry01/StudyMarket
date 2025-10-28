# 🎓 StudyMarket - Plateforme de Marketplace pour Étudiants

Une plateforme moderne de marketplace dédiée aux étudiants pour acheter, vendre et échanger des articles entre campus.

---

## 🚀 Démarrage Rapide

### Installation

```bash
# Cloner le projet
git clone [URL_DU_REPO]
cd StudyMarket-Git

# Installer les dépendances frontend
npm install

# Installer les dépendances backend
cd package-server
npm install
cd ..
```

### Lancer l'application

```bash
# Terminal 1 : Backend (port 3001)
node server.js

# Terminal 2 : Frontend (port 5174)
npm run dev

# Terminal 3 : Stripe Webhook (développement local)
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

### Accéder à l'application

- **Frontend** : http://localhost:5174/StudyMarket/
- **Backend API** : http://localhost:3001

---

## 📚 Documentation Complète

**Toute la documentation est disponible dans le dossier [`/docs`](docs/README.md)**

### 🎯 Guides Essentiels

| Guide | Description | Temps |
|-------|-------------|-------|
| [**Démarrage Rapide**](docs/DEMARRAGE_RAPIDE.md) | Lancer l'app en 3 minutes | ⚡ 3 min |
| [**Résumé Modifications**](docs/RESUME_MODIFICATIONS.md) | Comprendre les changements récents | ⭐ 5 min |
| [**Guide de Test**](docs/GUIDE_TEST_COMPLET.md) | 10 scénarios de test | 🧪 15 min |
| [**Configuration Stripe**](docs/GUIDE-CONFIGURATION-STRIPE.md) | Setup paiements | 🔧 10 min |
| [**Configuration Firebase**](docs/FIREBASE_CONFIG_SIMPLE.md) | Setup base de données | 🔥 10 min |

### 📖 Documentation Complète

Consultez le **[README de la documentation](docs/README.md)** pour :
- Guides techniques détaillés
- Documentation du système de paiement
- Guides de configuration
- Troubleshooting et diagnostic
- Architecture et best practices

---

## ✨ Fonctionnalités

### 🛍️ Marketplace
- ✅ Création et gestion d'annonces
- ✅ Recherche et filtres avancés
- ✅ Catégorisation par type d'article
- ✅ Images multiples par annonce
- ✅ Géolocalisation des annonces
- ✅ Calcul d'itinéraire vers le vendeur

### 💳 Paiements
- ✅ **Paiement par carte** (Stripe Payment Element)
- ✅ Système de commandes professionnel
- ✅ Webhook sécurisé
- ✅ Récapitulatif des frais transparent
- ✅ Confirmation en temps réel
- ⏳ PayPal (à venir)
- ⏳ Lydia (à venir)
- ⏳ Paiement en espèces (à venir)

### 👤 Gestion Utilisateur
- ✅ Authentification Firebase
- ✅ Profils personnalisés
- ✅ Mes annonces
- ✅ Mes commandes
- ✅ Mes ventes
- ✅ Favoris

### 🗺️ Géolocalisation
- ✅ Carte interactive (Mapbox)
- ✅ Sélection de lieu de rencontre
- ✅ Affichage de la position
- ✅ Calcul d'itinéraire
- ✅ Mode sombre/clair

---

## 🛠️ Stack Technique

### Frontend
- **React** 18.3 avec TypeScript
- **Vite** 5.4 (build tool)
- **TailwindCSS** (styling)
- **Shadcn/ui** (composants UI)
- **React Router** (navigation)
- **Zustand** (state management)
- **Mapbox GL JS** (cartes)

### Backend
- **Node.js** avec Express
- **Stripe** API (paiements)
- **Firebase Admin SDK** (base de données)

### Base de données
- **Firebase Firestore** (NoSQL)
- **Firebase Storage** (images)
- **Firebase Authentication** (auth)

### Services externes
- **Stripe** - Paiements sécurisés
- **Mapbox** - Cartes et géolocalisation

---

## 📦 Structure du Projet

```
StudyMarket-Git/
├── src/                    # Code source frontend
│   ├── components/         # Composants React
│   │   ├── ui/            # Composants UI réutilisables
│   │   ├── listing/       # Composants d'annonces
│   │   ├── payment/       # Composants de paiement
│   │   └── checkout/      # Pages de commande
│   ├── pages/             # Pages de l'application
│   ├── stores/            # Zustand stores
│   ├── contexts/          # React contexts
│   ├── lib/               # Utilitaires et configs
│   └── types/             # Types TypeScript
│
├── docs/                   # 📚 Documentation complète
│   ├── README.md          # Index de la documentation
│   ├── DEMARRAGE_RAPIDE.md
│   ├── SYSTEME_PAIEMENT_COMPLET.md
│   └── ... (18 documents)
│
├── server.js              # Backend Express
├── package-server.json    # Dépendances backend
├── vite.config.ts         # Configuration Vite
├── .env                   # Variables d'environnement (backend)
└── stripe.env.example     # Exemple config Stripe
```

---

## 🔑 Configuration Requise

### Variables d'environnement

#### Backend (`.env`)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
PORT=3001
```

#### Frontend (`vite.config.ts`)
```typescript
define: {
  'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify('pk_test_...'),
  'import.meta.env.VITE_API_BASE': JSON.stringify('http://localhost:3001'),
  'import.meta.env.VITE_STRIPE_CURRENCY': JSON.stringify('EUR'),
}
```

### Index Firestore Requis

Créer les index composites dans Firebase Console :

```
Collection: orders
- userId (Ascending) + createdAt (Descending)

Collection: listings
- sellerId (Ascending) + createdAt (Descending)
```

Voir [CREER_INDEX_FIRESTORE.md](docs/CREER_INDEX_FIRESTORE.md) pour plus de détails.

---

## 🧪 Tests

### Tester un paiement

1. Démarrer les serveurs (voir Démarrage Rapide)
2. Aller sur une annonce
3. Cliquer "Acheter maintenant"
4. Choisir "Carte Bancaire"
5. Utiliser une carte de test Stripe :
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres

**Pour plus de scénarios** : voir [GUIDE_TEST_COMPLET.md](docs/GUIDE_TEST_COMPLET.md)

---

## 🐛 Problèmes Courants

### Le serveur ne démarre pas
```bash
# Vérifier que le port 3001 est libre
netstat -ano | findstr :3001

# Arrêter les processus Node.js existants
Get-Process node | Stop-Process -Force
```

### Webhook ne reçoit rien
```bash
# Vérifier que Stripe CLI est lancé
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

### Badge VENDU pas affiché
```bash
# Vider le cache du navigateur
Ctrl + F5 (Windows) ou Cmd + Shift + R (Mac)
```

**Pour plus de diagnostic** : voir [DIAGNOSTIC_BADGE_VENDU.md](docs/DIAGNOSTIC_BADGE_VENDU.md)

---

## 🚀 Déploiement

### Prérequis production

- [ ] Clés Stripe en mode Live
- [ ] Webhook Stripe configuré en production
- [ ] Variables d'environnement production configurées
- [ ] Index Firestore créés
- [ ] Règles de sécurité Firestore configurées
- [ ] HTTPS obligatoire

### Variables d'environnement production

Remplacer toutes les clés `test` par les clés `live` :
- `STRIPE_SECRET_KEY` → clé live
- `STRIPE_WEBHOOK_SECRET` → webhook prod
- `VITE_STRIPE_PUBLISHABLE_KEY` → clé publishable live

---

## 📊 Statistiques

- **Composants React** : 50+
- **Pages** : 15+
- **Endpoints API** : 4
- **Documents de doc** : 18
- **Lignes de code** : ~15,000

---

## 🤝 Contribution

Ce projet est en cours de développement actif. Pour contribuer :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 Licence

[À définir]

---

## 👥 Équipe

Développé avec ❤️ pour les étudiants.

---

## 📞 Support

- **Documentation** : [`/docs`](docs/README.md)
- **Issues** : [GitHub Issues]
- **Email** : [support@studymarket.com]

---

## 🎉 Remerciements

- **Stripe** pour l'API de paiement
- **Firebase** pour la base de données
- **Mapbox** pour les cartes
- **Shadcn/ui** pour les composants UI
- Tous les contributeurs !

---

**La plateforme est prête pour la production ! 🚀**

*Dernière mise à jour : 25 octobre 2025 - Version 2.0*


