# 🎯 Plan d'Action - Point par Point

## ✅ Phase 0 : Prérequis (Déjà Fait)

- [x] Types et interfaces (6 états)
- [x] Composants UI (Badge, Progress, Timeline)
- [x] Pages frontend (Profile, Settings, Verification)
- [x] Services client-side (VerificationService, UploadService)
- [x] Index Firestore
- [x] Règles Storage basiques

---

## 🚀 PHASE 1 : Backend Foundation (5-7 jours)

### 1.1 Créer Backend Node.js/Express
**Fichier** : `backend/verification-service.js`

```javascript
// Structure de base
const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');

const app = express();
const router = express.Router();

// Endpoints à créer (voir 1.2)

module.exports = router;
```

**Temps** : 2-3 heures

---

### 1.2 Endpoints API de Base

#### a) POST /api/verification
```javascript
// Créer une demande de vérification
router.post('/', async (req, res) => {
  const { userId } = req.body;
  
  // 1. Vérifier idempotency key
  // 2. Créer document dans Firestore
  // 3. Retourner { verificationId, presignedUrls }
});
```

**Spécifications** :
- Valider idempotency key (header `Idempotency-Key`)
- Créer document avec statut `documents_submitted`
- Calculer `expires_at = now + 30d`
- Incrémenter `attempts_count`
- Enregistrer métadonnées (ip, userAgent)
- Retourner presigned URLs pour upload

**Temps** : 4-5 heures

#### b) GET /api/verification/:id
```javascript
// Récupérer le statut complet
router.get('/:id', async (req, res) => {
  // 1. Récupérer document Firestore
  // 2. Générer URLs presignés pour documents
  // 3. Retourner statut + timeline
});
```

**Spécifications** :
- Récupérer document `verification_requests/{id}`
- Générer URLs presignés (TTL 300s)
- Inclure timeline (submittedAt, reviewedAt)
- Trier documents par date

**Temps** : 2-3 heures

#### c) POST /api/verification/submit
```javascript
// Soumettre après upload
router.post('/submit', async (req, res) => {
  const { verificationId, fileKeys } = req.body;
  
  // 1. Valider checksums
  // 2. Enqueue auto-check worker
  // 3. Retourner statut
});
```

**Spécifications** :
- Valider checksums (compare client vs storage ETag)
- Envoyer job dans queue pour auto-checks
- Retourner statut `under_review` ou `auto_approved`

**Temps** : 3-4 heures

#### d) GET /api/user/:id/verification
```javascript
// Statut rapide pour profil
router.get('/user/:id/verification', async (req, res) => {
  // Retourner uniquement status + badge info
});
```

**Spécifications** :
- Requête optimisée (seulement `status`)
- Cache 5s

**Temps** : 1-2 heures

#### e) POST /api/admin/verifications/:id/approve
```javascript
// Approver une demande (Admin only)
router.post('/admin/verifications/:id/approve', async (req, res) => {
  // 1. Vérifier custom claim admin
  // 2. Mettre à jour status = verified
  // 3. Créer entrée audit
  // 4. Notifier utilisateur
});
```

**Spécifications** :
- Middleware `requireAdmin`
- Vérifier custom claim `admin: true`
- Mettre à jour `status = verified`, `reviewedAt`, `reviewedBy`
- Créer entrée dans `verification_audit`
- Trigger email de notification
- Mettre à jour `users.is_verified_student = true`

**Temps** : 3-4 heures

#### f) POST /api/admin/verifications/:id/reject
```javascript
// Rejeter une demande
router.post('/admin/verifications/:id/reject', async (req, res) => {
  const { reason } = req.body;
  // 1. Vérifier raison fournie
  // 2. Mettre à jour status = rejected
  // 3. Créer audit log
});
```

**Spécifications** :
- `reason` obligatoire (min 10 caractères)
- Status `rejected` + `rejectionReason`
- Audit log avec payload complet

**Temps** : 2-3 heures

---

### 1.3 Presigned URLs (S3/Supabase)

**Option A : Supabase Storage**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generatePresignedUrl(bucket, path) {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .createSignedUploadUrl(path, {
      expiresIn: 3600 // 1h
    });
  
  return data.url;
}
```

**Option B : AWS S3**
```javascript
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

async function generatePresignedUrl(bucket, key) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucket,
    Key: key,
    Expires: 3600
  });
}
```

**Temps** : 4-5 heures

**Étape suivante** : Installer SDK et configurer credentials

---

### 1.4 Admin Routes Protection

```javascript
// middleware/requireAdmin.js
const requireAdmin = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  
  if (!decodedToken.admin && !decodedToken.reviewer) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  req.user = decodedToken;
  next();
};

// Utilisation
router.post('/admin/verifications/:id/approve', requireAdmin, handler);
```

**Temps** : 2-3 heures

---

## 🚀 PHASE 2 : Workers & Auto-Validation (7-10 jours)

### 2.1 Job Queue Setup (Bull/Redis)

```bash
npm install bull ioredis
```

```javascript
// queues/verification-queue.js
const Bull = require('bull');
const verificationQueue = new Bull('verification', {
  redis: { host: REDIS_HOST, port: 6379 }
});

