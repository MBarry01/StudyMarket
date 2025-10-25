# 📊 Index Firestore requis - StudyMarket

## 🎯 Index composites nécessaires

Pour que toutes les requêtes fonctionnent correctement, vous devez créer les index composites suivants dans Firestore.

---

## 1️⃣ Index pour la collection `orders`

### Index 1 : Commandes par utilisateur (acheteur)
**Utilisé par** : `OrdersPage.tsx` - Afficher les commandes d'un acheteur

```
Collection: orders
Champs indexés:
  - userId (Ascending)
  - createdAt (Descending)
```

**Comment créer** :
1. Firebase Console → Firestore Database → Indexes
2. Cliquez sur "Create Index"
3. Collection ID: `orders`
4. Ajoutez les champs :
   - `userId` : Ascending
   - `createdAt` : Descending
5. Query scope: `Collection`
6. Cliquez sur "Create"

**Lien direct** : Si une erreur s'affiche dans la console, Firebase vous donnera un lien direct pour créer l'index.

---

### Index 2 : Commandes par PaymentIntent (page de succès)
**Utilisé par** : `PaymentSuccessPage.tsx` - Récupérer la commande après paiement

```
Collection: orders
Champs indexés:
  - payment.details.paymentIntentId (Ascending)
  - userId (Ascending)
  - createdAt (Descending)
```

**Comment créer** :
1. Firebase Console → Firestore Database → Indexes
2. Cliquez sur "Create Index"
3. Collection ID: `orders`
4. Ajoutez les champs :
   - `payment.details.paymentIntentId` : Ascending
   - `userId` : Ascending
   - `createdAt` : Descending
5. Query scope: `Collection`
6. Cliquez sur "Create"

**Note** : Cet index permet de récupérer rapidement la commande créée juste après un paiement réussi.

---

## 2️⃣ Index pour la collection `listings`

### Index 1 : Annonces actives par date
**Utilisé par** : `HomePage.tsx`, `ListingsPage.tsx`

```
Collection: listings
Champs indexés:
  - status (Ascending)
  - createdAt (Descending)
```

**Comment créer** :
1. Firebase Console → Firestore Database → Indexes
2. Cliquez sur "Create Index"
3. Collection ID: `listings`
4. Ajoutez les champs :
   - `status` : Ascending
   - `createdAt` : Descending
5. Query scope: `Collection`
6. Cliquez sur "Create"

---

### Index 2 : Annonces par vendeur
**Utilisé par** : `ProfilePage.tsx` - Afficher les annonces d'un utilisateur

```
Collection: listings
Champs indexés:
  - sellerId (Ascending)
  - createdAt (Descending)
```

**Comment créer** :
1. Firebase Console → Firestore Database → Indexes
2. Cliquez sur "Create Index"
3. Collection ID: `listings`
4. Ajoutez les champs :
   - `sellerId` : Ascending
   - `createdAt` : Descending
5. Query scope: `Collection`
6. Cliquez sur "Create"

---

### Index 3 : Annonces par catégorie et statut
**Utilisé par** : `ListingsPage.tsx` - Filtrer par catégorie

```
Collection: listings
Champs indexés:
  - category (Ascending)
  - status (Ascending)
  - createdAt (Descending)
```

**Comment créer** :
1. Firebase Console → Firestore Database → Indexes
2. Cliquez sur "Create Index"
3. Collection ID: `listings`
4. Ajoutez les champs :
   - `category` : Ascending
   - `status` : Ascending
   - `createdAt` : Descending
5. Query scope: `Collection`
6. Cliquez sur "Create"

---

## 3️⃣ Index pour la collection `favorites`

### Index : Favoris par utilisateur
**Utilisé par** : `ProfilePage.tsx`, `FavoritesPage.tsx`

```
Collection: favorites
Champs indexés:
  - userId (Ascending)
  - createdAt (Descending)
```

**Comment créer** :
1. Firebase Console → Firestore Database → Indexes
2. Cliquez sur "Create Index"
3. Collection ID: `favorites`
4. Ajoutez les champs :
   - `userId` : Ascending
   - `createdAt` : Descending
5. Query scope: `Collection`
6. Cliquez sur "Create"

---

## 4️⃣ Index pour la collection `reviews`

