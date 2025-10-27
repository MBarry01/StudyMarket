# 🔍 Comment Trouver Mon UID

## Méthode 1 : Console du Navigateur (PLUS RAPIDE)

1. **Ouvrir** http://localhost:5175/StudyMarket/
2. **Ouvrir la console** (F12)
3. **Copier ce code** et l'exécuter :
   ```javascript
   const uid = JSON.parse(localStorage.getItem('firebase:authUser:AIzaSyDXD6WpZoQNLNU0DAqH1wd3q9Q4vthOWv4:[DEFAULT]') || '{}')?.uid;
   console.log('Votre UID:', uid);
   alert('Votre UID: ' + uid);
   ```
4. **Notez** votre UID affiché

## Méthode 2 : Firestore Console

1. **Aller sur** : https://console.firebase.google.com
2. **Projet** : `annonces-app-44d27`
3. **Firestore Database** → Collections → `user_tokens`
4. **Ouvrir** le document (celui avec votre fcmToken)
5. **Copier** la valeur de `userId`

## Méthode 3 : Utiliser l'Application

1. **Aller sur** : Profile/Settings
2. **Ouvrir la console** (F12)
3. Votre UID est affiché dans les logs de connexion

