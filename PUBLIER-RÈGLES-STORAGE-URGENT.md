# 🚨 URGENT - Publier les règles Storage

## 📋 Étapes pour corriger l'erreur 403

1. **Allez sur Firebase Console** :
   https://console.firebase.google.com/project/annonces-app-44d27/storage/annonces-app-44d27.firebasestorage.app/rules

2. **Copiez-collez ce code** (règles minimales pour permettre l'upload) :

```firebase
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }
    match /verifications/{userId}/{fileName} {
      allow read, write: if isAuthenticated();
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Cliquez sur "Publier"**

4. **Attendez 30 secondes**

5. **Rechargez la page** (Ctrl+Shift+R)

6. **Essayez l'upload à nouveau**

## ⚠️ Important

Ces règles sont **très permissives** et uniquement pour tester. 
Une fois l'upload fonctionnel, revenez au fichier `storage.rules` local pour des règles plus sécurisées.

