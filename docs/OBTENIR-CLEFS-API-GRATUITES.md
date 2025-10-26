# 🔑 Comment Obtenir les Clés API Gratuites

## 📋 Vue d'ensemble

Voici comment obtenir gratuitement les clés API nécessaires pour activer les services de validation automatique.

---

## 1️⃣ Google Cloud Vision (OCR) ⭐

### Gratuit jusqu'à 1000 requêtes/mois

**Étape 1 : Créer un compte Google Cloud**

1. Aller sur https://console.cloud.google.com
2. Créer un compte gratuit (carte de crédit demandée mais pas débitée jusqu'à $300/mois)
3. Activer l'essai gratuit

**Étape 2 : Activer Vision API**

1. Aller dans "APIs & Services" > "Library"
2. Chercher "Vision API"
3. Cliquer sur "Enable"

**Étape 3 : Créer une clé API**

1. Aller dans "APIs & Services" > "Credentials"
2. Cliquer sur "Create Credentials" > "API Key"
3. Copier la clé API générée

**Ajouter dans `.env` :**

```env
VITE_GOOGLE_CLOUD_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CLOUD_PROJECT_ID=votre-project-id
```

**Installation SDK :**

```bash
npm install @google-cloud/vision
```

**Limite gratuite** : 1000 requêtes/mois

---

## 2️⃣ AWS Rekognition (Face Match) ⭐

### Gratuit jusqu'à 5000 images/mois pendant 12 mois

**Étape 1 : Créer un compte AWS**

1. Aller sur https://aws.amazon.com
2. Créer un compte gratuit
3. Vérifier l'email

**Étape 2 : Activer Rekognition**

1. Aller sur https://console.aws.amazon.com/rekognition
2. Utiliser sans configuration supplémentaire (gratuit pendant 12 mois)

**Étape 3 : Obtenir les clés d'accès**

1. Aller dans "IAM" > "Users"
2. Créer un nouvel utilisateur avec permissions "AmazonRekognitionFullAccess"
3. Générer "Access Key ID" et "Secret Access Key"
4. Copier les deux clés

**Ajouter dans `.env` :**

```env
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
```

**Installation SDK :**

```bash
npm install @aws-sdk/client-rekognition
```

**Limite gratuite** : 5000 images/mois pendant 12 mois, puis payant

---

## 3️⃣ ClamAV (Antivirus) ⭐

### 100% Gratuit (local)

**Option A : ClamAV Local (Windows)**

1. Télécharger ClamAV : https://www.clamav.net/downloads
2. Installer l'application
3. Démarrer le service ClamAV

**Ajouter dans `.env` :**

```env
VITE_CLAMAV_HOST=localhost
VITE_CLAMAV_PORT=3310
```

**Installation SDK Node.js :**

```bash
npm install clamav
```

**Option B : ClamAV Cloud (Gratuit)**

Utiliser un service cloud gratuit comme ClamAV.net :

```env
VITE_CLAMAV_CLOUD_API_KEY=obtenu via clamav.net
```

**Limite** : Illimité (local)

---

## 4️⃣ Alternative : VirusTotal (Antivirus)

### Gratuit : 4 requêtes/minute

**Étape 1 : Créer un compte**

1. Aller sur https://www.virustotal.com
2. Créer un compte gratuit
3. Vérifier l'email

**Étape 2 : Obtenir la clé API**

1. Aller dans "API Key" dans le profil
2. Copier la clé API

**Ajouter dans `.env` :**

```env
VITE_VIRUSTOTAL_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Installation SDK :**

```bash
npm install virustotal-api
```

**Limite** : 4 requêtes/minute (600/jour)

---

## 📊 Comparaison Gratuite

| Service | Tier Gratuit | Limite | Période |
|---------|--------------|--------|---------|
| **Google Cloud Vision** | 1000 req/mois | OCR | Permanente |
| **AWS Rekognition** | 5000 images/mois | Face Match | 12 mois |
| **ClamAV Local** | Illimité | Antivirus | Permanente |
| **VirusTotal** | 4 req/min | Antivirus | Permanente |

---

## 🎯 Configuration Minimale Recommandée

### Pour tester (tout gratuit)

```env
# OCR - Google Cloud Vision
VITE_GOOGLE_CLOUD_API_KEY=AIzaSy...

# Face Match - AWS Rekognition
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Antivirus - ClamAV Local ou VirusTotal
VITE_CLAMAV_HOST=localhost
VITE_CLAMAV_PORT=3310

# OU
VITE_VIRUSTOTAL_API_KEY=...
```

---

## 🚀 Étapes Rapides (5 minutes)

### 1. Obtenir Google Cloud Vision API Key

```
1. https://console.cloud.google.com
2. Créer compte gratuit
3. Enable Vision API
4. Create API Key
5. Copier la clé
```

### 2. Obtenir AWS Rekognition Keys

```
1. https://aws.amazon.com
2. Créer compte gratuit
3. IAM > Users > Create User
4. Permissions: AmazonRekognitionFullAccess
5. Generate Access Keys
```

### 3. Installer ClamAV Local

```
Windows:
1. Download: https://www.clamav.net/downloads
2. Install
3. Start service

OU utiliser VirusTotal (gratuit online)
```

---

## 💰 Coûts Après Tier Gratuit

| Service | Après gratuit | Prix |
|---------|---------------|------|
| **Google Cloud Vision** | > 1000/mois | $1.50 / 1000 |
| **AWS Rekognition** | > 5000/mois | $1.00 / 1000 |
| **ClamAV** | Illimité | Gratuit |
| **VirusTotal** | > 4 req/min | $10-100/mois |

**Estimation pour 10,000 validations/mois** : ~$25-50

---

## ⚡ Configuration Ultra-Rapide (Option)

### Ne pas configurer tout de suite

Vous pouvez tester **sans clés API** en mode simulation !

Les services retournent des **résultats de simulation** qui permettent de :
- ✅ Tester l'interface
- ✅ Voir le flux de validation
- ✅ Comprendre les résultats

### Ajouter les clés plus tard

Quand vous êtes prêt pour la production, ajoutez les clés API dans `.env` et remplacez les mocks par les vrais appels.

---

## 📝 Checklist

- [ ] Google Cloud Vision : Clé API obtenue
- [ ] AWS Rekognition : Clés d'accès obtenues
- [ ] ClamAV : Installé ou VirusTotal configuré
- [ ] `.env` : Clés ajoutées
- [ ] SDKs : Installés via npm
- [ ] Test : Lancé avec succès

---

**Prêt à activer les services ! 🚀**

