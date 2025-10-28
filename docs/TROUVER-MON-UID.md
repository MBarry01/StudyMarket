# 🔍 Comment Trouver Votre UID

## MÉTHODE 1 : Console Browser

1. Ouvrir https://MBarry01.github.io/StudyMarket/
2. Se connecter avec votre email admin
3. Ouvrir DevTools (F12)
4. Onglet Console
5. Taper : 

```javascript
console.log(auth.currentUser?.uid)
```

6. Copier l'UID affiché

---

## MÉTHODE 2 : Firebase Console

1. Ouvrir : https://console.firebase.google.com
2. Projet : `annonces-app-44d27`
3. Authentication → Users
4. Trouver votre email
5. Copier le UID

---

## MÉTHODE 3 : Localhost

1. Ouvrir http://localhost:5173
2. Se connecter
3. Console (F12)
4. Taper : `console.log(currentUser?.uid)`

---

## 🎯 APRÈS TROUVER L'UID

**Ajouter Secret GitHub** :
1. https://github.com/MBarry01/StudyMarket/settings/secrets/actions
2. "New repository secret"
3. Name : `VITE_ADMIN_UIDS`
4. Secret : Votre UID (ex: `q8R6wG9lNAOKJnCuUgMFpZFRHKg1`)
5. Add secret

---

## 📝 NOTE

**Si vous avez plusieurs comptes admin** :
```
VITE_ADMIN_UIDS=uid1,uid2,uid3
```

**Si vous n'avez qu'un seul compte** :
```
VITE_ADMIN_UIDS=q8R6wG9lNAOKJnCuUgMFpZFRHKg1
```

---

**Après ajout, déclencher un nouveau déploiement** 🚀