### Index : Avis par utilisateur évalué
**Utilisé par** : `ProfilePage.tsx` - Afficher les avis reçus

```
Collection: reviews
Champs indexés:
  - revieweeId (Ascending)
  - createdAt (Descending)
```

**Comment créer** :
1. Firebase Console → Firestore Database → Indexes
2. Cliquez sur "Create Index"
3. Collection ID: `reviews`
4. Ajoutez les champs :
   - `revieweeId` : Ascending
   - `createdAt` : Descending
5. Query scope: `Collection`
6. Cliquez sur "Create"

---

## 🚨 Messages d'erreur courants

### Erreur : "The query requires an index"

```
FirebaseError: The query requires an index. You can create it here:
https://console.firebase.google.com/v1/r/project/YOUR_PROJECT/firestore/indexes?create_composite=...
```

**Solution** :
1. Cliquez sur le lien fourni dans l'erreur
2. Firebase vous amènera directement à la page de création d'index
3. Vérifiez que les champs sont corrects
4. **IMPORTANT** : Si vous voyez un champ `__name__`, supprimez-le ! Il n'est généralement pas nécessaire.
5. Cliquez sur "Create"
6. Attendez 2-5 minutes que l'index soit créé

---

## ⏱️ Temps de création

- **Petites collections** (< 100 documents) : 1-2 minutes
- **Collections moyennes** (100-1000 documents) : 2-5 minutes
- **Grandes collections** (> 1000 documents) : 5-10 minutes

Vous pouvez suivre la progression dans Firebase Console → Firestore Database → Indexes.

---

## ✅ Vérification des index

### Méthode 1 : Console Firebase
1. Firebase Console → Firestore Database → Indexes
2. Vérifiez que tous les index ont le statut "Enabled" (vert)

### Méthode 2 : Tester les requêtes
1. Naviguez vers chaque page de l'application
2. Ouvrez la console navigateur (F12)
3. Vérifiez qu'aucune erreur d'index n'apparaît

---

## 📝 Résumé des index requis

| Collection | Champs | Page utilisatrice |
|------------|--------|-------------------|
| `orders` | userId + createdAt | OrdersPage |
| `orders` | payment.details.paymentIntentId + userId + createdAt | PaymentSuccessPage |
| `listings` | status + createdAt | HomePage, ListingsPage |
| `listings` | sellerId + createdAt | ProfilePage |
| `listings` | category + status + createdAt | ListingsPage |
| `favorites` | userId + createdAt | ProfilePage, FavoritesPage |
| `reviews` | revieweeId + createdAt | ProfilePage |

**Total : 7 index composites à créer**

---

## 🔧 Script pour générer les liens de création

Si vous voulez créer rapidement tous les index, vous pouvez utiliser ce script Node.js :

```javascript
const PROJECT_ID = 'votre-project-id';
const indexes = [
  {
    collection: 'orders',
    fields: [
      { field: 'userId', mode: 'ASCENDING' },
      { field: 'createdAt', mode: 'DESCENDING' }
    ]
  },
  {
    collection: 'orders',
    fields: [
      { field: 'payment.details.paymentIntentId', mode: 'ASCENDING' },
      { field: 'userId', mode: 'ASCENDING' },
      { field: 'createdAt', mode: 'DESCENDING' }
    ]
  },
  // ... autres index
];

indexes.forEach(index => {
  console.log(`\nIndex pour ${index.collection}:`);
  console.log(`https://console.firebase.google.com/project/${PROJECT_ID}/firestore/indexes?create_composite=${encodeURIComponent(JSON.stringify(index))}`);
});
```

---

## 🆘 Support

Si vous rencontrez des problèmes avec les index :

1. **Vérifiez les règles de sécurité Firestore** - parfois l'erreur vient des règles, pas des index
2. **Attendez quelques minutes** après la création d'un index
3. **Rechargez la page** après la création de l'index
4. **Vérifiez la console navigateur** pour voir l'erreur exacte
5. **Consultez la documentation Firebase** : https://firebase.google.com/docs/firestore/query-data/indexing

---

**Une fois tous les index créés, toutes les pages afficheront correctement les données réelles ! ✅**

*Dernière mise à jour : 25 octobre 2025*

