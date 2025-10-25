# 🔥 Configuration Firebase Admin - Guide Simple

## ⚠️ Pourquoi la page "Mes Commandes" est vide ?

Le serveur affiche : **"⚠️ FIREBASE_SERVICE_ACCOUNT non configuré - persistance désactivée"**

Cela signifie que :
- ✅ Les paiements Stripe fonctionnent
- ❌ Mais ils ne sont **pas sauvegardés** dans Firestore
- ❌ Donc la page "Mes Commandes" reste vide

## 🔧 Solution : Configurer Firebase Admin

### Option 1 : Script Automatique (Recommandé)

1. Téléchargez votre clé Firebase :
   - https://console.firebase.google.com/
   - Projet "annonces-app-44d27"
   - ⚙️ Paramètres > Comptes de service
   - "Générer une nouvelle clé privée"
   - Téléchargez le fichier JSON

2. Placez le fichier JSON dans le dossier du projet

3. Exécutez le script :
   ```powershell
   .\configure-firebase.ps1
   ```

4. Redémarrez le serveur :
   ```powershell
   node server.js
   ```

### Option 2 : Configuration Manuelle

1. Téléchargez la clé Firebase (voir étape 1 ci-dessus)

2. Ouvrez le fichier JSON téléchargé

3. **Copiez TOUT le contenu** du fichier JSON

4. Ouvrez le fichier `.env`

5. Trouvez la ligne qui commence par `FIREBASE_SERVICE_ACCOUNT=`

6. Remplacez **toute la ligne** par :
   ```
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"annonces-app-44d27","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"..."}
   ```
   **Important** : Mettez tout le JSON sur UNE SEULE ligne !

7. Sauvegardez le fichier `.env`

8. Redémarrez le serveur

## ✅ Vérification

Après avoir redémarré le serveur, vous devriez voir :

```
✅ Firebase Admin initialisé
🚀 Serveur API StudyMarket démarré sur le port 3001
```

Au lieu de :

```
⚠️  FIREBASE_SERVICE_ACCOUNT non configuré - persistance désactivée
```

## 🧪 Test

1. Faites un paiement test avec la carte : **4242 4242 4242 4242**
2. Allez sur la page "Mes Commandes"
3. Vous devriez voir votre commande !

## 🆘 Problèmes ?

### Erreur "Firebase Admin non disponible"
- Vérifiez que le JSON est sur une seule ligne
- Vérifiez qu'il n'y a pas d'espaces avant ou après le `=`
- Vérifiez que les guillemets sont bien échappés

### Le serveur affiche toujours "non configuré"
- Vérifiez que vous avez bien sauvegardé le fichier `.env`
- Vérifiez que vous avez redémarré le serveur
- Vérifiez que le JSON est valide

### La page reste vide après le paiement
- Vérifiez les logs du serveur, vous devriez voir : "✅ Commande sauvegardée: pi_xxx"
- Vérifiez dans la console Firebase que la collection `orders` existe
- Actualisez la page "Mes Commandes"

---

💡 **Astuce** : Utilisez le script automatique `configure-firebase.ps1` pour éviter les erreurs de formatage !
