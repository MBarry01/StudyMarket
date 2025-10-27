# 🚨 URGENT : Créer l'Index Firestore pour les Notifications

## ❌ Erreur Actuelle

```
The query requires an index. You can create it here: 
https://console.firebase.google.com/v1/r/project/annonces-app-44d27/firestore/indexes?create_composite=Clhwcm9qZWN0cy9hbm5vbmNlcy1hcHAtNDRkMjcvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL25vdGlmaWNhdGlvbnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
```

## ✅ Solution Rapide (1 clic)

### Méthode 1 : Lien Direct (PLUS RAPIDE)

1. **Copier ce lien** :
   ```
   https://console.firebase.google.com/v1/r/project/annonces-app-44d27/firestore/indexes?create_composite=Clhwcm9qZWN0cy9hbm5vbmNlcy1hcHAtNDRkMjcvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL25vdGlmaWNhdGlvbnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
   ```

2. **Ouvrir dans votre navigateur**

3. **Cliquer sur "Créer"**

4. **Attendre 1-2 minutes**

### Méthode 2 : Firebase Console

1. **Aller sur** : https://console.firebase.google.com

2. **Sélectionner** : `annonces-app-44d27`

3. **Firestore Database** → **Indexes** → **Créer un index**

4. **Configurer** :
   - **Collection** : `notifications`
   - **Champ 1** : `userId` (Ascending)
   - **Champ 2** : `createdAt` (Descending)

5. **Créer**

## ⏱️ Après Création

1. **Attendre 1-2 minutes** que l'index soit créé
2. **Recharger** l'application (F5)
3. **L'erreur devrait disparaître** ✅

---

**Temps total** : 2-3 minutes  
**Action** : Criquer sur "Créer" dans Firebase Console
