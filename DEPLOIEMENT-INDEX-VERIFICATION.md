# 🚀 Déploiement Index Firestore - Vérifications

## ⚠️ Problème Actuel

**Erreur** :
```
FirebaseError: The query requires an index. 
verification_requests (status + requestedAt)
```

## ✅ Solution : Déployer les Index

### Option 1 : Via Firebase CLI (Recommandé)

```bash
# Installer Firebase CLI si pas déjà fait
npm install -g firebase-tools

# Se connecter
firebase login

# Déployer les index
firebase deploy --only firestore:indexes
```

**Résultat** :
```
✔  Deploy complete!
Firestore indexes deployed
```

### Option 2 : Via Console Web

**Cliquer sur le lien dans l'erreur** :
```
https://console.firebase.google.com/v1/r/project/annonces-app-44d27/firestore/indexes?create_composite=CmBwcm9qZWN0cy9hbm5vbmNlcy1hcHAtNDRkMjcvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3ZlcmlmaWNhdGlvbl9yZXF1ZXN0cy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoPCgtyZXF1ZXN0ZWRBdBABGgwKCF9fbmFtZV9fEAE
```

Ou :

1. Allez sur : https://console.firebase.google.com/project/annonces-app-44d27/firestore/indexes
2. Cliquez sur **"Create Index"**
3. Configurez :
   - **Collection ID** : `verification_requests`
   - **Status** : Index on
   - **Fields** :
     - `status` : Ascending
     - `requestedAt` : Ascending
4. Cliquez sur **"Create"**

---

## ⏱️ Temps de Création

**Les index prennent 2-5 minutes** pour être créés.

Vérifier le statut sur :
https://console.firebase.google.com/project/annonces-app-44d27/firestore/indexes

**Status** :
- `Building` : En cours de création
- `Enabled` : Prêt à utiliser ✅

---

## 📋 Index Nécessaires

Le fichier `firestore.indexes.json` contient déjà ces index :

1. ✅ `verification_requests (userId + requestedAt)`
2. ✅ `verification_requests (status + requestedAt)` ⚠️ À déployer
3. ✅ `users (displayName)`
4. ✅ `users (university + createdAt)`

---

## 🧪 Test Après Déploiement

1. Attendre 2-5 minutes que l'index soit créé
2. Rafraîchir la page (F5)
3. Vérifier que l'erreur n'apparaît plus

---

## 🎯 Solution Rapide (Temporaire)

Si vous voulez tester **MAINTENANT** sans attendre :

**Option A** : Cliquer sur le lien dans l'erreur (création automatique)

**Option B** : Modifier `verificationService.ts` temporairement (non recommandé)

---

## ✅ Résultat Attendu

Après déploiement des index :
- ✅ Plus d'erreur d'index
- ✅ Page admin verifications fonctionne
- ✅ Liste des demandes s'affiche correctement

---

**Déployez les index maintenant et attendez 2-5 minutes !** ⏱️

