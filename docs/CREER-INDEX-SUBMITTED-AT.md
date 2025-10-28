# ✅ Créer les index Firestore pour verification_requests

## 📋 Deux index à créer

### 1. Index userId + submittedAt (DESC)
```
Collection: verification_requests
Fields:
  - userId (Ascending)
  - submittedAt (Descending)
```

### 2. Index status + submittedAt (DESC)
```
Collection: verification_requests
Fields:
  - status (Ascending)
  - submittedAt (Descending)
```

---

## 🎯 Comment créer les index

### Via Firebase Console
1. Allez sur: https://console.firebase.google.com/project/annonces-app-44d27/firestore/indexes
2. Cliquez sur "Créer un index"
3. Collection: `verification_requests`
4. Ajoutez les champs:
   - Premier index: `userId` (Ascending), `submittedAt` (Descending)
   - Deuxième index: `status` (Ascending), `submittedAt` (Descending)
5. Créez l'index
6. Attendez 1-2 minutes

### Via lien direct
Cliquez sur ce lien qui pré-remplit le formulaire:
- https://console.firebase.google.com/project/annonces-app-44d27/firestore/indexes?create_composite=CmRwcm9qZWN0cy9hbm5vbmNlcy1hcHAtNDRkMjcvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3ZlcmlmaWNhdGlvbl9yZXF1ZXN0cy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoPCgtzdWJtaXR0ZWRBdBACGgwKCF9fbmFtZV9fEAM

---

## ⚠️ À faire d'abord

Avant de créer les nouveaux index, **supprimez les anciens** qui utilisent `requestedAt`:
- Allez sur les index "verification_requests"
- Supprimez ceux qui contiennent `requestedAt`
- Puis créez les nouveaux avec `submittedAt`

---

## 📝 Note

Le fichier `firestore.indexes.json` a été mis à jour avec `submittedAt`. Les index doivent être recréés dans la console car le nom du champ a changé.

