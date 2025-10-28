# 🚨 URGENT : Configuration Email Immédiate

## ❌ Problème Identifié
**Vous n'avez PAS de fichier `.env` !** C'est pourquoi les emails ne sont pas envoyés.

## 🔧 Solution Immédiate (2 minutes)

### **Étape 1: Créer le fichier .env**
À la racine de votre projet, créez un fichier `.env` avec ce contenu :

```bash
# Configuration Email - StudyMarket
VITE_GMAIL_USER=votre.email@gmail.com
VITE_GMAIL_APP_PASSWORD=votre_mot_de_passe_application
```

### **Étape 2: Configurer Gmail**
1. **Aller sur votre compte Google**
2. **Sécurité → Authentification à 2 facteurs** (activer si pas fait)
3. **Mots de passe d'application**
4. **Créer un nouveau mot de passe pour "StudyMarket"**
5. **Copier le mot de passe généré**

### **Étape 3: Mettre à jour .env**
```bash
VITE_GMAIL_USER=votre.vrai.email@gmail.com
VITE_GMAIL_APP_PASSWORD=le_mot_de_passe_genere
```

## 🧪 Test Immédiat

1. **Sauvegarder le fichier .env**
2. **Redémarrer l'application** (`npm run dev`)
3. **Créer un compte test**
4. **Vérifier la console** (F12 → Console)

## 📋 Contenu Complet du .env

```bash
# Configuration Email - StudyMarket
VITE_GMAIL_USER=votre.email@gmail.com
VITE_GMAIL_APP_PASSWORD=votre_mot_de_passe_application

# Alternative Resend (gratuit)
# VITE_RESEND_API_KEY=re_votre_cle_api

# Configuration Firebase (déjà dans le code)
# VITE_FIREBASE_API_KEY=AIzaSyDXD6WpZoQNLNU0DAqH1wd3q9Q4vthOWv4
# VITE_FIREBASE_AUTH_DOMAIN=annonces-app-44d27.firebaseapp.com
# VITE_FIREBASE_PROJECT_ID=annonces-app-44d27

# Mode développement
VITE_USE_FIREBASE_EMULATORS=false
```

## 🔍 Vérification

Après configuration, vous devriez voir dans la console :
```
✅ Service de fallback Gmail disponible
📧 Tentative d'envoi via Firebase...
✅ Email de vérification envoyé via Firebase
```

## 🚨 Si le problème persiste

1. **Vérifier que le fichier .env est à la racine**
2. **Redémarrer l'application**
3. **Vérifier les erreurs dans la console**
4. **Vérifier que Gmail n'a pas bloqué l'application**

---

**⏱️ Temps estimé : 2 minutes maximum**
**🎯 Résultat : Emails de vérification fonctionnels**
