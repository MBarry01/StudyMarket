# 🔥 Créer l'Index Firestore pour les Notifications

## ❌ Problème

Firestore nécessite un index composite pour la requête des notifications par `userId` et `createdAt`.

## ✅ Solution

### Option 1 : Créer via le lien automatique (RECOMMANDÉ)

1. **Cliquer sur le lien dans la console** :
   ```
   https://console.firebase.google.com/v1/r/project/annonces-app-44d27/firestore/indexes?create_composite=Clhwcm9qZWN0cy9hbm5vbmNlcy1hcHAtNDRkMjcvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL25vdGlmaWNhdGlvbnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
   ```

2. **Cliquer sur "Créer"** dans Firebase Console

3. **Attendre 1-2 minutes** que l'index soit créé

### Option 2 : Créer manuellement

1. **Aller dans Firebase Console** :
   - https://console.firebase.google.com
   - Sélectionner le projet `annonces-app-44d27`

2. **Accéder à Firestore** :
   - Firestore Database → Indexes

3. **Créer un nouvel index** :
   - **Collection ID** : `notifications`
   - **Champ 1** : `userId` - Ascending
   - **Champ 2** : `createdAt` - Descending
   - **Query scope** : Collection

4. **Cliquer sur "Créer"**

### Vérification

Une fois l'index créé, recharger la page. L'erreur devrait disparaître.

---

**Temps estimé** : 1-2 minutes  
**Action requise** : Créer l'index dans Firestore
