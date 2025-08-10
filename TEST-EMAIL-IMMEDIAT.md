# 🧪 Test Immédiat - Email de Vérification

## ✅ État Actuel
- ✅ Fichier `.env` créé
- ✅ Service d'email configuré
- ✅ Application en cours d'exécution

## 🔍 Test Immédiat

### **Étape 1: Ouvrir l'Application**
1. **Aller sur** : http://localhost:5179/StudyMarket/
2. **Ouvrir la console** (F12 → Console)

### **Étape 2: Créer un Compte Test**
1. **Cliquer sur "Créer un compte"**
2. **Remplir le formulaire** avec des données test :
   - Prénom : Test
   - Nom : User
   - Email : **VOTRE_VRAI_EMAIL@gmail.com** (important !)
   - Université : Sorbonne Université
   - Filière : Informatique
   - Année : 2024
   - Mot de passe : Test123!
   - Confirmer : Test123!

### **Étape 3: Vérifier la Console**
Après inscription, vous devriez voir dans la console :

```
✅ Service de fallback Gmail disponible
📧 Tentative d'envoi via Firebase...
✅ Email de vérification envoyé via Firebase
```

**OU** si Firebase échoue :

```
⚠️ Firebase a échoué, tentative via service de fallback...
✅ Email de vérification envoyé via Gmail
```

### **Étape 4: Vérifier l'Email**
1. **Aller sur Gmail**
2. **Vérifier les spams** si pas dans la boîte principale
3. **Chercher** : "Vérifiez votre email - StudyMarket"

## 🚨 Si l'Email n'Arrive Pas

### **Vérifier la Console**
Regardez les erreurs dans la console (F12 → Console)

### **Erreurs Possibles**
1. **"Service de fallback Gmail non configuré"**
   - Le fichier `.env` n'est pas lu
   - Redémarrer l'application

2. **"Configuration Gmail manquante"**
   - Vérifier que `.env` contient vos vraies infos Gmail

3. **"Erreur de connexion"**
   - Vérifier l'authentification à 2 facteurs Gmail
   - Vérifier le mot de passe d'application

## 🔧 Configuration Gmail (Si Pas Fait)

### **Activer l'Authentification à 2 Facteurs**
1. **Aller sur** : https://myaccount.google.com/security
2. **Authentification à 2 facteurs** → Activer

### **Générer un Mot de Passe d'Application**
1. **Mots de passe d'application**
2. **Sélectionner** : "StudyMarket"
3. **Copier** le mot de passe généré

### **Mettre à Jour .env**
```bash
VITE_GMAIL_USER=votre.vrai.email@gmail.com
VITE_GMAIL_APP_PASSWORD=le_mot_de_passe_genere
```

## 📱 Test Rapide (2 minutes)

1. **Créer le compte test** (avec votre vrai email)
2. **Vérifier la console** pour les messages
3. **Vérifier Gmail** pour l'email
4. **Cliquer sur le lien** de vérification

## 🎯 Résultat Attendu

- ✅ **Console** : Messages de succès
- ✅ **Gmail** : Email de vérification reçu
- ✅ **Application** : Redirection vers la page principale
- ✅ **Profil** : Compte activé et fonctionnel

---

**⏱️ Temps estimé : 2-5 minutes**
**🎯 Objectif : Email de vérification fonctionnel**
