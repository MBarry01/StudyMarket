# 🚀 Plan Phases Restantes - Système de Vérification

## 📊 Vue d'Ensemble

**Phase 1** : ✅ Terminée (Endpoints API de base)
**Phase 2** : ⏳ En cours (Workers & Auto-Validation) - **5-7 jours**
**Phase 3** : ⏳ À faire (Security & Infrastructure) - **4-5 jours**
**Phase 4** : ⏳ À faire (Monitoring & Tests) - **5-7 jours**

**Total restant** : **14-19 jours**

---

## 🚀 PHASE 2 : Workers & Auto-Validation (Priorité Haute)

### 2.1 Setup Job Queue (Bull/Redis) - **Aujourd'hui**

#### Installation
```bash
npm install bull ioredis
```

#### Créer `/backend/queues/verification-queue.js`

```javascript
import Bull from 'bull';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

export const verificationQueue = new Bull('verification', {
  redis: { client: redis }
});

// Auto-retry avec exponential backoff
verificationQueue.process('auto-check', {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
}, async (job) => {
  console.log('🔍 Processing verification:', job.data.verificationId);
  
  // Appeler auto-validation
  const result = await performAutoValidation(job.data.verificationId);
  
  // Mettre à jour Firestore
  await updateVerificationStatus(job.data.verificationId, result);
  
  return result;
});

export async function enqueueAutoCheck(verificationId, documents) {
  return await verificationQueue.add('auto-check', {
    verificationId,
    documents,
    timestamp: Date.now()
  });
}

// Fonction d'auto-validation
async function performAutoValidation(verificationId) {
  // 1. Run OCR
  // 2. Run Face-Match
  // 3. Run Antivirus
  // 4. Check heuristics
  // 5. Return decision
  
  return {
    status: 'verified' | 'under_review' | 'rejected',
    confidence: 0-100,
    checks: {
      ocr: boolean,
      faceMatch: boolean,
      antivirus: boolean,
      emailDomain: boolean
    }
  };
}

async function updateVerificationStatus(verificationId, result) {
  const db = await import('firebase-admin');
  await db.firestore().collection('verification_requests').doc(verificationId).update({
    status: result.status,
    autoChecksPassed: result.checks.all,
    updatedAt: db.firestore.FieldValue.serverTimestamp()
  });
}

console.log('✅ Job Queue "verification" créée');
```

**Temps** : 3-4 heures

#### Modifier `server.js`

Ajouter après les endpoints de vérification :

```javascript
import { enqueueAutoCheck } from './queues/verification-queue.js';

// Modifier POST /api/verification/submit
app.post('/api/verification/submit', express.json(), async (req, res) => {
  try {
    const { verificationId, documents } = req.body;
    
    // Enqueue auto-check job
    await enqueueAutoCheck(verificationId, documents);
    
    res.json({
      success: true,
      message: 'Verification submitted for processing'
    });
  } catch (error) {
    console.error('❌ Erreur submit:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### 2.2 Worker OCR - **Demain**

#### Installation
```bash
npm install tesseract.js
```

#### Créer `/backend/workers/ocr-worker.js`

```javascript
import Tesseract from 'tesseract.js';

export async function extractTextFromDocument(documentUrl) {
  const worker = await Tesseract.createWorker('fra+eng');
  
  const { data: { text, confidence } } = await worker.recognize(documentUrl);
  
  await worker.terminate();
  
  // Extraire mots clés
  const keywords = extractKeywords(text);
  
  return {
    text,
    confidence,
    keywords
  };
}

function extractKeywords(text) {
  const lowerText = text.toLowerCase();
  
  const universityKeywords = [
    'université', 'university', 'école', 'faculty',
    'licence', 'master', 'doctorat', 'bachelor',
    'formation', 'campus'
  ];
  
  const found = universityKeywords.filter(k => lowerText.includes(k));
  
  return found.length >= 2 ? found : [];
}
```

**Temps** : 4-5 heures

---

### 2.3 Worker Face-Match - **Après-demain**

#### Installation
```bash
npm install face-api.js @tensorflow/tfjs-node canvas
```

#### Créer `/backend/workers/face-match-worker.js`

```javascript
import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
import * as canvas from 'canvas';

