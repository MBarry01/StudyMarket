# 🚨 Guide de résolution - Problème d'upload de photos

## 🔍 Diagnostic du problème

L'erreur CORS indique que Firebase Storage bloque les requêtes depuis votre application locale :
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'http://localhost:5180' has been blocked by CORS policy
```

## 🛠️ Solutions à essayer dans l'ordre

### Solution 1 : Configuration CORS Firebase Storage (Recommandée)

#### Étape 1 : Installer Google Cloud SDK
```powershell
# Option 1 : Via winget
winget install Google.CloudSDK

# Option 2 : Téléchargement manuel
# https://cloud.google.com/sdk/docs/install
```

#### Étape 2 : Configurer les règles CORS
```powershell
# Exécuter le script PowerShell
.\setup-firebase-cors.ps1

# Ou manuellement
gsutil cors set cors.json gs://annonces-app-44d27.appspot.com
```

#### Étape 3 : Vérifier la configuration
```powershell
gsutil cors get gs://annonces-app-44d27.appspot.com
```

### Solution 2 : Vérifier les règles de sécurité Firebase Storage

Dans Firebase Console > Storage > Rules, assurez-vous d'avoir :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Solution 3 : Utiliser Supabase Storage (Alternative)

Si Firebase continue à poser problème, utilisez Supabase :

1. **Déployer la fonction Edge** :
```bash
cd supabase/functions/upload-profile-photo
supabase functions deploy upload-profile-photo
```

2. **Créer le bucket Storage** :
```sql
-- Dans Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true);
```

3. **Modifier le composant** pour utiliser Supabase au lieu de Firebase

### Solution 4 : Configuration de développement

#### Vérifier les variables d'environnement
```bash
# .env.local
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
```

#### Utiliser les émulateurs Firebase
```bash
# Démarrer les émulateurs
firebase emulators:start

# Dans .env.local
VITE_USE_FIREBASE_EMULATORS=true
```

## 🔧 Dépannage avancé

### Vérifier la console Firebase
1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionner votre projet
3. Storage > Rules
4. Vérifier que les règles permettent l'upload

### Tester avec Postman/Insomnia
```http
POST https://firebasestorage.googleapis.com/v0/b/annonces-app-44d27.appspot.com/o
Content-Type: image/jpeg
Authorization: Bearer YOUR_ID_TOKEN

# Body : fichier image
```

### Vérifier les logs Firebase
```bash
firebase functions:log
firebase storage:rules:deploy
```

## 📱 Test de la solution

1. **Redémarrer l'application** après configuration CORS
2. **Vider le cache** du navigateur
3. **Tester l'upload** avec une petite image (< 1MB)
4. **Vérifier les logs** dans la console du navigateur

## 🚨 Si rien ne fonctionne

### Option 1 : Utiliser Supabase Storage
- Plus simple à configurer
- Meilleure gestion CORS par défaut
- Intégration native avec votre stack

### Option 2 : Service d'upload tiers
- Cloudinary (gratuit jusqu'à 25GB)
- ImgBB (gratuit)
- Uploadcare

### Option 3 : Stockage local temporaire
- Stocker les images en base64
- Limiter à 1-2MB par image
- Solution temporaire en attendant la résolution

## 📞 Support

Si le problème persiste :
1. Vérifier les logs Firebase Console
2. Tester avec un projet Firebase vierge
3. Contacter le support Firebase
4. Considérer la migration vers Supabase

## ✅ Checklist de résolution

- [ ] Google Cloud SDK installé
- [ ] Règles CORS configurées
- [ ] Règles de sécurité Firebase Storage vérifiées
- [ ] Application redémarrée
- [ ] Cache navigateur vidé
- [ ] Test avec petite image
- [ ] Logs vérifiés
- [ ] Alternative Supabase testée si nécessaire
