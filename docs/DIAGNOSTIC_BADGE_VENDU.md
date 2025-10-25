# 🔍 Diagnostic : Badge "VENDU" invisible

## Problème
Le badge "VENDU" rouge n'apparaît pas sur une annonce qui a été vendue.

## ✅ Vérifications à faire

### 1. Vérifier dans Firebase Console que l'annonce a le statut "sold"

1. Ouvrez Firebase Console : https://console.firebase.google.com
2. Sélectionnez votre projet : `annonces-app-44d27`
3. Allez dans **Firestore Database** → **Data**
4. Ouvrez la collection `listings`
5. Trouvez votre annonce vendue
6. Vérifiez que le champ `status` est bien égal à `"sold"`

**Si `status` n'est PAS "sold"**, alors le webhook n'a pas fonctionné correctement.

### 2. Vérifier les logs du serveur backend

Le serveur backend doit afficher ces messages après un paiement réussi :

```
✅ Commande sauvegardée: pi_xxx Order ID: abc123
✅ Annonce marquée comme vendue: VQLQRBc8sbiRQlYAGx5l
```

**Comment voir les logs** :
1. Ouvrez le terminal où tourne `node server.js`
2. Cherchez les messages ci-dessus après un paiement

**Si vous ne voyez PAS ces messages**, le webhook ne reçoit pas les événements Stripe.

### 3. Vérifier que le `listing_id` est bien dans les métadonnées Stripe

Le PaymentIntent doit contenir `metadata.listing_id` pour que le serveur sache quelle annonce marquer comme vendue.

**Vérifier dans le code** :
Le fichier `src/components/payment/PaymentWrapper.tsx` doit envoyer le `listingId` dans les métadonnées.

### 4. Vérifier que le webhook Stripe est configuré

Dans Dashboard Stripe (https://dashboard.stripe.com/test/webhooks) :
- L'événement `payment_intent.succeeded` doit être coché
- L'URL du webhook doit pointer vers `http://localhost:3001/api/webhook/stripe`
- Le secret du webhook doit correspondre à `STRIPE_WEBHOOK_SECRET` dans `.env`

## 🔧 Solutions possibles

### Solution 1 : Marquer manuellement une annonce comme vendue (pour test)

Dans Firebase Console :
1. Firestore Database → listings → [votre annonce]
2. Cliquez sur "Edit field"
3. Modifiez `status` de `"active"` à `"sold"`
4. Rafraîchissez la page web

➡️ **Le badge "VENDU" devrait maintenant apparaître !**

### Solution 2 : Vérifier que le webhook reçoit les événements

Dans le terminal du serveur (`node server.js`), vous devriez voir :
```
Paiement réussi: pi_xxx
```

**Si vous ne voyez rien** :
- Le webhook n'est pas configuré correctement dans Stripe
- Le serveur n'écoute pas sur le bon port
- Le `STRIPE_WEBHOOK_SECRET` est incorrect

### Solution 3 : Utiliser Stripe CLI pour tester le webhook localement

```bash
# Installer Stripe CLI
stripe login

# Écouter les webhooks en local
stripe listen --forward-to localhost:3001/api/webhook/stripe

# Obtenir le webhook secret
stripe listen --print-secret

# Copier ce secret dans .env comme STRIPE_WEBHOOK_SECRET
```

Puis refaire un paiement test.

### Solution 4 : Vérifier que Firebase Admin est bien configuré

Le serveur doit afficher au démarrage :
```
✅ Firebase Admin initialisé
🚀 Serveur démarré sur http://localhost:3001
```

**Si vous voyez** :
```
⚠️ FIREBASE_SERVICE_ACCOUNT non configuré - persistance désactivée
```

Alors le serveur ne peut pas écrire dans Firestore.

**Solution** : Configurez Firebase Admin (voir `FIREBASE_CONFIG_SIMPLE.md`)

## 🧪 Test rapide

### Tester manuellement en changeant le statut dans Firestore :

1. Firebase Console → Firestore → `listings`
2. Trouvez une annonce active
3. Changez `status` de `"active"` à `"sold"`
4. Rafraîchissez votre page web
5. ✅ Le badge "VENDU" devrait apparaître en rouge

Si le badge apparaît après ce changement manuel, alors :
- ✅ Le code frontend fonctionne
- ❌ Le problème est dans le webhook backend qui ne met pas à jour Firestore

## 🔍 Code à vérifier

### Dans `src/components/listing/ListingCard.tsx` (ligne 173) :

```typescript
{/* Status Badge (VENDU) */}
{listing.status === 'sold' && (
  <Badge className="absolute top-3 left-3 bg-red-500 text-white font-bold px-4 py-2 rounded-full shadow-md border-0">
    VENDU
  </Badge>
)}
```

Ce code vérifie si `listing.status === 'sold'`.

### Dans `server.js` (lignes 121-134) :

```javascript
// Marquer l'annonce comme vendue
if (listingId) {
  try {
    await db.collection('listings').doc(listingId).update({
      status: 'sold',
      soldAt: (await import('firebase-admin')).firestore.FieldValue.serverTimestamp(),
      soldTo: pi.metadata?.buyer_id || null,
      updatedAt: (await import('firebase-admin')).firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Annonce marquée comme vendue:', listingId);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'annonce:', error);
  }
}
```

Ce code met à jour le statut dans Firestore après paiement réussi.

## 📊 Checklist de diagnostic

- [ ] Le serveur backend est lancé (`node server.js`)
- [ ] Firebase Admin est configuré (voir logs serveur)
- [ ] Le webhook Stripe est configuré avec le bon endpoint
- [ ] Le `STRIPE_WEBHOOK_SECRET` est correct dans `.env`
- [ ] Le PaymentIntent contient `metadata.listing_id`
- [ ] Les logs serveur affichent "✅ Annonce marquée comme vendue"
- [ ] Dans Firestore, le champ `status` est bien "sold"
- [ ] Le frontend a rechargé les données (rafraîchir la page)

## 🆘 Si rien ne fonctionne

1. **Testez le code du badge en changeant manuellement le statut dans Firestore**
   - Si le badge apparaît → Problème backend/webhook
   - Si le badge n'apparaît pas → Problème frontend

2. **Vérifiez la console navigateur (F12)**
   - Y a-t-il des erreurs JavaScript ?
   - Le `listing.status` est-il bien récupéré ?

3. **Ajoutez des console.log temporaires** dans `ListingCard.tsx` :
   ```typescript
   console.log('Listing status:', listing.status);
   console.log('Is sold?', listing.status === 'sold');
   ```

4. **Vérifiez que vous regardez la bonne annonce**
   - L'annonce affichée est-elle bien celle que vous avez vendue ?
   - Vérifiez l'ID de l'annonce dans l'URL

## ✅ Solution la plus probable

**Le webhook ne met pas à jour Firestore car :**
1. Firebase Admin n'est pas configuré OU
2. Le `listing_id` n'est pas dans les métadonnées du PaymentIntent OU
3. Le webhook ne reçoit pas les événements Stripe

**Test rapide** : Changez manuellement le statut dans Firestore pour vérifier que le frontend fonctionne.

