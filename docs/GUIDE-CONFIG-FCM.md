# 🔔 Guide : Configuration Firebase Cloud Messaging

## 📋 Étape par Étape

### Étape 1 : Obtenir la clé VAPID depuis Firebase Console

1. **Aller dans Firebase Console**
   - Ouvrir https://console.firebase.google.com
   - Sélectionner le projet `annonces-app-44d27`

2. **Accéder aux paramètres Cloud Messaging**
   - Project Settings (⚙️ en haut à gauche)
   - Onglet **Cloud Messaging**
   - Scroller jusqu'à **"Web Push certificates"**

3. **Générer ou copier la clé VAPID**
   - S'il y a déjà une clé VAPID : copier la clé (commence par `B...`)
   - Sinon : cliquer sur **"Generate key pair"** → copier la clé générée

### Étape 2 : Configurer dans le code

1. **Ouvrir le fichier** : `src/services/pushNotificationService.ts`

2. **Remplacer la ligne 8** :
   ```typescript
   const VAPID_KEY = "VOTRE_CLE_VAPID_ICI";
   ```

3. **Sauvegarder** le fichier

### Étape 3 : Tester les notifications

1. **Redémarrer l'application** :
   ```bash
   npm run dev
   ```

2. **Se connecter** à l'application

3. **Accepter les notifications** quand le navigateur le demande

4. **Vérifier dans la console** (F12) :
   ```
   ✅ Firebase Messaging initialisé
   ✅ Token FCM obtenu
   ✅ Notifications push initialisées avec succès
   ```

### Étape 4 : Vérifier que tout fonctionne

1. **Ouvrir Firestore** dans Firebase Console
2. **Chercher la collection** `user_tokens`
3. **Vérifier** qu'un document a été créé avec :
   - `userId` : votre UID
   - `fcmToken` : un token long
   - `enabled` : true

## 🎯 Fonctionnalités Actives

✅ **Badge de notification** dans le header (icône cloche)  
✅ **Compteur** de notifications non lues  
✅ **Dropdown** avec liste des notifications  
✅ **Marquage comme lu** au clic  
✅ **Icônes par type** (message, listing, order, etc.)  
✅ **Service worker** pour notifications background  

## 📱 Types de Notifications Supportés

- 💬 **Messages** : Nouveau message reçu
- 📝 **Annonces** : Match avec votre recherche
- 🛒 **Commandes** : Nouvelle commande, changement de statut
- ✅ **Vérification** : Document approuvé, badge obtenu
- ⚙️ **Système** : Maintenance, mise à jour

## 🔍 Dépannage

### "Notifications non supportées"
- **Solution** : Utiliser un navigateur moderne (Chrome, Firefox, Edge)

### "Permission refusée"
- **Solution** : Paramètres du navigateur → Notifications → Autoriser le site

### "Token FCM non obtenu"
- **Vérifier** que la clé VAPID est correcte
- **Vérifier** que le service worker est déployé
- **Console** : vérifier les erreurs

### "Notifications non reçues"
- **Vérifier** Firestore → collection `user_tokens`
- **Vérifier** que `enabled` est `true`
- **Console** : vérifier les logs

## 🚀 Prochaines Étapes

Une fois la clé VAPID configurée, vous pourrez :

1. **Tester** les notifications en créant une notification manuellement dans Firestore
2. **Implémenter** le backend (Cloud Functions) pour envoi automatique
3. **Configurer** les triggers Firestore pour chaque type de notification
4. **Déployer** en production

## 📚 Documentation

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Dernière mise à jour** : 27 janvier 2025  
**Prochaine action** : Générer la clé VAPID dans Firebase Console
