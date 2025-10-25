# 🔐 GUIDE SÉCURITÉ : Clés Stripe et Variables d'Environnement

## ✅ **État actuel - DÉJÀ SÉCURISÉ !**

Votre code est **déjà sécurisé** ! Voici ce qui est en place :

### **1. Variables d'environnement utilisées :**

**Frontend (`src/lib/stripe.ts`) :**
```typescript
// ✅ BON - Utilise les variables d'environnement
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'fallback';
```

**Backend (`server.js`) :**
```typescript
// ✅ BON - Utilise les variables d'environnement
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'YOUR_STRIPE_SECRET_KEY_HERE');
```

### **2. Fichier .env protégé :**

**`.gitignore` contient déjà :**
```
.env
.env.local
.env.production
```

**✅ Le fichier `.env` ne sera JAMAIS committé !**

---

## 📋 **Configuration locale (.env)**

### **Créez votre fichier `.env` local :**

```bash
# Configuration Stripe - NE PAS COMMITER CE FICHIER
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE_ICI
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI

# Configuration Supabase
VITE_SUPABASE_URL=https://kbbhglxrcywpcktkamhl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmhnbHhyY3l3cGNrdGthbWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTg5MTUsImV4cCI6MjA2NDczNDkxNX0.I8Lj0SuxxMeabmCc3IZ0ZGH_z44CJFLGExny8WA1q4A

# Configuration Algolia
VITE_ALGOLIA_APP_ID=Q3E5Y56YF4
VITE_ALGOLIA_SEARCH_KEY=ff26b6f0fa03bc6384566ea42dfe0ab4

# Configuration Admin
VITE_ADMIN_EMAILS=barrymohamadou98@gmail.com,mb3186802@gmail.com
VITE_ADMIN_UIDS=

# Configuration API Base URL
VITE_API_BASE=http://localhost:3001
```

---

## 🚀 **Déploiement sécurisé**

### **Pour GitHub Pages :**

Les secrets sont déjà configurés dans GitHub Secrets :
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ALGOLIA_APP_ID`
- `VITE_ALGOLIA_SEARCH_KEY`

### **Pour le déploiement manuel (gh-pages) :**

Le script `deploy-gh-pages.ps1` utilise automatiquement les variables d'environnement.

---

## ⚠️ **Règles de sécurité importantes :**

### **✅ À FAIRE :**
```typescript
// ✅ Utiliser les variables d'environnement
const stripe = new Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const secretKey = process.env.STRIPE_SECRET_KEY;
```

### **❌ À NE JAMAIS FAIRE :**
```typescript
// ❌ JAMAIS mettre les clés en dur dans le code
const stripe = new Stripe('sk_test_123456789');
const publishableKey = 'pk_test_123456789';
```

---

## 🔍 **Vérification de sécurité :**

### **1. Vérifiez que vos clés ne sont pas dans le code :**

```bash
# Rechercher des clés Stripe dans le code
grep -r "sk_test_" src/
grep -r "pk_test_" src/
```

**Résultat attendu :** Aucune clé trouvée !

### **2. Vérifiez que .env est dans .gitignore :**

```bash
grep ".env" .gitignore
```

**Résultat attendu :** `.env` trouvé dans .gitignore

### **3. Vérifiez que le fichier .env n'est pas committé :**

```bash
git status
```

**Résultat attendu :** `.env` n'apparaît PAS dans les fichiers modifiés

---

## 📚 **Bonnes pratiques :**

1. **Jamais committer** le fichier `.env`
2. **Toujours utiliser** les variables d'environnement
3. **Utiliser des fallbacks** pour le développement
4. **Séparer** les clés publiques et secrètes
5. **Rotater** les clés régulièrement

---

## 🎯 **Résumé :**

✅ **Votre code est déjà sécurisé !**  
✅ **Les variables d'environnement sont utilisées**  
✅ **Le fichier .env est protégé**  
✅ **Les secrets GitHub sont configurés**  

**Vous n'avez rien à changer, c'est déjà parfait ! 🔐**
