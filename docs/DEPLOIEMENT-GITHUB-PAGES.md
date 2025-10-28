# 🚀 Déploiement sur GitHub Pages

## 📋 Étapes de configuration

### 1. Activer GitHub Pages

1. Allez sur votre repository GitHub : https://github.com/MBarry01/StudyMarket
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Pages**
4. Dans "Build and deployment", sélectionnez :
   - **Source** : GitHub Actions
5. Cliquez sur **Save**

### 2. Configurer les Secrets

Allez dans **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

Ajoutez les secrets suivants :

#### Secrets requis :
- `VITE_SUPABASE_URL` : URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé anonyme Supabase
- `VITE_STRIPE_PUBLISHABLE_KEY` : Clé publique Stripe
- `VITE_ALGOLIA_APP_ID` : ID de votre application Algolia
- `VITE_ALGOLIA_SEARCH_KEY` : Clé de recherche Algolia

#### Secrets optionnels :
- `VITE_PEXELS_API_KEY` : Clé API Pexels (optionnel)
- `VITE_ADMIN_EMAILS` : Liste d'emails admin (séparés par des virgules)
- `VITE_ADMIN_UIDS` : Liste d'UIDs admin (séparés par des virgules)

### 3. Modifier le fichier vite.config.ts

Le fichier est déjà configuré avec le bon `base`, mais vérifiez :

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/StudyMarket/', // ✅ Doit correspondre au nom de votre repo
  // ... rest of config
})
```

### 4. Pousser les modifications

```bash
git add .
git commit -m "Configuration GitHub Pages deployment"
git push origin main
```

### 5. Vérifier le déploiement

1. Allez dans l'onglet **Actions** de votre repository
2. Vous devriez voir un workflow "Deploy to GitHub Pages" en cours d'exécution
3. Attendez que le workflow se termine (✅ vert)
4. Votre site sera disponible à : `https://mbarry01.github.io/StudyMarket/`

## 🔧 Configuration locale pour tester

Avant de pousser, testez localement avec le même `base` :

```bash
npm run build
npm run preview
```

Visitez http://localhost:4173/StudyMarket/ pour vérifier que tout fonctionne.

## ⚠️ Important

### URLs Firebase

Ajoutez le domaine GitHub Pages dans Firebase :
1. Allez dans **Firebase Console** > **Authentication** > **Settings**
2. Dans "Authorized domains", ajoutez :
   - `mbarry01.github.io`

### URLs de redirection

Vérifiez que les redirections email utilisent la bonne URL dans `src/lib/firebase.ts` :

```typescript
export const emailConfig = {
  actionCodeSettings: {
    url: 'https://mbarry01.github.io/StudyMarket/verify-email',
    handleCodeInApp: true,
  }
};
```

## 📦 Fichiers de build

Le workflow GitHub Actions :
1. Installe les dépendances (`npm ci`)
2. Build le projet (`npm run build`)
3. Déploie le dossier `dist/` sur GitHub Pages

## 🐛 Troubleshooting

### Le site affiche "404 Not Found"
- Vérifiez que `base: '/StudyMarket/'` est correct dans `vite.config.ts`
- Vérifiez que GitHub Pages est activé avec source "GitHub Actions"

### Les assets ne chargent pas
- Vérifiez le `base` dans vite.config.ts
- Regardez les URLs dans les outils développeur (F12)

### Les secrets ne fonctionnent pas
- Vérifiez que les noms des secrets correspondent exactement
- Ils sont sensibles à la casse (majuscules/minuscules)

### Le workflow échoue
- Regardez les logs dans l'onglet **Actions**
- Vérifiez que toutes les dépendances sont dans `package.json`

## 📚 Documentation

- [GitHub Pages](https://docs.github.com/en/pages)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

## ✅ Checklist finale

- [ ] GitHub Pages activé (source : GitHub Actions)
- [ ] Tous les secrets configurés
- [ ] `base` correct dans vite.config.ts
- [ ] Firebase domaine autorisé ajouté
- [ ] URLs de redirection mises à jour
- [ ] Workflow GitHub Actions passé ✅
- [ ] Site accessible sur https://mbarry01.github.io/StudyMarket/

---

🎉 **Votre plateforme StudyMarket est maintenant déployée et accessible publiquement !**

