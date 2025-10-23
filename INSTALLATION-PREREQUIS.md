# 🔧 Installation des Prérequis

## ❌ Problème Détecté
Node.js et Firebase CLI ne sont pas installés sur votre système.

## 🚀 Solutions

### **Option 1 : Installation Complète (Recommandée)**

#### 1. Installer Node.js
1. Allez sur [nodejs.org](https://nodejs.org/)
2. Téléchargez la version LTS (Long Term Support)
3. Installez avec les options par défaut
4. Redémarrez votre terminal/PowerShell

#### 2. Installer Firebase CLI
```bash
npm install -g firebase-tools
```

#### 3. Se connecter à Firebase
```bash
firebase login
```

#### 4. Déployer les index
```bash
firebase deploy --only firestore:indexes
```

### **Option 2 : Déploiement via Console Firebase (Alternative)**

Si vous ne pouvez pas installer Node.js, vous pouvez déployer les index via la console Firebase :

#### 1. Aller sur la Console Firebase
- Ouvrez [console.firebase.google.com](https://console.firebase.google.com)
- Sélectionnez votre projet `annonces-app-44d27`

#### 2. Aller dans Firestore
- Cliquez sur "Firestore Database"
- Allez dans l'onglet "Index"

#### 3. Créer les index manuellement
Ajoutez ces index un par un :

**Index 1 - Conversations :**
- Collection: `conversations`
- Champs: `participants` (Array-contains), `updatedAt` (Descending)

**Index 2 - Messages :**
- Collection: `messages`
- Champs: `conversationId` (Ascending), `sentAt` (Ascending)

**Index 3 - Favorites :**
- Collection: `favorites`
- Champs: `userId` (Ascending), `createdAt` (Descending)

**Index 4 - Orders :**
- Collection: `orders`
- Champs: `userId` (Ascending), `createdAt` (Descending)

### **Option 3 : Utiliser le fichier firestore.indexes.json**

1. Copiez le contenu de `firestore.indexes.json`
2. Allez dans Firebase Console > Firestore > Index
3. Cliquez sur "Import" et collez le contenu

## 📋 Vérification

Après installation, testez avec :
```bash
node --version
npm --version
firebase --version
```

## 🎯 Prochaines Étapes

Une fois Node.js installé :
1. ✅ Déployer les index Firebase
2. ✅ Configurer Supabase
3. ✅ Tester les corrections
4. ✅ Surveiller les performances