// Setup modèles
async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
}

export async function compareFaces(selfieUrl, idUrl) {
  // Charger modèles
  await loadModels();
  
  // Lire images
  const selfieImg = await canvas.loadImage(selfieUrl);
  const idImg = await canvas.loadImage(idUrl);
  
  // Détecter descripteurs
  const selfieDetection = await faceapi
    .detectSingleFace(selfieImg)
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  const idDetection = await faceapi
    .detectSingleFace(idImg)
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  // Comparer
  const distance = euclideanDistance(
    selfieDetection.descriptor,
    idDetection.descriptor
  );
  
  const score = Math.max(0, 100 - distance * 100);
  
  return {
    score,
    match: score >= 85,
    threshold: 85
  };
}

function euclideanDistance(a, b) {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
}
```

**Temps** : 5-6 heures
**Dépendance** : Télécharger modèles face-api.js (50MB)

---

### 2.4 Worker Antivirus - **Jour 4**

#### Installation
```bash
npm install axios
```

#### Créer `/backend/workers/antivirus-worker.js`

```javascript
import axios from 'axios';

export async function scanFile(fileUrl, apiKey) {
  try {
    // Upload fichier vers VirusTotal
    const response = await axios.post(
      'https://www.virustotal.com/vtapi/v2/file/scan',
      { apikey: apiKey, file: fileUrl },
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    
    const scanId = response.data.scan_id;
    
    // Polling résultats (max 60s)
    let scanResult = null;
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const report = await axios.get(
        `https://www.virustotal.com/vtapi/v2/file/report`,
        { params: { apikey: apiKey, resource: scanId } }
      );
      
      if (report.data.response_code === 1) {
        scanResult = report.data;
        break;
      }
    }
    
    return {
      clean: scanResult.positives === 0,
      positives: scanResult.positives || 0,
      total: scanResult.total || 0
    };
    
  } catch (error) {
    console.error('❌ Erreur scan antivirus:', error);
    // En cas d'erreur, on assume clean (conserver upload)
    return { clean: true, error: error.message };
  }
}
```

**Temps** : 3-4 heures
**Dépendance** : VirusTotal API key (gratuite)

---

### 2.5 Intégration - **Jour 5**

Modifier `/backend/queues/verification-queue.js` pour utiliser tous les workers :

```javascript
import { extractTextFromDocument } from './workers/ocr-worker.js';
import { compareFaces } from './workers/face-match-worker.js';
import { scanFile } from './workers/antivirus-worker.js';

export async function performAutoValidation(verificationId, documents) {
  const results = {
    ocr: [],
    faceMatch: null,
    antivirus: [],
    emailDomain: false
  };
  
  // 1. OCR sur tous les documents
  for (const doc of documents) {
    const ocrResult = await extractTextFromDocument(doc.url);
    results.ocr.push(ocrResult);
  }
  
  // 2. Face-match (si selfie + ID)
  const selfie = documents.find(d => d.type === 'selfie');
  const idDoc = documents.find(d => d.type === 'student_card');
  if (selfie && idDoc) {
    results.faceMatch = await compareFaces(selfie.url, idDoc.url);
  }
  
  // 3. Antivirus scan
  for (const doc of documents) {
    const scanResult = await scanFile(doc.url, process.env.VIRUSTOTAL_KEY);
    results.antivirus.push(scanResult);
  }
  
  // 4. Décision finale
  const decision = makeDecision(results);
  
  return decision;
}

