# 🔧 Correction des Règles Firebase Storage

## ❌ Problème Identifié

Les utilisateurs ne peuvent pas uploader des images lors de la création d'annonces. Erreur 403 Forbidden.

### Erreur Console:
```
Firebase Storage: User does not have permission to access 
'listings/q8R6wG9lNAOKJnCuUgMFpZFRHKg1/image_1761661764670_1360.jpg'
```

## 🔍 Cause du Problème

Les anciennes règles Storage vérifiaient l'existence d'un document listing dans Firestore AVANT l'upload. Mais on upload les images AVANT de créer le document listing.

```javascript
// ❌ Ancienne règle (incorrecte)
match /listings/{listingId}/{fileName} {
  allow write: if isAuthenticated()
    && get(/databases/$(database)/documents/listings/$(listingId))
         .data.ownerId == request.auth.uid
}
```

Cette règle échoue car le document n'existe pas encore au moment de l'upload.

## ✅ Solution Appliquée

Les règles ont été corrigées pour autoriser l'upload dans un dossier par utilisateur :

```javascript
// ✅ Nouvelle règle (correcte)
match /listings/{userId}/{fileName} {
  allow read: if true; // Lecture publique
  
  allow write: if isAuthenticated()
               && isOwner(userId)  // userId dans le path doit matcher auth.uid
               && isImageContent()
               && isValidSize(15)
               && fileName.matches('^(image_|photo_)[0-9]+_[0-9]+\\.(jpg|jpeg|png|webp)$');
  
  allow delete: if isOwner(userId);
}
```

### Changements principaux :
1. **Structure** : `listings/{userId}/{fileName}` au lieu de `listings/{listingId}/{fileName}`
2. **Pas de vérification Firestore** : Plus besoin que le document existe avant l'upload
3. **Vérification ownership** : Le userId dans le path doit correspondre à l'utilisateur authentifié
4. **Taille** : 15MB max au lieu de 10MB
5. **Format** : Accepte `image_` ou `photo_` comme préfixe

## 📤 Publication des Règles Corrigées

### Option 1 : Via la Console Firebase (Recommandé)

1. Ouvrez : https://console.firebase.google.com/project/annonces-app-44d27/storage/rules
2. Copiez tout le contenu de `storage.rules`
3. Collez-le dans l'éditeur
4. Cliquez sur **"Publier"**
5. Attendez 1-2 minutes pour que les règles se propagent

### Option 2 : Via Firebase CLI

```bash
firebase deploy --only storage
```

## ✅ Vérification

Après publication des règles, testez en créant une nouvelle annonce :
1. Allez sur `/create`
2. Remplissez le formulaire
3. Upload des images
4. ✅ Plus d'erreur 403 !

## 📝 Structure Finale

```
Firebase Storage:
├── users/{userId}/
│   └── profile_[timestamp].jpg  (photos de profil)
├── listings/{userId}/            ← NOUVEAU !
│   ├── image_[timestamp]_[random].jpg
│   ├── photo_[timestamp]_[random].png
│   └── ...
├── messages/{conversationId}/
│   └── [fichiers de conversation]
└── verifications/{userId}/
    └── [documents de vérification]
```

## 🔒 Sécurité

Les nouvelles règles garantissent :
- ✅ Seul le propriétaire peut uploader dans son dossier
- ✅ Format de fichier validé (jpg, jpeg, png, webp)
- ✅ Taille maximale de 15MB
- ✅ Lecture publique pour afficher les images
- ✅ Suppression réservée au propriétaire

## ⚠️  Important

Les anciennes images dans la structure `listings/{listingId}/` ne seront plus accessibles après publication des nouvelles règles. Si vous avez déjà des images, vous devrez les re-uploader avec la nouvelle structure.

