# 🚀 Guide de Déploiement sur Vercel

## ✅ Configuration PWA pour Vercel

### Fichiers créés/modifiés

1. **`vercel.json`** - Configuration Vercel
   - Routes SPA (toutes les routes vers `index.html`)
   - Headers pour `manifest.json` et service worker
   - Cache optimisé pour les assets

2. **`public/manifest.json`** - Manifest PWA
   - Configuration complète pour l'installation
   - Icônes et métadonnées

3. **`index.html`** - Meta tags PWA
   - Lien vers le manifest
   - Meta tags iOS/Android

## 📋 Étapes de Déploiement

### Option 1 : Déploiement automatique (Recommandé)

1. **Connecter le repository GitHub à Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Cliquer sur "Add New Project"
   - Importer le repository `StudyMarket-Git`

2. **Configuration automatique**
   - Vercel détectera automatiquement Vite
   - Le fichier `vercel.json` sera utilisé
   - Build Command : `npm run build`
   - Output Directory : `dist`

3. **Variables d'environnement** (si nécessaire)
   - Ajouter les variables dans Vercel Dashboard
   - Settings → Environment Variables

### Option 2 : Déploiement via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Déployer en production
vercel --prod
```

## ⚙️ Configuration du Base Path

### Pour un déploiement à la racine (domaine personnalisé)

Si vous déployez sur un domaine personnalisé (ex: `studymarket.com`), modifiez `vite.config.ts` :

```typescript
export default defineConfig({
  base: '/',  // Au lieu de '/StudyMarket/'
  // ...
});
```

### Pour un déploiement avec sous-chemin

Si vous gardez le sous-chemin `/StudyMarket/`, la configuration actuelle fonctionne.

**Important** : Mettez à jour le `start_url` dans `manifest.json` si vous changez le base path :

```json
{
  "start_url": "/StudyMarket/",  // Si base path = '/StudyMarket/'
  "scope": "/StudyMarket/"
}
```

## 🔍 Vérifications Post-Déploiement

### 1. Vérifier le Manifest

Ouvrir : `https://votre-domaine.vercel.app/manifest.json`

Doit retourner un JSON valide avec `Content-Type: application/manifest+json`

### 2. Vérifier le Service Worker

Ouvrir : `https://votre-domaine.vercel.app/firebase-messaging-sw.js`

Doit retourner le JavaScript du service worker

### 3. Tester l'Installation PWA

1. Ouvrir l'app sur Chrome/Edge mobile
2. Vérifier que la bannière d'installation apparaît
3. Tester le prompt d'installation
4. Vérifier que l'app s'ouvre en mode standalone après installation

### 4. Vérifier les Routes SPA

Toutes les routes doivent rediriger vers `index.html` :
- `/` → OK
- `/listings` → OK
- `/profile` → OK
- etc.

## 🐛 Dépannage

### Le manifest.json n'est pas trouvé

**Solution** : Vérifier que le fichier est dans `public/manifest.json` et que le build l'inclut dans `dist/`

### Le service worker ne se charge pas

**Solution** : Vérifier les headers dans `vercel.json` pour `firebase-messaging-sw.js`

### Les routes ne fonctionnent pas (404)

**Solution** : Vérifier que les `rewrites` dans `vercel.json` redirigent vers `index.html`

### Le prompt d'installation n'apparaît pas

**Vérifications** :
1. L'app est servie en HTTPS (Vercel le fait automatiquement)
2. Le manifest.json est valide
3. Le service worker est enregistré
4. L'app n'est pas déjà installée

## 📱 Test sur Mobile

1. Ouvrir l'app sur Chrome Android ou Safari iOS
2. Attendre quelques secondes
3. La bannière d'installation devrait apparaître en bas
4. Cliquer sur "Installer"
5. L'app s'ouvre en mode standalone

## ✅ Checklist de Déploiement

- [ ] Fichier `vercel.json` créé
- [ ] `manifest.json` dans `public/`
- [ ] Meta tags dans `index.html`
- [ ] Base path configuré correctement
- [ ] Build réussi (`npm run build`)
- [ ] Déployé sur Vercel
- [ ] Manifest accessible
- [ ] Service worker fonctionne
- [ ] Routes SPA fonctionnent
- [ ] Prompt d'installation testé

## 🎯 Résultat Attendu

Après déploiement, l'application StudyMarket sera :
- ✅ Installable comme PWA
- ✅ Accessible hors ligne (via service worker)
- ✅ Optimisée pour mobile
- ✅ Conforme aux standards PWA