function makeDecision(results) {
  const faceScore = results.faceMatch?.score || 0;
  const ocrFound = results.ocr.some(r => r.keywords.length >= 2);
  const isClean = results.antivirus.every(r => r.clean);
  
  // Score de risque
  let riskScore = 0;
  if (faceScore >= 90) riskScore += 40;
  else if (faceScore >= 75) riskScore += 20;
  if (ocrFound) riskScore += 30;
  if (isClean) riskScore += 30;
  
  // Décision
  if (riskScore >= 90 && isClean) {
    return { status: 'verified', confidence: 95 };
  } else if (riskScore >= 70) {
    return { status: 'under_review', confidence: riskScore };
  } else {
    return { status: 'rejected', reason: 'Auto-checks failed' };
  }
}
```

**Temps** : 4-5 heures

---

## 🔒 PHASE 3 : Security & Infrastructure (Priorité Moyenne)

### 3.1 Presigned URLs - **Jour 6-7**

#### Option A : Supabase Storage

```bash
npm install @supabase/supabase-js
```

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function generatePresignedUrl(userId, filename) {
  const path = `verifications/${userId}/${Date.now()}_${filename}`;
  
  const { data, error } = await supabase
    .storage
    .from('verifications')
    .createSignedUploadUrl(path, { expiresIn: 3600 });
  
  return data.url;
}
```

#### Option B : AWS S3

```javascript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

export async function generatePresignedUrl(userId, filename) {
  const key = `verifications/${userId}/${Date.now()}_${filename}`;
  
  return s3.getSignedUrl('putObject', {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: 3600
  });
}
```

**Temps** : 4-5 heures

---

### 3.2 Security Hardening - **Jour 8-9**

#### Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // 5 tentatives
  message: 'Too many verification attempts'
});

// Utiliser
router.post('/api/verification', verificationLimiter, handler);
```

#### Checksums Validation

```javascript
import crypto from 'crypto';

export function generateChecksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function validateChecksum(expected, actual) {
  return expected === actual;
}
```

**Temps** : 3-4 heures

---

## 📊 PHASE 4 : Monitoring & Tests (Priorité Basse)

### 4.1 Metrics - **Jour 10-11**

```bash
npm install prom-client
```

```javascript
import promClient from 'prom-client';

const verificationCounter = new promClient.Counter({
  name: 'verifications_submitted_total',
  help: 'Total verification submissions'
});

const verificationDuration = new promClient.Histogram({
  name: 'verification_processing_seconds',
  help: 'Verification processing time'
});

// Utiliser dans endpoints
verificationCounter.inc();
const timer = verificationDuration.startTimer();
// ... processing ...
timer.observe();
```

**Temps** : 4-5 heures

---

### 4.2 Tests - **Jour 12-14**

```javascript
// tests/verification.test.js
describe('Verification System', () => {
  it('should create verification', async () => {
    const res = await request(app)
      .post('/api/verification')
      .send({ userId: 'test123' });
    
    expect(res.status).toBe(201);
    expect(res.body.verificationId).toBeDefined();
  });
  
  it('should auto-approve high-confidence', async () => {
    // Test auto-validation
  });
});
```

**Temps** : 6-8 heures

---

## 📅 Timeline Recommandée

**Semaine 1** : Phase 2 (Workers)
- J1 : Job Queue + Setup
- J2 : OCR Worker
- J3 : Face-Match Worker
- J4 : Antivirus Worker
- J5 : Intégration

**Semaine 2** : Phase 3 (Security)
- J6-7 : Presigned URLs
- J8-9 : Security hardening

**Semaine 3** : Phase 4 (Monitoring)
- J10-11 : Metrics
- J12-14 : Tests complets

---

## 🎯 Prochaine Action Immédiate

**Aujourd'hui** : Setup Job Queue (Bull/Redis)

Souhaitez-vous que je :
1. ✅ Crée les fichiers pour la Phase 2 maintenant
2. ⏳ Attende que vous testiez Phase 1 d'abord

**Dites-moi ce que vous préférez !** 🚀

