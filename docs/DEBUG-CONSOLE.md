# 🔍 Debug Console GitHub Pages

## ✅ COMMANDE À EXÉCUTER

Dans la console GitHub Pages (F12), taper :

```javascript
console.log(window.__VITE_ENV_VARS__)
```

OU

```javascript
Object.keys(window).filter(k => k.includes('ADMIN'))
```

---

## 🔍 VÉRIFIER LES SECRETS

**Dans le code compilé**, chercher les emails admin :

```javascript
grep -r "barrymohamadou98@gmail.com" index*.js
```

**Ou dans le Network** :
1. F12 → Network
2. Recharger la page
3. Chercher "index" dans les fichiers JS
4. Ouvrir et chercher "VITE_ADMIN_EMAILS"

---

## 🎯 DIAGNOSTIC

**Si les secrets ne sont PAS dans le code compilé** :
- ❌ Build sans les secrets
- ✅ Re-faire build avec secrets

**Si les secrets SONT dans le code** :
- ✅ Build OK
- ⏳ Vérifier la logique isAdmin

---

**Testez ces commandes dans la console et dites-moi ce que vous voyez !** 🔍

