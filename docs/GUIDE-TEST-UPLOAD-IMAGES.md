# 🔍 Guide de Test - Upload d'Images

## ✅ Corrections Appliquées

### 1. **Format de nom de fichier corrigé**
- **Avant** : `{timestamp}_{file.name}` (nom non standardisé)
- **Après** : `image_{timestamp}_{random}.{ext}` (compatible avec les règles Firebase)

### 2. **Validation des fichiers améliorée**
- Vérification du type MIME (JPG, PNG, WEBP uniquement)
- Vérification de la taille (max 15MB)
- Messages d'erreur clairs pour l'utilisateur

### 3. **Gestion des erreurs**
- Alert pour problèmes d'authentification
- Alert pour fichiers invalides
- Console log pour succès d'upload

---

## 🧪 Tests à Effectuer

### **Test 1: Vérifier l'authentification**
1. Ouvrez la console du navigateur (F12)
2. Allez sur la page "Créer une annonce"
3. Tapez : `console.log('User:', auth.currentUser)`
4. ✅ **Attendu** : Un objet utilisateur (pas `null`)
5. ❌ **Si null** : Connectez-vous d'abord

### **Test 2: Vérifier Firebase Storage**
1. Ouvrez la console Firebase : https://console.firebase.google.com
2. Projet : `annonces-app-44d27`
3. Allez dans **Storage** → **Files**
4. ✅ **Attendu** : Dossier `listings/` existe
5. ❌ **Si erreur** : Bucket non configuré

### **Test 3: Upload d'une image**
1. Sélectionnez "Vendre" comme type d'annonce
2. Cliquez sur "Ajouter" dans la section Photos
3. Sélectionnez une image JPG/PNG (< 15MB)
4. Observez la console :
   - **Spinner** : "Upload..." doit s'afficher
   - **Console** : Cherchez les messages d'erreur
   - **Succès** : Message `✅ 1 image(s) uploadée(s) avec succès`

---

## 🐛 Diagnostics des Erreurs Courantes

### **Erreur: "User not authenticated"**
**Cause** : Pas connecté
**Solution** :
```
1. Aller sur /auth
2. Se connecter avec un compte
3. Retourner sur /create-listing
```

### **Erreur: "Permission denied"**
**Cause** : Règles Firebase Storage trop strictes
**Solution** :
```
1. Aller sur Firebase Console
2. Storage → Rules
3. Vérifier que les règles correspondent à storage.rules
4. Déployer si nécessaire
```

### **Erreur: "storage/unknown"**
**Cause** : Bucket Firebase non configuré
**Solution** :
```
1. Firebase Console → Storage
2. Cliquer "Get Started"
3. Suivre les instructions
4. Redémarrer l'app
```

### **Erreur: "Network request failed"**
**Cause** : CORS ou connexion internet
**Solution** :
```
1. Vérifier la connexion internet
2. Vérifier les règles CORS de Firebase
3. Essayer avec un autre navigateur
```

---

## 🔧 Commandes de Débogage

### **Tester l'authentification**
```javascript
// Dans la console du navigateur
import { auth } from './src/lib/firebase';
console.log('Current User:', auth.currentUser);
console.log('UID:', auth.currentUser?.uid);
```

### **Tester Firebase Storage**
```javascript
// Dans la console du navigateur
import { storage } from './src/lib/firebase';
import { ref, listAll } from 'firebase/storage';

const listingsRef = ref(storage, 'listings');
listAll(listingsRef)
  .then(result => console.log('Dossiers:', result.prefixes))
  .catch(error => console.error('Erreur:', error));
```

### **Tester l'upload manuel**
```javascript
// Dans la console du navigateur
import { storage } from './src/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';

// Créer un fichier test
const testBlob = new Blob(['test'], { type: 'image/png' });
const testFile = new File([testBlob], 'test.png', { type: 'image/png' });

// Upload
const storageRef = ref(storage, 'listings/test/image_123456_0.png');
uploadBytes(storageRef, testFile)
  .then(() => console.log('✅ Upload réussi'))
  .catch(error => console.error('❌ Erreur:', error));
```

---

## 📋 Checklist de Vérification

- [ ] **Authentifié** : L'utilisateur est connecté
- [ ] **Storage activé** : Firebase Storage est configuré
- [ ] **Règles déployées** : Les règles `storage.rules` sont à jour
- [ ] **Formats valides** : Images JPG, PNG ou WEBP
- [ ] **Taille correcte** : Images < 15MB
- [ ] **Connexion internet** : Réseau fonctionnel
- [ ] **Console ouverte** : Pour voir les erreurs détaillées

---

## 🆘 Si Rien ne Fonctionne

### **Option 1: Règles temporaires (DÉVELOPPEMENT UNIQUEMENT)**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **Option 2: Vérifier le bucket**
```javascript
// Dans src/lib/firebase.ts
console.log('Storage Bucket:', storage.app.options.storageBucket);
// Devrait afficher: annonces-app-44d27.firebasestorage.app
```

### **Option 3: Test avec curl**
```bash
# Tester l'accès au bucket
curl https://firebasestorage.googleapis.com/v0/b/annonces-app-44d27.firebasestorage.app/o
```

---

## 📝 Rapport de Bug

Si le problème persiste, collectez ces informations :

```javascript
// Copiez-collez dans la console et envoyez le résultat
console.log({
  authenticated: !!auth.currentUser,
  userId: auth.currentUser?.uid,
  storageBucket: storage.app.options.storageBucket,
  projectId: storage.app.options.projectId,
  timestamp: new Date().toISOString()
});
```

---

## ✅ Test Final

1. **Créer une annonce de vente**
2. **Ajouter 3 images** (JPG, PNG, WEBP)
3. **Vérifier la console** : Pas d'erreurs
4. **Vérifier Firebase Storage** : Images présentes dans `listings/{userId}/`
5. **Publier l'annonce**
6. **Vérifier la page détail** : Images s'affichent

---

**Bon courage ! 🚀**


