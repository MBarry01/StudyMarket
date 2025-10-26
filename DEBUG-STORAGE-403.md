# 🔍 Debug : Erreur 403 Storage

## ⚠️ Problème

L'upload se termine à 100% mais l'accès au fichier est refusé :
```
403 (Forbidden)
Firebase Storage: User does not have permission to access 'verifications/G4ZmfDKf01YAgEaqQXTkRuHJWSK2/...'
```

---

## 🔍 Causes Possibles

### 1. Règles Non Encore Actives
Les règles Storage peuvent prendre **1-2 minutes** pour se propager.

**Solution** : Attendre 1-2 minutes et réessayer

### 2. Format du Nom de Fichier
Le fichier s'appelle `document_1761481739333_PlanDrt.png`

La règle vérifie :
```javascript
fileName.matches('.*\\.(pdf|jpg|jpeg|png)$')
```

**Vérification** : Est-ce que ça devrait matcher ?

Oui ! `.*\\.(pdf|jpg|jpeg|png)$` devrait matcher `PlanDrt.png` ✅

### 3. Permission de Lecture
La règle actuelle :
```javascript
allow read, write: if isOwner(userId)
```

**Problème** : `read` nécessite `isOwner(userId)`, mais quand on récupère le fichier après upload, `request.auth` pourrait être différent.

---

## ✅ Solution Immédiate

**Modifiez temporairement la règle pour autoriser la lecture** :

```javascript
// Verification documents (TEMPORAIRE - DEBUG)
match /verifications/{userId}/{fileName} {
  // Permettre write uniquement au propriétaire
  allow write: if isOwner(userId)
               && request.resource.size < 10 * 1024 * 1024
               && (fileName.matches('.*\\.(pdf|jpg|jpeg|png)$'));
  
  // Permettre read à tous (TEMPORAIRE)
  allow read: if true;
  
  allow delete: if isOwner(userId);
}
```

**Attention** : C'est temporaire pour debug ! 

---

## 🔍 Vérification Alternative

**Créez un fichier `test-storage.ts`** pour tester les règles :

```typescript
import { storage } from './lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async function testUpload() {
  const userId = 'G4ZmfDKf01YAgEaqQXTkRuHJWSK2';
  const testFile = new Blob(['test'], { type: 'text/plain' });
  const path = `verifications/${userId}/test.txt`;
  
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, testFile);
    console.log('✅ Upload réussi');
    
    const url = await getDownloadURL(storageRef);
    console.log('✅ URL récupérée:', url);
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testUpload();
```

---

## 🎯 Prochaine Étape

1. **Vérifiez** que les règles sont publiées dans la console
2. **Attendez** 1-2 minutes
3. **Réessayez** l'upload
4. Si ça ne marche toujours pas, testez avec la règle temporaire ci-dessus

**Dites-moi ce que vous voyez !** 🔍

