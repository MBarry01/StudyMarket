# 🚀 Configuration rapide pour tester les commandes

## ✅ Ce qui est déjà fait
- ✅ Serveur modifié pour sauvegarder la structure attendue
- ✅ Variables Stripe ajoutées au .env
- ✅ Serveur redémarré et fonctionnel

## 🔧 Configuration Firebase Admin (optionnelle)

### Option 1 : Configuration complète (recommandée)
1. Aller dans la console Firebase : https://console.firebase.google.com/
2. Sélectionner le projet "annonces-app-44d27"
3. Aller dans "Paramètres du projet" > "Comptes de service"
4. Cliquer sur "Générer une nouvelle clé privée"
5. Télécharger le fichier JSON
6. Remplacer la ligne `FIREBASE_SERVICE_ACCOUNT` dans `.env` par le contenu du JSON

### Option 2 : Test sans Firebase Admin
- Le système fonctionne sans Firebase Admin
- Les paiements réussissent mais ne sont pas sauvegardés
- Vous pouvez tester le paiement et voir "Paiement réussi" dans la console

## 🧪 Test du système

### 1. Faire un paiement test
- Utiliser la carte : 4242 4242 4242 4242
- Date : n'importe quelle date future
- CVC : n'importe quel code à 3 chiffres

### 2. Vérifier les logs
- Console du navigateur : "Paiement réussi: pi_xxx"
- Console du serveur : "✅ Commande sauvegardée: pi_xxx" (si Firebase configuré)

### 3. Vérifier la page des commandes
- Aller sur "Mes Commandes"
- Si Firebase est configuré : la commande devrait apparaître
- Si Firebase n'est pas configuré : la page reste vide (normal)

## 🔍 Dépannage

### Erreur "FIREBASE_SERVICE_ACCOUNT non configuré"
- Normal si vous n'avez pas encore configuré Firebase Admin
- Les paiements fonctionnent mais ne sont pas sauvegardés

### Page des commandes vide
- Vérifiez que Firebase Admin est configuré
- Vérifiez que le webhook Stripe fonctionne
- Vérifiez les logs du serveur

### Erreur de signature webhook
- Configurez Stripe CLI : `stripe listen --forward-to http://localhost:3001/api/webhook/stripe`
- Copiez le "Signing secret" dans `STRIPE_WEBHOOK_SECRET`

---

🎉 **Le système est prêt ! Testez un paiement pour voir si tout fonctionne.**
