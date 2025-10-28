# 🚨 URGENT : Créer l'Index Firestore Maintenant

## ⚠️ Erreur Critique

Votre application ne peut **PAS** fonctionner sans cet index.

**Erreur** :
```
FirebaseError: The query requires an index.
```

---

## ✅ SOLUTION RAPIDE (2 minutes)

### 1. Cliquez sur le lien dans l'erreur

Dans la console du navigateur, copiez-collez ce lien :

```
https://console.firebase.google.com/v1/r/project/annonces-app-44d27/firestore/indexes?create_composite=CmBwcm9qZWN0cy9hbm5vbmNlcy1hcHAtNDRkMjcvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZGljdGlvR3JvdXBzL3ZlcmlmaWNhdGlvbl9yZXF1ZXN0cy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoPCgtyZXF1ZXN0ZWRBdBACGgwKCF9fbmFtZV9fEAI
```

### 2. Ou créez manuellement

1. Allez sur : https://console.firebase.google.com/project/annonces-app-44d27/firestore/indexes
2. Cliquez sur **"Create Index"**
3. Configurez :
   - **Collection ID** : `verification_requests`
   - **Champ 1** : `userId` → Ascending
   - **Champ 2** : `requestedAt` → Descending
4. Cliquez sur **"Create"**

### 3. Attendez 5-10 minutes

L'index est en cours de création (statut "Building" → "Enabled")

---

## 🔒 AUSSI : Créer les Règles Storage

### 1. Allez sur Storage

https://console.firebase.google.com/project/annonces-app-44d27/storage/rules

### 2. Copiez-collez ces règles

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // ... (gardez vos règles existantes) ...
    
    // ✅ AJOUTEZ CETTE RÈGLE :
    match /verifications/{userId}/{fileName} {
      allow read, write: if isOwner(userId)
                         && request.resource.size < 10 * 1024 * 1024
                         && (fileName.matches('.*\\.(pdf|jpg|jpeg|png)$'));
    }
  }
}
```

### 3. Cliquez sur "Publish"

---

## ⏱️ Résultat

**Après 5-10 minutes** :
- ✅ Index créé (statut "Enabled")
- ✅ Règles storage publiées
- ✅ Page de vérification fonctionne
- ✅ Upload de documents fonctionne

---

## ✅ Vérification

Une fois l'index créé :

1. Rafraîchissez la page (F5)
2. Vérifiez qu'il n'y a plus d'erreur dans la console
3. Testez l'upload de documents

---

**🎯 Dès que l'index est créé, tout fonctionnera parfaitement !** ⏱️

