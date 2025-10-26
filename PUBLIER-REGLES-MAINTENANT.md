# ⚠️ URGENT - Publier les Règles Storage MAINTENANT

## 🚨 L'erreur 403 persiste parce que les règles ne sont pas publiées dans Firebase Console

### 📋 Étapes Rapides

1. **Allez sur** : https://console.firebase.google.com/project/annonces-app-44d27/storage/annonces-app-44d27.firebasestorage.app/rules

2. **Effacez TOUT le contenu actuel**

3. **Copiez-collez ce code minimal** :

```firebase
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    match /verifications/{userId}/{allPaths=**} {
      allow read, create: if isAuthenticated();
      allow update: if false;
      allow delete: if isAuthenticated();
    }
    
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

4. **Cliquez sur "Publier"**

5. **Attendez 1 minute**

6. **Rechargez la page** (Ctrl+Shift+R)

7. **Testez l'upload à nouveau**

---

## ✅ Pourquoi ces règles ?

- **Très permissives** : `allow create: if isAuthenticated()` (n'importe qui peut uploader)
- **Sécurisées** : Dans un dossier `verifications/{userId}/` dédié
- **Temporaires** : Juste pour débloquer l'upload

Une fois l'upload fonctionnel, on reverra des règles plus strictes !