// Auto-retry avec exponential backoff
verificationQueue.process('auto-check', {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
}, async (job) => {
  const { verificationId } = job.data;
  // Worker logic (voir 2.2-2.5)
});

module.exports = verificationQueue;
```

**Temps** : 3-4 heures

---

### 2.2 Worker OCR

```javascript
// workers/ocr-worker.js
const Tesseract = require('tesseract.js');
const { Storage } = require('@google-cloud/storage');

async function extractText(documentUrl) {
  // 1. Télécharger image depuis Storage
  // 2. OCR avec Tesseract
  // 3. Extraire mots clés (université, nom, date)
  // 4. Retourner résultats
  
  const worker = await Tesseract.createWorker('fra');
  const { data: { text } } = await worker.recognize(imagePath);
  const keywords = extractKeywords(text);
  
  return { text, keywords, confidence: data.confidence };
}

async function extractKeywords(text) {
  const universityKeywords = ['université', 'university', 'école', 'faculty'];
  const found = universityKeywords.filter(k => 
    text.toLowerCase().includes(k.toLowerCase())
  );
  
  return found.length >= 2 ? found : [];
}
```

**Dépendances** : 
```bash
npm install tesseract.js @google-cloud/storage
```

**Temps** : 5-6 heures

---

### 2.3 Worker Face-Match

```javascript
// workers/face-match-worker.js
const faceapi = require('face-api.js');
const { canvas, Image } = require('canvas');

async function compareFaces(selfieUrl, idUrl) {
  // 1. Charger modèles face-api
  // 2. Détecter visages dans selfie et ID
  // 3. Extraire descripteurs
  // 4. Calculer distance euclidienne
  // 5. Score 0-100
  
  const selfieDetection = await faceapi
    .detectSingleFace(selfieUrl)
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  const idDetection = await faceapi
    .detectSingleFace(idUrl)
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  const distance = euclideanDistance(
    selfieDetection.descriptor,
    idDetection.descriptor
  );
  
  const score = Math.max(0, 100 - distance * 100);
  
  return { score, threshold: score >= 85 };
}
```

**Dépendances** :
```bash
npm install face-api.js canvas
```

**Temps** : 6-8 heures

---

### 2.4 Worker Antivirus Scan

```javascript
// workers/antivirus-worker.js
const axios = require('axios');

async function scanFile(fileUrl, apiKey) {
  // 1. Envoyer fichier à VirusTotal API
  // 2. Attendre résultats
  // 3. Parser réponse
  // 4. Retourner clean/infected
  
  const response = await axios.post(
    'https://www.virustotal.com/vtapi/v2/file/scan',
    {
      apikey: apiKey,
      file: fileUrl
    }
  );
  
  const resultId = response.data.scan_id;
  
  // Polling pour résultats
  const scanResult = await pollScanResult(apikey, resultId);
  
  return scanResult.positives === 0;
}
```

**Dépendances** :
```bash
npm install axios
```

**Configuration** : VirusTotal API key

**Temps** : 3-4 heures

---

### 2.5 Auto-Validation Logic

```javascript
// services/auto-validation.js
async function performAutoValidation(verificationId) {
  const verification = await getVerification(verificationId);
  
  // 1. Run OCR
  const ocrResults = await runOCR(verification.documents);
  
  // 2. Run face-match (si selfie + ID)
  const faceScore = await runFaceMatch(verification.documents);
  
  // 3. Run antivirus scan
  const isClean = await runAntivirus(verification.documents);
  
  // 4. Check email domain
  const emailDomainOk = checkEmailDomain(verification.userEmail);
  
  // 5. Check attempts
  const attemptsOk = verification.attemptsCount <= 3;
  
  // 6. Heuristiques
  const riskScore = calculateRiskScore({
    faceScore,
    emailDomainOk,
    ocrFound: ocrResults.keywords.length,
    isClean,
    attemptsOk
  });
  
  // 7. Decision
  if (riskScore >= 90 && isClean && attemptsOk) {
    await approveAuto(verificationId);
  } else if (riskScore >= 75) {
    await markForManualReview(verificationId);
  } else {
    await rejectAuto(verificationId, 'Auto-checks failed');
  }
}

function calculateRiskScore(checks) {
  let score = 0;
  
  if (checks.faceScore >= 90) score += 40;
  else if (checks.faceScore >= 75) score += 20;
  
  if (checks.emailDomainOk) score += 20;
  if (checks.ocrFound >= 2) score += 20;
  if (checks.isClean) score += 20;
  if (checks.attemptsOk) score += 0; // Pas de penalty
  
  return Math.min(100, score);
}
```

**Temps** : 5-6 heures

---

## 🚀 PHASE 3 : UX & Security (4-5 jours)

### 3.1 Polling Optimisé / SSE

```javascript
// frontend/hooks/useVerificationStatus.js
import { useEffect, useState } from 'react';

