# 🔥 Créer l'index Firestore pour les commandes

## ⚠️ Pourquoi cette erreur ?

```
Error fetching orders: FirebaseError: The query requires an index.
```

Firestore a besoin d'un **index composite** pour effectuer la requête `userId + createdAt` sur la collection `orders`.

## ✅ Solution automatique (Recommandée)

**Cliquez simplement sur ce lien** (généré automatiquement par Firebase) :

https://console.firebase.google.com/v1/r/project/annonces-app-44d27/firestore/indexes?create_composite=ClFwcm9qZWN0cy9hbm5vbmNlcy1hcHAtNDRkMjcvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL29yZGVycy9pbmRleGVzL18QARoKC                                                                                                                                                                                                                                             cv*
 bn,
  ;:
 7*$%bn 632
   gZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXhAC

1. Cliquez sur le lien
2. Firebase vous redirige vers la page de création d'index
3. Cliquez sur **"Créer l'index"**
4. Attendez 2-3 minutes que l'index soit créé
5. **Actualisez la page "Mes Commandes"**

## 📝 Solution manuelle

Si le lien ne fonctionne pas :

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez "annonces-app-44d27"
3. Allez dans **Firestore Database** > **Index**
4. Cliquez sur **"Créer un index"**
5. Configurez l'index :
   - **Collection** : `orders`
   - **Champ 1** : `userId` - Croissant
   - **Champ 2** : `createdAt` - Décroissant
   - **Statut de la requête** : Activé
6. Cliquez sur **"Créer"**
7. Attendez que le statut passe de "En cours de création" à "Activé"

## ⏱️ Temps d'attente

- Création : 2-3 minutes généralement
- Maximum : 10-15 minutes pour les gros projets

## ✅ Vérification

Une fois l'index créé :

1. Actualisez la page "Mes Commandes" (F5)
2. Vos commandes devraient apparaître ! 🎉
3. Vous ne verrez plus l'erreur dans la console

## 🎯 Statut actuel

✅ Firebase Admin configuré  
✅ Paiement réussi (pi_3SM9oy2XLhzYQhT909ErKENE)  
⏳ Index Firestore en attente de création  

---

**Une fois l'index créé, tout fonctionnera parfaitement !** 🚀
