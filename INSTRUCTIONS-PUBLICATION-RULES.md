# 📋 Instructions - Publication des Règles Storage

## 🔥 Étapes pour Publier dans Firebase Console

### 1. **Ouvrez Firebase Console**
```
https://console.firebase.google.com/project/annonces-app-44d27/storage/annonces-app-44d27.firebasestorage.app/rules
```

### 2. **Collez le Code Complet**
Copiez tout le contenu du fichier `storage.rules` (73 lignes)

### 3. **Cliquez sur "Publier"**

### 4. **Attendez 30 secondes**

### 5. **Rechargez votre application**
- Arrêtez le serveur (Ctrl+C)
- Relancez : `npm run dev`

### 6. **Testez l'upload**
Allez sur `/verification` et essayez d'uploader un document

---

## ✅ Contenu du Fichier

Le fichier `storage.rules` contient :
- ✅ **Helpers** : isAuthenticated, isOwner, isAdmin, isImageContent, isPdf
- ✅ **USERS** : Photos de profil (public read)
- ✅ **LISTINGS** : Images publiques avec vérification ownership
- ✅ **VERIFICATIONS** : Documents sensibles (lignes 48-56) ⭐ CRITIQUE
- ✅ **TEMP** : Uploads temporaires
- ✅ **Default deny** : Sécurité par défaut

---

## 🎯 Règles Vérifications (Lignes 48-56)

```firebase
match /verifications/{userId}/{fileName} {
  allow read: if isOwner(userId);
  allow create: if isAuthenticated()
                && request.resource != null
                && request.resource.size < 10 * 1024 * 1024;
  allow update: if false;
  allow delete: if isAuthenticated();
}
```

Ces règles permettent :
- **read** : Seulement le propriétaire
- **create** : Tous les utilisateurs authentifiés (< 10MB)
- **update** : Interdit
- **delete** : Tous les utilisateurs authentifiés

