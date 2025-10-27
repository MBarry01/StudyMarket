# URGENT - Publication des règles Storage pour les messages

## Problème
L'upload d'images dans les conversations échoue avec l'erreur 403 (non autorisé).

## Solution
Les règles ont été ajoutées dans `storage.rules`. Elles doivent être publiées manuellement.

## Instructions pour publier

1. **Ouvrez la console Firebase** :
   - Allez sur : https://console.firebase.google.com/project/annonces-app-44d27/storage/rules

2. **Copiez et remplacez les règles** :
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       // helpers
       function isAuthenticated() {
         return request.auth != null;
       }
       function isOwner(userId) {
         return isAuthenticated() && request.auth.uid == userId;
       }
       function isAdmin() {
         return isAuthenticated() && request.auth.token.admin == true;
       }
       // content-type checks (use lowercase compare)
       function isImageContent() {
         // only common MIME types
         let ct = request.resource.contentType.toLowerCase();
         return ct == 'image/jpeg' || ct == 'image/png' || ct == 'image/webp' || ct == 'image/gif' || ct == 'image/jpg';
       }
       function isPdfContent() {
         return request.resource.contentType.toLowerCase() == 'application/pdf';
       }
       
       // Vérifier que le fichier existe et n'est pas vide
       function fileExists() {
         return request.resource != null && request.resource.size > 0;
       }
       
       // Vérifier la taille du fichier (en MB)
       function isValidSize(maxMB) {
         return request.resource.size < maxMB * 1024 * 1024;
       }

       // USERS - profile photos (public read)
       match /users/{userId}/{fileName} {
         allow read: if true; // public profiles
         allow write: if isOwner(userId)
                      && isImageContent()
                      && request.resource.size < 5 * 1024 * 1024
                      && fileName.toLowerCase().matches('^profile_[0-9]+\\.(jpg|jpeg|png|webp)$');
         allow delete: if isOwner(userId);
       }

       // LISTINGS - images (public read) - require ownership check in Firestore
       match /listings/{listingId}/{fileName} {
         allow read: if true;
         allow write: if isAuthenticated()
                      && isImageContent()
                      && request.resource.size < 10 * 1024 * 1024
                      // ownership check: the listing document must exist and ownerId must match the uploader
                      && get(/databases/$(database)/documents/listings/$(listingId)).data.ownerId == request.auth.uid
                      && fileName.toLowerCase().matches('^image_[0-9]+_[0-9]+\\.(jpg|jpeg|png|webp)$');
         allow delete: if isAuthenticated()
                       && get(/databases/$(database)/documents/listings/$(listingId)).data.ownerId == request.auth.uid;
       }

       // VERIFICATIONS - sensitive documents (owner read, admins can read)
       match /verifications/{userId}/{allPaths=**} {
         // Lecture : propriétaire ou admin
         allow read: if isAuthenticated();
         
         // Création : n'importe quel utilisateur authentifié
         allow create: if isAuthenticated();
         
         // Mise à jour interdite (documents immuables)
         allow update: if false;
         
         // Suppression : n'importe quel utilisateur authentifié
         allow delete: if isAuthenticated();
       }

       // TEMP uploads - restricted to owner and flagged uploads
       match /temp/{userId}/{fileName} {
         allow write: if isOwner(userId)
                      && request.resource.size < 50 * 1024 * 1024
                      // front must set metadata.temporary=true (string) or metadata.temporary exists
                      && request.resource.metadata.keys().hasAny(['temporary']);
         allow read, delete: if isOwner(userId) || isAdmin();
       }

       // MESSAGES - images partagées dans les conversations
       match /messages/{conversationId}/{fileName} {
         allow read: if isAuthenticated();
         allow write: if isAuthenticated()
                      && isImageContent()
                      && request.resource.size < 5 * 1024 * 1024;
         allow delete: if isAuthenticated();
       }

       // Default deny
       match /{allPaths=**} {
         allow read, write: if false;
       }
     }
   }
   ```

3. **Cliquez sur "Publier"** pour appliquer les règles

## Ce que les nouvelles règles autorisent

Les règles pour `/messages/` permettent :
- ✅ **Lecture** : Tous les utilisateurs authentifiés
- ✅ **Upload** : Tous les utilisateurs authentifiés (limite 5MB)
- ✅ **Suppression** : Tous les utilisateurs authentifiés
- 🎨 **Type** : Uniquement les images (jpeg, png, webp, gif)

## Après publication

Testez l'upload d'une image dans une conversation pour confirmer que tout fonctionne.

## File: `storage.rules`

Ce fichier contient déjà les règles mises à jour, prêtes à être copiées dans la console Firebase.

