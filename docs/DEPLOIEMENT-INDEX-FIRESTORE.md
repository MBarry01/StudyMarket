# 📊 Déploiement Index Firestore

## ⚠️ IMPORTANT

Le fichier `firestore.indexes.json` a été mis à jour avec les nouveaux index nécessaires pour le système de vérification.

**Vous DEVEZ déployer ces index** pour que les requêtes fonctionnent correctement.

---

## 🚀 Déploiement Automatique (Recommandé)

### Option 1 : Via Firebase CLI

```bash
# Installer Firebase CLI (si pas déjà installé)
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Déployer les index
firebase deploy --only firestore:indexes
```

### Option 2 : Création Manuelle via Console

Si vous préférez créer les index manuellement :

1. Allez sur : https://console.firebase.google.com/project/annonces-app-44d27
2. **Firestore Database** > **Indexes**
3. Créez ces index composés :

#### Index 1 : verification_requests (userId + requestedAt)
- **Collection ID** : `verification_requests`
- **Champs** :
  - `userId` : Ascending
  - `requestedAt` : Descending
- **Statut** : Enabled

#### Index 2 : verification_requests (status + requestedAt)
- **Collection ID** : `verification_requests`
- **Champs** :
  - `status` : Ascending
  - `requestedAt` : Ascending
- **Statut** : Enabled

#### Index 3 : users (displayName)
- **Collection ID** : `users`
- **Champs** :
  - `displayName` : Ascending
- **Statut** : Enabled

#### Index 4 : users (university + createdAt)
- **Collection ID** : `users`
- **Champs** :
  - `university` : Ascending
  - `createdAt` : Descending
- **Statut** : Enabled

---

## ⏱️ Temps de Création

**Les index peuvent prendre 5-10 minutes pour être créés.**

Vous pouvez vérifier leur statut sur :
https://console.firebase.google.com/project/annonces-app-44d27/firestore/indexes

---

## 🧪 Test Après Déploiement

Une fois les index créés, testez :

1. Page de vérification : http://localhost:5177/StudyMarket/verification
2. Admin vérifications : http://localhost:5177/StudyMarket/admin/verifications
3. Recherche utilisateurs : Test sur la page admin users

**Si vous voyez encore l'erreur d'index** : Attendez que les index soient créés (status = "Building" ou "Enabled").

---

## 📝 Index Ajoutés

```json
{
  "verification_requests": [
    { "userId": "ASC", "requestedAt": "DESC" },
    { "status": "ASC", "requestedAt": "ASC" }
  ],
  "users": [
    { "displayName": "ASC" },
    { "university": "ASC", "createdAt": "DESC" }
  ]
}
```

---

## ⚠️ Note

Les requêtes **ne fonctionneront pas** tant que les index ne sont pas créés.  
Vous verrez l'erreur : `FirebaseError: The query requires an index`

**Solution temporaire** : Le code inclut un fallback qui trie manuellement côté client si l'index n'est pas disponible (mais cela n'est plus nécessaire une fois les index déployés).

---

**🎯 Une fois les index déployés, toutes les fonctionnalités de vérification fonctionneront parfaitement !**