export function useVerificationStatus(verificationId) {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/verification/${verificationId}`);
      const data = await response.json();
      setStatus(data);
    }, 3000); // Poll every 3s
    
    return () => clearInterval(interval);
  }, [verificationId]);
  
  return status;
}
```

**Ou avec SSE** :
```javascript
// frontend/hooks/useVerificationStatusSSE.js
const eventSource = new EventSource(`/api/verification/${verificationId}/stream`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setStatus(data);
};
```

**Temps** : 3-4 heures

---

### 3.2 Rate Limiting

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // 5 tentatives max
  message: 'Too many attempts, please try later'
});

// Utilisation
router.post('/verification', verificationLimiter, handler);
```

**Temps** : 1-2 heures

---

### 3.3 Checksums Validation

```javascript
// backend/services/checksum-validator.js
const crypto = require('crypto');

function generateChecksum(fileBuffer) {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

async function validateChecksum(clientChecksum, storageETag) {
  return clientChecksum === storageETag;
}
```

**Temps** : 2-3 heures

---

### 3.4 Chiffrement at Rest

```javascript
// backend/services/encryption.js
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.ENCRYPTION_KEY;

function encrypt(buffer) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return { encrypted, iv, authTag };
}
```

**Temps** : 3-4 heures

---

## 🚀 PHASE 4 : Monitoring & Tests (5-7 jours)

### 4.1 Metrics (Prometheus)

```javascript
// backend/monitoring/metrics.js
const prometheus = require('prom-client');

const verificationSubmittedCounter = new prometheus.Counter({
  name: 'verifications_submitted_total',
  help: 'Total verification submissions'
});

const verificationDurationHistogram = new prometheus.Histogram({
  name: 'verification_processing_duration_seconds',
  help: 'Verification processing duration',
  buckets: [1, 5, 10, 30, 60, 120]
});

// Utilisation
verificationSubmittedCounter.inc();
const timer = verificationDurationHistogram.startTimer();
// ... processing ...
timer.observeDuration();
```

**Temps** : 4-5 heures

---

### 4.2 Tests Complets

```javascript
// tests/unit/verification-validation.test.js
const { validateEmailDomain } = require('./validation');

describe('Email domain validation', () => {
  it('should accept university emails', () => {
    expect(validateEmailDomain('user@univ-paris.fr')).toBe(true);
  });
  
  it('should reject personal emails', () => {
    expect(validateEmailDomain('user@gmail.com')).toBe(false);
  });
});

// tests/integration/verification-flow.test.js
describe('Verification flow', () => {
  it('should create → upload → submit → approve', async () => {
    // Create verification
    const res1 = await request(app).post('/api/verification')
      .send({ userId: 'test123' });
    
    expect(res1.status).toBe(201);
    const { verificationId, presignedUrls } = res1.body;
    
    // Upload files
    for (const url of presignedUrls) {
      await axios.put(url, fileBuffer);
    }
    
    // Submit
    const res2 = await request(app).post('/api/verification/submit')
      .send({ verificationId, fileKeys: [...] });
    
    expect(res2.status).toBe(200);
    
    // Wait for auto-approval
    await waitForJob();
    
    // Check status
    const res3 = await request(app).get(`/api/verification/${verificationId}`);
    expect(res3.body.status).toBe('verified');
  });
});
```

**Temps** : 8-10 heures

---

### 4.3 Operational Runbook

```markdown
# Runbook - Verification System

## Incident : Manual queue > 100

1. Check dashboard : https://grafana.company.com/verifications
2. Alert team via Slack
3. Run reconciliation :
   ```sql
   SELECT * FROM verifications 
   WHERE status='under_review' 
   ORDER BY risk_score DESC 
   LIMIT 50;
   ```
4. Add temporary reviewers or auto-approve low-risk

## Incident : Suspicious uploads spike

1. Pause new verifications (feature flag)
2. Run virus scan on recent uploads
3. Delete infected files
4. Rotate upload policy
5. Notify affected users

## Monitoring

- Queue size alert : > 100
- Processing time alert : > 24h
- Upload error rate alert : > 5%
```

**Temps** : 2-3 heures

---

## 📊 Estimation Totale

| Phase | Tâches | Heures | Jours |
|-------|--------|--------|-------|
| Phase 1 : Backend | 6 tâches | 20-25h | 5-7j |
| Phase 2 : Workers | 5 tâches | 22-28h | 7-10j |
| Phase 3 : Security | 4 tâches | 9-13h | 4-5j |
| Phase 4 : Monitoring | 3 tâches | 14-18h | 5-7j |
| **TOTAL** | **18 tâches** | **65-84h** | **21-29j** |

**Recommandation** : Parcourir sprint par sprint, tester chaque phase avant de passer à la suivante.

