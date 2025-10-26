# 📝 Publier les Règles Storage

## ✅ Votre fichier `storage.rules` est déjà correct !

Les règles pour `verifications/` sont déjà ajoutées (lignes 50-56).

---

## 🚀 Actions à Faire

### 1. Publier les Règles Storage

**Option A - Via Console (Recommandé)** :
1. Allez sur : https://console.firebase.google.com/project/annonces-app-44d27/storage/rules
2. Cliquez sur **"Publish"**

**Option B - Via CLI** :
```bash
firebase deploy --only storage
```

---

## ✅ Règle Ajoutée

Votre fichier contient maintenant :
```javascript
// Verification documents (pour système de vérification étudiante)
match /verifications/{userId}/{fileName} {
  allow read, write: if isOwner(userId)
                     && request.resource.size < 10 * 1024 * 1024 // 10MB max
                     && (fileName.matches('.*\\.(pdf|jpg|jpeg|png)$'));
  allow delete: if isOwner(userId);
}
```

**Cette règle permet** :
- ✅ L'utilisateur peut uploader dans son dossier `verifications/{userId}/`
- ✅ Fichiers PDF, JPG, PNG acceptés
- ✅ Max 10MB par fichier
- ✅ Seulement ses propres fichiers

---

## ⏱️ Résultat

Une fois publiées, les règles sont **instantanées** (contrairement aux index Firestore qui prennent 5-10 min).

**Rafraîchissez la page** et l'upload devrait fonctionner !

---

## 🎯 Prochaines Étapes

1. ✅ Publier les règles storage (maintenant)
2. ⏳ Créer l'index Firestore (si pas encore fait)
3. ⏳ Attendre 5-10 minutes
4. ✅ Tester l'upload de documents

**Les règles storage sont déjà dans votre fichier, il suffit de les publier !** 🚀

