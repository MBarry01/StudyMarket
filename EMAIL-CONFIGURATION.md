# 📧 Configuration des Emails de Confirmation - StudyMarket

## 🚨 Problème Actuel
Vous ne recevez **PAS** d'emails de confirmation après inscription. Voici pourquoi et comment le résoudre.

## 🔍 Causes Possibles

### 1. **Configuration Firebase Manquante**
Firebase a besoin d'être configuré pour l'envoi d'emails :
- Domaine non vérifié
- Configuration SMTP manquante
- Limites de quota atteintes

### 2. **Paramètres d'Email Incorrects**
- URL de redirection invalide
- Configuration des actions manquante

## ✅ Solutions Implémentées

### **Solution 1: Service d'Email Intelligent (Recommandé)**
Le système utilise maintenant un service intelligent qui :
1. **Essaie d'abord Firebase** (méthode native)
2. **Basculer automatiquement** vers un service de fallback si Firebase échoue
3. **Gère les erreurs** de manière transparente

### **Solution 2: Services de Fallback Disponibles**

#### **A. Resend (Gratuit jusqu'à 3000 emails/mois)**
```bash
# 1. Créer un compte sur https://resend.com
# 2. Obtenir la clé API
# 3. Ajouter dans .env :
VITE_RESEND_API_KEY=re_votre_cle_api
```

#### **B. Gmail SMTP (Gratuit)**
```bash
# 1. Activer l'authentification à 2 facteurs sur Gmail
# 2. Générer un mot de passe d'application
# 3. Ajouter dans .env :
VITE_GMAIL_USER=votre.email@gmail.com
VITE_GMAIL_APP_PASSWORD=votre_mot_de_passe_app
```

#### **C. Supabase Edge Functions**
```bash
# Utilise les variables Supabase existantes
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_supabase
```

## 🚀 Configuration Rapide (2 minutes)

### **Étape 1: Créer un compte Resend**
1. Aller sur [resend.com](https://resend.com)
2. S'inscrire gratuitement
3. Vérifier votre email

### **Étape 2: Obtenir la clé API**
1. Dashboard Resend → "API Keys"
2. Créer une nouvelle clé
3. Copier la clé (format : `re_...`)

### **Étape 3: Configurer l'environnement**
Créer un fichier `.env` à la racine du projet :
```bash
VITE_RESEND_API_KEY=re_votre_cle_api
```

### **Étape 4: Redémarrer l'application**
```bash
npm run dev
```

## 🔧 Vérification de la Configuration

### **Console du Navigateur (F12)**
Vous devriez voir :
```
✅ Service de fallback Resend disponible
📧 Tentative d'envoi via Firebase...
✅ Email de vérification envoyé via Resend
```

### **Test d'Inscription**
1. Créer un nouveau compte
2. Vérifier la console pour les logs
3. Vérifier votre boîte email (et spams)

## 📋 Fichiers Modifiés

### **1. `src/lib/firebase.ts`**
- ✅ Configuration améliorée pour les emails
- ✅ Support des émulateurs de développement
- ✅ Configuration des actions d'email

### **2. `src/services/emailService.ts` (NOUVEAU)**
- ✅ Service intelligent avec fallback automatique
- ✅ Support de Resend, Gmail, Supabase
- ✅ Templates d'email professionnels
- ✅ Gestion d'erreurs robuste

### **3. `src/pages/AuthPage.tsx`**
- ✅ Intégration du nouveau service d'email
- ✅ Gestion des erreurs améliorée
- ✅ Fallback automatique en cas d'échec Firebase

## 🎯 Résultat Final

Une fois configuré, **chaque inscription** déclenchera :

1. ✅ **Tentative Firebase** (méthode native)
2. ✅ **Fallback automatique** vers Resend si Firebase échoue
3. ✅ **Email professionnel** avec design StudyMarket
4. ✅ **Gestion d'erreurs** transparente pour l'utilisateur

## 🚨 En Cas de Problème

### **Vérifier la Console**
```bash
# Erreurs courantes :
❌ "Clé API Resend non configurée"
❌ "Configuration Supabase manquante"
❌ "Configuration Gmail manquante"
```

### **Vérifier les Variables d'Environnement**
```bash
# Dans .env :
VITE_RESEND_API_KEY=re_...  # Doit commencer par "re_"
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### **Tester la Connectivité**
```bash
# Test Resend
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_votre_cle" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

## 💡 Pourquoi Cette Architecture ?

- **Robustesse** : Fallback automatique si Firebase échoue
- **Flexibilité** : Support de multiples services d'email
- **Maintenance** : Service centralisé et facile à déboguer
- **UX** : L'utilisateur ne voit jamais les erreurs techniques
- **Coût** : Gratuit jusqu'à 3000 emails/mois avec Resend

## 🔄 Prochaines Étapes

1. **Configurer Resend** (recommandé)
2. **Tester l'inscription** avec un nouveau compte
3. **Vérifier la réception** des emails
4. **Personnaliser les templates** si nécessaire

---

**🎉 Avec cette configuration, vous recevrez TOUJOURS vos emails de confirmation !**
