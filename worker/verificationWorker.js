/**
 * Worker backend pour traiter les vérifications
 * 
 * Ce fichier doit être dans /worker/ (backend) et NON dans /src/ (frontend)
 * BullMQ ne peut pas fonctionner dans le navigateur
 */

import { Worker } from 'bullmq';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin (service account)
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const storage = getStorage();

console.log('✅ Firebase Admin initialized for worker');

// Import adapters (backend-only)
// TODO: Créer les vrais adapters
const AntivirusAdapter = {
  async scan(filePath) {
    console.log(`🛡️ [Antivirus] Scanning: ${filePath}`);
    // TODO: ClamAV integration
    return { clean: true, threats: [], scanner: 'clamav', scannedAt: new Date().toISOString() };
  }
};

const OCRAdapter = {
  async extract(filePath) {
    console.log(`📄 [OCR] Extracting from: ${filePath}`);
    // TODO: Tesseract integration
    return {
      text: 'Simulated OCR result',
      confidence: 85,
      entities: { institution: 'Sorbonne', studentId: '22108126' }
    };
  }
};

const FaceMatchAdapter = {
  async compare(selfiePath, idCardPath) {
    console.log(`👤 [FaceMatch] Comparing: ${selfiePath} vs ${idCardPath}`);
    // TODO: AWS Rekognition integration
    return { verified: true, similarity: 85, confidence: 85, method: 'simulated' };
  }
};

// Worker principal
const verificationWorker = new Worker(
  'verification',
  async (job) => {
    const { verificationId, userId } = job.data;
    console.log(`🤖 [Worker] Processing ${verificationId}`);

    try {
      // Load verification
      const verificationRef = db.collection('verification_requests').doc(verificationId);
      const verification = await verificationRef.get();

      if (!verification.exists) {
        throw new Error(`Verification ${verificationId} not found`);
      }

      const data = verification.data();

      if (data.status === 'verified' || data.status === 'rejected') {
        return { skipped: true };
      }

      // Download files locally
      const localFiles = [];
      for (const doc of data.documents || []) {
        const tmp = path.join(os.tmpdir(), `${verificationId}_${doc.filename}`);
        
        // Download from Firebase Storage
        const bucket = storage.bucket();
        const file = bucket.file(doc.key);
        await file.download({ destination: tmp });
        
        localFiles.push({ ...doc, localPath: tmp });
      }

      // Antivirus scan
      for (const file of localFiles) {
        const av = await AntivirusAdapter.scan(file.localPath);
        if (!av.clean) {
          await verificationRef.update({ status: 'rejected', rejectReason: 'virus' });
          return { rejected: true };
        }
      }

      // OCR
      const pdf = localFiles.find(f => /\.(pdf|jpg|jpeg|png)$/i.test(f.filename));
      const ocrResult = pdf ? await OCRAdapter.extract(pdf.localPath) : null;

      // Face match
      const selfie = localFiles.find(f => /selfie/i.test(f.filename));
      const idCard = localFiles.find(f => /card|carte/i.test(f.filename));
      const faceMatch = (selfie && idCard) ? await FaceMatchAdapter.compare(selfie.localPath, idCard.localPath) : null;

      // Compute score
      let score = 0;
      if (ocrResult) score += 35;
      if (faceMatch?.verified) score += 20;
      score += 15; // Antivirus passed

      const status = score >= 70 ? 'verified' : score >= 40 ? 'under_review' : 'rejected';

      await verificationRef.update({
        status,
        autoValidation: { score, ocrResult, faceMatch },
      });

      // Cleanup
      for (const f of localFiles) {
        await fs.unlink(f.localPath).catch(() => {});
      }

      console.log(`✅ [Worker] ${verificationId} processed: ${status}`);
      return { ok: true, status, score };

    } catch (error) {
      console.error(`❌ [Worker] Error:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: 5,
  }
);

console.log('✅ Verification worker started');
console.log(`🔗 Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await verificationWorker.close();
  process.exit(0);
});

