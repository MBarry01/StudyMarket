# 🔍 Vérifier les logs du serveur

## Comment vérifier si le système fonctionne

### 1. Ouvrez le terminal où tourne `node server.js`

### 2. Au démarrage, vous devez voir :

✅ **Bon** :
```
✅ Firebase Admin initialisé
🚀 Serveur démarré sur http://localhost:3001
```

❌ **Mauvais** :
```
⚠️ FIREBASE_SERVICE_ACCOUNT non configuré - persistance désactivée
🚀 Serveur démarré sur http://localhost:3001
```

➡️ **Si vous voyez le message d'avertissement**, Firebase Admin n'est PAS configuré et le serveur ne peut PAS écrire dans Firestore.

### 3. Après un paiement test, vous devez voir :

✅ **Bon** (le système fonctionne) :
```
create-payment-intent payload: {"items":[{"id":"VQLQRBc8sbiRQlYAGx5l",...}],...}
Paiement réussi: pi_3ABC123def456...
✅ Commande sauvegardée: pi_3ABC123def456... Order ID: xyz789
✅ Annonce marquée comme vendue: VQLQRBc8sbiRQlYAGx5l
```

❌ **Mauvais** (aucun message après paiement) :
```
[... rien ...]
```

➡️ **Si vous ne voyez RIEN après le paiement**, le webhook ne reçoit pas les événements Stripe.

## 🔧 Que faire selon les logs ?

### Cas 1 : Firebase Admin non configuré

**Vous voyez** :
```
⚠️ FIREBASE_SERVICE_ACCOUNT non configuré - persistance désactivée
```

**Solution** :
1. Téléchargez la clé de service depuis Firebase Console
2. Ajoutez-la dans `.env` comme `FIREBASE_SERVICE_ACCOUNT`
3. Relancez le serveur : `node server.js`

Voir le fichier `FIREBASE_CONFIG_SIMPLE.md` pour les instructions détaillées.

### Cas 2 : Webhook ne reçoit pas les événements

**Vous voyez** : Rien après un paiement test

**Solution** :

#### Option A : Utiliser Stripe CLI (recommandé pour développement local)

```bash
# Installer Stripe CLI
stripe login

# Écouter les webhooks et les rediriger vers votre serveur local
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

Vous verrez :
```
> Ready! Your webhook signing secret is whsec_abc123...
```

Copiez ce secret et ajoutez-le dans `.env` :
```env
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

Puis refaites un paiement test. Vous verrez maintenant les événements dans le terminal Stripe CLI.

#### Option B : Configurer le webhook dans Stripe Dashboard

1. https://dashboard.stripe.com/test/webhooks
2. Cliquez sur "+ Add endpoint"
3. URL: `http://localhost:3001/api/webhook/stripe`
4. Événements: Sélectionnez `payment_intent.succeeded`
5. Copiez le "Signing secret"
6. Ajoutez-le dans `.env` comme `STRIPE_WEBHOOK_SECRET`

⚠️ **Note** : Pour localhost, vous devez utiliser Stripe CLI. Le Dashboard Stripe ne peut pas envoyer d'événements à localhost directement.

### Cas 3 : Tout semble fonctionner mais le badge n'apparaît pas

**Vous voyez** :
```
✅ Firebase Admin initialisé
✅ Commande sauvegardée
✅ Annonce marquée comme vendue: VQLQRBc8sbiRQlYAGx5l
```

**Solutions** :

1. **Rafraîchissez la page** (F5 ou Ctrl+R)
   - Le frontend ne recharge pas automatiquement les données

2. **Vérifiez dans Firebase Console** que l'annonce a bien `status: "sold"`
   - Firebase Console → Firestore → listings → [votre annonce]
   - Le champ `status` doit être `"sold"`

3. **Videz le cache du navigateur**
   - F12 → Onglet Network → Cochez "Disable cache"
   - Rechargez la page

4. **Vérifiez que vous regardez la bonne annonce**
   - L'ID dans l'URL correspond-il à l'ID dans les logs ?

## 🧪 Test complet

### Étape par étape :

1. **Arrêtez le serveur** (Ctrl+C dans le terminal)
2. **Vérifiez `.env`** :
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   ```
3. **Relancez le serveur** : `node server.js`
4. **Vérifiez les logs de démarrage** :
   ```
   ✅ Firebase Admin initialisé
   🚀 Serveur démarré sur http://localhost:3001
   ```
5. **Si vous utilisez localhost, lancez Stripe CLI** :
   ```bash
   stripe listen --forward-to localhost:3001/api/webhook/stripe
   ```
6. **Faites un paiement test**
7. **Regardez les logs du serveur** - vous devez voir :
   ```
   Paiement réussi: pi_xxx
   ✅ Commande sauvegardée: pi_xxx
   ✅ Annonce marquée comme vendue: xxx
   ```
8. **Rafraîchissez la page** (F5)
9. ✅ **Le badge "VENDU" devrait apparaître !**

## 🆘 Encore des problèmes ?

### Debug avancé :

Ajoutez ces console.log dans le webhook (`server.js`, ligne 60) :

```javascript
console.log('📥 Métadonnées PaymentIntent:', {
  listing_id: pi.metadata?.listing_id,
  buyer_id: pi.metadata?.buyer_id,
  subtotal: pi.metadata?.subtotal_cents,
});
```

Relancez le serveur et refaites un paiement. Vous verrez les métadonnées dans les logs.

**Si `listing_id` est vide ou undefined**, le problème vient du frontend qui n'envoie pas correctement l'ID.

**Si `listing_id` est présent**, le problème vient du webhook qui ne peut pas écrire dans Firestore (Firebase Admin).

