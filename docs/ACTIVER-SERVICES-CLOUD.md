# ⚡ Activer les Services Cloud - Guide Rapide

## 🎯 3 Services à Activer (Optionnels)

Vous n'avez **PAS BESOIN** de clés API pour tester ! Les services fonctionnent en **mode simulation**.

### Option 1 : Tester en Mode Simulation ⭐ (Recommandé)

**Aucune configuration nécessaire !**

Les services retournent des résultats fictifs mais réalistes pour tester l'interface.

```bash
# Lancer l'app
npm run dev

# Aller sur
http://localhost:5173/StudyMarket/#/test-validation

# Cliquer "Lancer les Tests"
```

✅ **Vous verrez** :
- Score de validation
- Recommandation
- Détails OCR, Face Match, Antivirus
- Flags de risque

---

### Option 2 : Activer Vrais Services (Plus tard)

Quand vous voulez activer les vrais services cloud :

#### 1. Google Cloud Vision (OCR) - Gratuit

**5 minutes** :
1. https://console.cloud.google.com
2. Créer compte gratuit (carte demandée mais pas débitée)
3. Activer Vision API
4. Créer clé API
5. Copier dans `.env`

```env
VITE_GOOGLE_CLOUD_API_KEY=AIzaSy...
```

#### 2. AWS Rekognition (Face Match) - Gratuit 12 mois

**10 minutes** :
1. https://aws.amazon.com
2. Créer compte gratuit
3. IAM > Users > Créer utilisateur
4. Permissions: AmazonRekognitionFullAccess
5. Générer clés d'accès

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

#### 3. ClamAV (Antivirus) - Gratuit

**Option A - Local (gratuit)** :
```bash
# Télécharger ClamAV
https://www.clamav.net/downloads

# Configurer
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

**Option B - VirusTotal (gratuit en ligne)** :
1. https://www.virustotal.com
2. Créer compte
3. Obtenir clé API

```env
VITE_VIRUSTOTAL_API_KEY=...
```

---

## 📋 Ce Qui Fonctionne MAINTENANT

### ✅ Sans Clés API (Mode Simulation)

- Page de test accessible
- Services retournent des résultats de simulation
- Interface complète fonctionnelle
- Score et recommandation calculés
- UX complète pour tester le système

### ⚡ Avec Clés API (Mode Production)

- Extraction texte réelle depuis documents
- Comparaison faciale réelle
- Scan antivirus réel
- Validation automatique complète

---

## 🚀 Recommandation

### Pour DÉVELOPPEMENT

**Option 1** : Tester en mode simulation (maintenant) ✅

```bash
npm run dev
# Accéder à /test-validation
# Tester les services
```

### Pour PRODUCTION

**Option 2** : Configurer les clés API plus tard

Quand vous êtes prêt, suivez :
- `docs/OBTENIR-CLEFS-API-GRATUITES.md`
- `docs/CONFIGURATION-SERVICES-CLOUD.md`

---

## 🎯 Test Maintenant

**Vous pouvez tester SANS clés API !**

```bash
# 1. Lancer l'app
npm run dev

# 2. Ouvrir
http://localhost:5173/StudyMarket/#/test-validation

# 3. Cliquer "Lancer les Tests"

# 4. Voir les résultats de simulation
```

---

## 💡 Résumé

- ✅ **Services créés** : OCR, Face Match, Antivirus, Auto Validation
- ✅ **Page de test** : Créée et accessible
- ✅ **Mode simulation** : Fonctionnel sans clés API
- ⏳ **Mode production** : Ajouter clés API quand prêt

**Vous pouvez tester maintenant sans rien configurer ! 🚀**

