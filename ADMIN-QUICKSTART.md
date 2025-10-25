# 🚀 Guide de démarrage rapide - Admin Dashboard

## ⚡ 3 étapes pour accéder au dashboard

### 1️⃣ Configurer le fichier `.env`

Si le fichier `.env` n'existe pas, créez-le à la racine du projet :

```bash
# Configuration Admin
VITE_ADMIN_EMAILS=votre-email@gmail.com
VITE_ADMIN_UIDS=

# Configuration API
VITE_API_BASE=http://localhost:3001

# (Autres variables déjà présentes...)
```

**Important** : Remplacez `votre-email@gmail.com` par l'email que vous utilisez pour vous connecter à StudyMarket.

### 2️⃣ Démarrer les serveurs

Dans **2 terminaux séparés** :

**Terminal 1 - Backend** :
```bash
npm run server
```

**Terminal 2 - Frontend** :
```bash
npm run dev
```

### 3️⃣ Accéder au dashboard

1. Ouvrez votre navigateur sur `http://localhost:5173` (ou le port affiché)
2. **Connectez-vous** avec votre compte (l'email doit correspondre à celui dans `.env`)
3. Cliquez sur **votre avatar** en haut à droite
4. Cliquez sur **"Administration"**

🎉 **C'est tout !** Vous êtes maintenant sur le dashboard admin.

---

## 📊 Que puis-je faire ?

### Dashboard Overview
- Voir les statistiques en temps réel
- KPIs : utilisateurs, annonces, commandes, revenus
- Alertes système

### Gestion des commandes (`/admin/orders`)
- Voir toutes les commandes
- **Rembourser** une commande payée
- **Rejouer** un webhook échoué
- Filtrer par statut, rechercher

### Gestion des utilisateurs (`/admin/users`)
- Voir tous les utilisateurs
- **Bloquer/Débloquer** un utilisateur
- **Vérifier** manuellement un compte
- **Changer le rôle** (user/admin/moderator)

### Gestion des annonces (`/admin/listings`)
- Voir toutes les annonces
- **Approuver** les annonces en attente
- **Retirer** ou **supprimer** des annonces

### Webhook Logs (`/admin/webhooks`)
- Voir les logs webhook Stripe
- **Retraiter** les webhooks échoués

### Payouts (`/admin/payouts`)
- Voir les demandes de payout vendeurs
- **Approuver** ou **rejeter** les payouts

### Audit Trail (`/admin/audit`)
- Historique complet de toutes les actions admin
- Traçabilité (qui, quoi, quand, où)

---

## 🐛 Problèmes fréquents

### Je ne vois pas le lien "Administration"
➡️ **Solution** : Vérifiez que votre email dans `.env` correspond exactement à celui de votre compte connecté.

### Erreur "Firebase Admin non configuré"
➡️ **Solution** : Vérifiez que le serveur backend (`npm run server`) est bien démarré et que la variable `FIREBASE_SERVICE_ACCOUNT` est dans votre `.env`.

### Les tables sont vides
➡️ **Solution** : C'est normal si les collections Firestore sont vides. Un message informatif s'affichera indiquant que la collection est vide. Les données réelles s'afficheront dès que vous aurez des utilisateurs, commandes, etc. sur la plateforme.

---

## 📚 Documentation complète

- **Résumé** : `docs/ADMIN-DASHBOARD-RESUME.md`
- **Documentation détaillée** : `docs/ADMIN-DASHBOARD.md`

---

**Bon courage !** 🎊

