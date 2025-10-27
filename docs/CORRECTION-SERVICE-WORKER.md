# 🔧 Correction - Service Worker

## ❌ Problème Identifié

```
Failed to execute 'subscribe' on 'PushManager': 
Subscription failed - no active Service Worker
```

**Cause** : Le service worker n'était pas actif avant d'essayer d'obtenir le token FCM.

## ✅ Solution Appliquée

### Avant (ne fonctionnait pas)
```typescript
const token = await getToken(messagingInstance, {
  vapidKey: VAPID_KEY,
  serviceWorkerRegistration: await navigator.serviceWorker.register(swPath)
});
```

### Après (corrigé)
```typescript
// 1. Enregistrer le service worker
registration = await navigator.serviceWorker.register(swPath);

// 2. Attendre qu'il soit actif
if (registration.installing) {
  await new Promise(resolve => {
    registration!.installing!.addEventListener('statechange', function() {
      if (this.state === 'activated') resolve();
    });
  });
}

// 3. Maintenant obtenir le token
const token = await getToken(messagingInstance, {
  vapidKey: VAPID_KEY,
  serviceWorkerRegistration: registration
});
```

## 🔄 Test

### 1. Recharger la Page (F5)

### 2. Vérifier la Console

Vous devriez voir :
```
✅ Service Worker enregistré: http://localhost:5175/StudyMarket/
✅ Firebase Messaging initialisé
✅ Token FCM obtenu: [...]
✅ Notifications push initialisées avec succès
```

### 3. Vérifier le Service Worker

1. **Ouvrir DevTools** (F12)
2. **Onglet "Application"**
3. **Section "Service Workers"**
4. **Vérifier** : `firebase-messaging-sw.js` actif

### 4. Vérifier Firestore

1. **Firestore Console** : https://console.firebase.google.com
2. **Collection** `user_tokens`
3. **Vérifier** : Document avec votre token

## ✅ Résultat Attendu

- ✅ Plus d'erreur "no active Service Worker"
- ✅ Token FCM obtenu
- ✅ Notifications push fonctionnelles
- ✅ Badge de notification affiché

---

**Status** : ✅ CORRIGÉ  
**Action** : Recharger la page (F5)
