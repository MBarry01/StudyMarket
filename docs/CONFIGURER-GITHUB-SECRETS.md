# 🔧 Configurer Secrets GitHub pour Administration

## 🎯 PROBLÈME

Le menu "Administration" fonctionne en local mais pas sur GitHub Pages.

**Cause** : Les variables d'environnement (`VITE_ADMIN_EMAILS`, `VITE_ADMIN_UIDS`) ne sont pas configurées dans GitHub Secrets.

---

## ✅ SOLUTION

### Étape 1 : Aller sur GitHub Settings

1. Ouvrir : https://github.com/MBarry01/StudyMarket/settings/secrets/actions
2. Cliquer "New repository secret"

### Étape 2 : Ajouter `VITE_ADMIN_EMAILS`

**Name** : `VITE_ADMIN_EMAILS`
**Secret** : `barrymohamadou98@gmail.com`

Cliquer "Add secret"

### Étape 3 : Ajouter `VITE_ADMIN_UIDS`

**Name** : `VITE_ADMIN_UIDS`
**Secret** : `your-admin-uid-here` (ou vide si pas besoin)

Cliquer "Add secret"

### Étape 4 : Ajouter `VITE_OPENAI_API_KEY` (Optionnel)

**Name** : `VITE_OPENAI_API_KEY`
**Secret** : `VOTRE_CLE_API_OPENAI_ICI`

Cliquer "Add secret"

### Étape 5 : Ajouter `VITE_OPENAI_ENABLED` (Optionnel)

**Name** : `VITE_OPENAI_ENABLED`
**Secret** : `true`

Cliquer "Add secret"

---

## 🔍 TROUVER VOTRE UID

**Option 1 : Firebase Console**
1. Aller sur https://console.firebase.google.com
2. Projet → Authentication → Users
3. Trouver votre email
4. Copier le UID

**Option 2 : Console Browser**
1. Ouvrir console (F12)
2. Taper : `console.log(auth.currentUser?.uid)`
3. Copier le UID affiché

---

## 📊 VARIABLES À AJOUTER

Voici la liste complète des variables à ajouter :

```
VITE_ADMIN_EMAILS=barrymohamadou98@gmail.com
VITE_ADMIN_UIDS=your-uid-here
VITE_API_BASE=https://your-backend-url.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_ALGOLIA_APP_ID=...
VITE_ALGOLIA_SEARCH_KEY=...
VITE_OPENAI_API_KEY=sk-proj-...
VITE_OPENAI_ENABLED=true
```

### 🤖 Configuration OpenAI (Optionnel)

**Pour activer le chatbot intelligent** :
1. Aller sur GitHub Settings > Secrets > Actions
2. Ajouter `VITE_OPENAI_API_KEY` avec votre clé API OpenAI
3. Ajouter `VITE_OPENAI_ENABLED` avec la valeur `true`

**Note** : Le chatbot fonctionne sans OpenAI, mais sera plus intelligent avec.

---

## 🎊 APRÈS CONFIGURATION

**Faire un nouveau push** :
```bash
git add .
git commit -m "Update .env config"
git push origin main
```

**GitHub Actions va** :
1. Build l'app avec les nouveaux secrets
2. Déployer sur GitHub Pages
3. Menu "Administration" visible ✅

---

## 📝 NOTE IMPORTANTE

**Ne PAS commit le fichier `.env`** dans le repo !

Le `.env` contient des secrets et ne doit JAMAIS être dans Git.

**Solution** : Utiliser GitHub Secrets (comme ci-dessus) pour production.

---

## 🎯 RÉSUMÉ

**Local** : `.env` (déjà configuré) ✅
**GitHub Pages** : GitHub Secrets (à configurer) ⏳

Une fois configuré, le menu "Administration" fonctionnera partout ! 🚀

