# 🚀 MVP Rapide - Progression

## ✅ Étape 1 : Setup BullMQ - FAIT

- ✅ Installé `bullmq`, `ioredis`
- ✅ Créé `src/queue/index.ts` (queue setup)
- ✅ Créé `src/services/queueService.ts` (service pour enqueue)
- ✅ Importé dans `verificationService.ts`
- ✅ TODO ajouté pour enqueue après doc creation

---

## ⏳ Prochaines Étapes

### Étape 2 : Worker Simple (À Faire)

Créer `src/worker/verificationWorker.js` :

```javascript
import { Worker } from 'bullmq';
import { db } from '../lib/firebase';
import AntivirusAdapter from './adapters/antivirusAdapter';
import OCRAdapter from './adapters/ocrAdapter';

const worker = new Worker('verification', async (job) => {
  const { verificationId, userId } = job.data;
  
  // 1. Load verification request
  const request = await db.collection('verification_requests').doc(verificationId).get();
  
  // 2. Download files locally (via service account)
  const localFiles = await downloadFiles(request.data.documents);
  
  // 3. Antivirus scan
  for (const file of localFiles) {
    const result = await AntivirusAdapter.scan(file.path);
    if (!result.clean) {
      // Reject immediately
      await db.collection('verification_requests').doc(verificationId).update({
        status: 'rejected',
        rejectReason: 'virus_detected',
      });
      return { rejected: true };
    }
  }
  
  // 4. OCR on first PDF/image
  const doc = localFiles.find(f => /\.(pdf|jpg|jpeg|png)$/i.test(f.filename));
  if (doc) {
    const ocrResult = await OCRAdapter.extract(doc.path);
    // Update with OCR results
    await db.collection('verification_requests').doc(verificationId).update({
      metadata: { ...request.data.metadata, ocr_result: ocrResult },
    });
  }
  
  // 5. Compute score & decide
  const score = computeScore(antivirus, ocr);
  const recommendation = score >= 70 ? 'verified' : 'under_review';
  
  await db.collection('verification_requests').doc(verificationId).update({
    status: recommendation,
    autoValidation: { score, recommendation },
  });
  
  return { ok: true };
}, {
  connection: { host: 'localhost', port: 6379 },
  concurrency: 5,
});
```

### Étape 3 : Adapters (À Faire)

**antivirusAdapter.js** :
```javascript
// Spawn clamav scan
export default class AntivirusAdapter {
  static async scan(filePath) {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec(`clamdscan ${filePath}`, (error, stdout) => {
        const clean = !error && !stdout.includes('FOUND');
        resolve({ clean, threats: clean ? [] : stdout });
      });
    });
  }
}
```

**ocrAdapter.js** :
```javascript
// Use Tesseract CLI
import { exec } from 'child_process';

export default class OCRAdapter {
  static async extract(filePath) {
    return new Promise((resolve, reject) => {
      exec(`tesseract ${filePath} stdout -l fra+eng`, (error, stdout) => {
        if (error) reject(error);
        resolve({ text: stdout, confidence: 85 });
      });
    });
  }
}
```

### Étape 4 : Setup Redis Local

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

Ou installer Redis localement.

### Étape 5 : Lancer le Worker

```javascript
// Ajouter au server.js ou créer worker.js séparé
import './src/queue/index';
import './src/worker/verificationWorker';

console.log('✅ Worker started');
```

---

## 📝 Fichiers Créés

- ✅ `src/queue/index.ts`
- ✅ `src/services/queueService.ts`
- ✅ `src/services/verificationService.ts` (modifié)

---

## 🔄 Workflow Actuel

```
1. User upload docs → Firebase Storage
2. Create verification request in Firestore
3. Validation auto côté client (simulation)
4. Statut: under_review (temporaire)
5. TODO: Worker process réel
```

---

## ⏭️ Workflow Cible

```
1. User upload docs → Firebase Storage
2. Create verification request in Firestore
3. Enqueue job: await QueueService.enqueueVerification(id, userId)
4. Worker télécharge docs
5. Worker scan antivirus + OCR
6. Worker calcule score
7. Worker update Firestore status
8. Frontend affiche résultat (poll ou websocket)
```

---

## 🎯 Prochaine Action

**Décidez** :
- [ ] Continuer setup worker + adapters (besoin Redis)
- [ ] Garder simulation pour l'instant (testing UX)
- [ ] Setup Redis et tester end-to-end

**Je peux continuer maintenant** si vous avez Redis installé ou pouvez run Docker ! 🚀

