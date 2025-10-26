# ⚙️ Configuration des Services Cloud (Phase 2)

## 📋 Vue d'ensemble

Les services cloud ajoutent la **validation automatique** au système de vérification :

1. **OCR Service** : Extraction texte des documents
2. **Face Match Service** : Comparaison faciale
3. **Antivirus Service** : Scan de sécurité

---

## 🎯 Statut Actuel

### ✅ Services créés (Mode simulation)

- `src/services/ocrService.ts` - OCR avec simulation
- `src/services/faceMatchService.ts` - Face Match avec simulation
- `src/services/antivirusService.ts` - Antivirus avec simulation
- `src/services/autoValidationService.ts` - Orchestration complète

### ⚠️ Configuration nécessaire

Pour activer les vrais services cloud, ajouter les clés API dans `.env` :

```env
# Google Cloud Vision (OCR)
VITE_GOOGLE_CLOUD_API_KEY=...
GOOGLE_CLOUD_PROJECT_ID=...

# OU AWS Textract (OCR)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...

# AWS Rekognition (Face Match)
VITE_AWS_REKOGNITION_ENABLED=true

# ClamAV (Antivirus)
VITE_CLAMAV_HOST=...
VITE_CLAMAV_PORT=3310

# OU VirusTotal (Antivirus)
VITE_VIRUSTOTAL_API_KEY=...
```

---

## 🔧 Configuration par Service

### 1. OCR Service (Google Cloud Vision)

**Choix** : Google Cloud Vision vs AWS Textract

#### Option A : Google Cloud Vision ⭐ (Recommandé)

**Avantages** :
- Meilleure précision
- API simple
- Gratuit jusqu'à 1000 requêtes/mois

**Configuration** :

```bash
# 1. Installer SDK
npm install @google-cloud/vision

# 2. Créer compte Google Cloud
# https://console.cloud.google.com

# 3. Activer Vision API
# https://console.cloud.google.com/apis/library/vision.googleapis.com

# 4. Créer clé API
# https://console.cloud.google.com/apis/credentials
```

**Fichier `.env`** :
```env
GOOGLE_CLOUD_API_KEY=AIzaSy...
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

**Code** :
```typescript
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});

const [result] = await client.documentTextDetection(imageUrl);
const text = result.fullTextAnnotation?.text || '';
```

#### Option B : AWS Textract

**Configuration** :

```bash
npm install @aws-sdk/client-textract
```

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

---

### 2. Face Match Service (AWS Rekognition)

**Choix** : AWS Rekognition vs Azure Face

#### Option A : AWS Rekognition ⭐ (Recommandé)

**Configuration** :

```bash
npm install @aws-sdk/client-rekognition
```

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

**Code** :
```typescript
import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition';

const client = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const command = new CompareFacesCommand({
  SourceImage: { Bytes: sourceBuffer },
  TargetImage: { Bytes: targetBuffer },
  SimilarityThreshold: 70,
});

const response = await client.send(command);
```

**Coût** : ~$1 pour 1000 comparaisons

#### Option B : Azure Face

```bash
npm install @azure/cognitiveservices-face
```

```env
AZURE_FACE_KEY=...
AZURE_FACE_ENDPOINT=https://...
```

---

### 3. Antivirus Service

**Choix** : ClamAV vs VirusTotal

#### Option A : ClamAV ⭐ (Recommandé - Gratuit)

**Configuration** :

**Option 1 : ClamAV local**
```bash
# Installer ClamAV
sudo apt-get install clamav clamav-daemon

# OU avec Docker
docker run -d --name clamav malware/testclam:latest
```

```env
VITE_CLAMAV_HOST=localhost
VITE_CLAMAV_PORT=3310
```

**Code** :
```typescript
import clamav from 'clamav';

const client = clamav.createScanner({
  host: process.env.CLAMAV_HOST,
  port: process.env.CLAMAV_PORT,
});

const result = await client.scan(fileBuffer);
```

**Option 2 : ClamAV Cloud (ClamAV.net)**

```env
CLAMAV_CLOUD_API_KEY=...
```

#### Option B : VirusTotal (Commerc Innov)

```bash
npm install virustotal-api
```

```env
VIRUSTOTAL_API_KEY=...
```

**Limite** : 4 requêtes/minute gratuit, après payant

---

## 🚀 Déploiement

### Étape 1 : Ajouter clés API

Créer `.env.local` (pour secrets) :

```env
# Google Cloud Vision
GOOGLE_CLOUD_API_KEY=AIzaSy...

# AWS Rekognition
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# ClamAV
CLAMAV_HOST=localhost
CLAMAV_PORT=3310

# OU VirusTotal
VIRUSTOTAL_API_KEY=...
```

### Étape 2 : Implémenter les vraies appels

Modifier les fichiers services pour remplacer les mocks par les vrais appels API.

**Exemple** : `src/services/ocrService.ts`

```typescript
// AVANT (mock)
const mockResult = { ... };

// APRÈS (vrai appel)
import vision from '@google-cloud/vision';
const client = new vision.ImageAnnotatorClient({...});
const [result] = await client.documentTextDetection({...});
```

### Étape 3 : Tester

```bash
# Lancer l'app
npm run dev

# Tester validation automatique
# Upload documents → Vérifier logs console
```

---

## 💰 Coûts Approximatifs

| Service | Tier gratuit | Prix payant |
|---------|--------------|-------------|
| **Google Cloud Vision** | 1000 req/mois | $1.50 / 1000 |
| **AWS Rekognition** | 1000 req/mois | $1.00 / 1000 |
| **ClamAV** | Gratuit | Gratuit |
| **VirusTotal** | 4 req/min | $10-100/mois |

**Total estimé** : ~$50-100/mois pour 10,000 validations

---

## 🎯 Recommandations

### Pour développement (gratuit)
- **OCR** : Google Cloud Vision (1000 req/mois gratuit)
- **Face Match** : Désactiver (optionnel)
- **Antivirus** : ClamAV local

### Pour production (optimisé coûts)
- **OCR** : Google Cloud Vision
- **Face Match** : AWS Rekognition
- **Antivirus** : ClamAV hébergé

---

## 📝 Prochaines Étapes

1. ✅ Services créés (mode simulation)
2. ⏳ Choisir services cloud
3. ⏳ Ajouter clés API dans `.env`
4. ⏳ Implémenter vrais appels API
5. ⏳ Tester en développement
6. ⏳ Déployer en production

---

## 🆘 Support

Pour questions sur :
- **Google Cloud Vision** : https://cloud.google.com/vision/docs
- **AWS Rekognition** : https://docs.aws.amazon.com/rekognition
- **ClamAV** : https://www.clamav.net/documentation.html

---

**Les services sont prêts ! Il suffit d'ajouter les clés API et d'implémenter les vrais appels.** 🚀

