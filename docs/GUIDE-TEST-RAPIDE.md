# 🧪 Guide de Test Rapide - Notifications Push

## 🎯 Test en 2 Minutes

### Étape 1 : Vérifier dans le Navigateur

1. **Ouvrir** : http://localhost:5175/StudyMarket/
2. **Se connecter** (si pas déjà fait)
3. **Ouvrir la console** (F12)
4. **Vérifier** ces logs :
   ```
   ✅ Firebase Messaging initialisé
   ✅ Token FCM obtenu
   ✅ Notifications push initialisées avec succès
   ```

### Étape 2 : Créer une Notification de Test

**Méthode 1 : Via Firebase Console (RECOMMANDÉ)**

1. **Aller sur** : https://console.firebase.google.com
2. **Sélectionner** : `annonces-app-44d27`
3. **Firestore Database** → Collections → Créer collection `notifications` (si n'existe pas)
4. **Ajouter un document** :
   - Cliquer sur "Ajouter un document"
   - **Field** : `userId`
     - **Type** : string
     - **Valeur** : Votre UID (trouvable dans la console du navigateur)
   - **Field** : `type`
     - **Type** : string  
     - **Valeur** : `system`
   - **Field** : `title`
     - **Type** : string
     - **Valeur** : `🎉 Test Notification`
   - **Field** : `message`
     - **Type** : string
     - **Valeur** : `Le système fonctionne !`
   - **Field** : `read`
     - **Type** : boolean
     - **Valeur** : `false`
   - **Field** : `createdAt`
     - **Type** : string
     - **Valeur** : `2025-01-27T10:00:00Z`
   - **Sauvegarder**

5. **Recharger** l'application (F5)

6. **Cliquer** sur l'icône 🔔 dans le header

7. **Vérifier** : La notification apparaît dans le dropdown

### Étape 3 : Tester le Marquage comme Lu

1. **Cliquer** sur la notification dans le dropdown
2. **Vérifier** :
   - La notification disparaît du compteur
   - Le badge revient à "0"
3. Dans Firestore : `read` devient `true`

## 🎯 Résultats Attendus

### ✅ Badge de Notification
- Icône 🔔 visible dans le header
- Badge "0" au démarrage
- Badge "1" après création de la notification test

### ✅ Dropdown
- S'ouvre au clic sur l'icône
- Affiche les notifications
- Supporte le clic pour marquer comme lu
- Affiche le nombre non lu

### ✅ Console
- Pas d'erreurs
- Logs de succès visibles

### ✅ Firestore
- Collection `user_tokens` avec votre token
- Collection `notifications` avec votre notification
- `read: false` → `read: true` au clic

## 🐛 Dépannage

### Badge "0" même avec notification
- Recharger la page (F5)
- Vérifier que `userId` correspond à votre UID
- Vérifier la console pour les erreurs

### Dropdown ne s'ouvre pas
- Vérifier les erreurs dans la console
- Vérifier que le composant est rendu

### Notification non affichée
- Vérifier que `createdAt` est une date valide
- Vérifier que les champs sont du bon type
- Vérifier la console pour les erreurs Firestore

## 📊 Checklist de Test

- [ ] Console sans erreurs
- [ ] Token FCM visible dans Firestore `user_tokens`
- [ ] Icône 🔔 visible dans le header
- [ ] Badge "0" au démarrage
- [ ] Notification créée dans Firestore
- [ ] Badge "1" après création
- [ ] Dropdown s'ouvre
- [ ] Notification affichée
- [ ] Clic marque comme lu
- [ ] Badge revient à "0"

---

**Temps estimé** : 2-3 minutes  
**Prochaine étape** : Créer une notification de test et vérifier !
