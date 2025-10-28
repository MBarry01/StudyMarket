# 🚀 Plan de Migration : OCR/Validation Côté Serveur

## 📋 État Actuel

### ❌ Problèmes
- CORS Firebase Storage bloque l'OCR côté client
- Tesseract.js ne peut pas accéder aux PDFs Firebase Storage
- Validation automatique incomplète (dépend de l'OCR)

### ✅ Ce Qui Fonctionne
- Upload vers Firebase Storage ✅
- Validation Auto (score, recommandations) ✅
- Workflow complet (sauf OCR réel) ✅

---

## 🎯 Objectif

**Architecture Côté Serveur** :
```
Client → Upload (presigned) → Backend → Worker (BullMQ) → OCR/Antivirus/FaceMatch → Update DB → Notify
```

### Avantages
- ✅ **Aucun CORS** (worker télécharge directement)
- ✅ **Scalable** (queue Redis, retries)
- ✅ **Sécurisé** (service account, bucket privé)
- ✅ **Fiable** (retries, monitoring)
- ✅ **Performance** (parallélisation)

---

## 📦 Composants à Implémenter

### 1. **Backend Endpoints** (Express)
- [ ] `POST /api/verification/create` - Crée verification ID
- [ ] `POST /api/verification/upload-url` - Génère presigned URL
- [ ] `POST /api/verification/submit` - Valide et enqueue job
- [ ] `GET /api/verification/:id` - Status + timeline
- [ ] `POST /api/admin/verifications/:id/approve`
- [ ] `POST /api/admin/verifications/:id/reject`

### 2. **Queue System** (BullMQ/Redis)
- [ ] `src/queue/index.js` - Setup BullMQ
- [ ] `src/worker/verificationWorker.js` - Worker principal
- [ ] Retry logic (attempts: 3, exponential backoff)
- [ ] Dead-letter queue pour failures

### 3. **Storage Service** (Google Cloud Storage)
- [ ] `src/services/storageService.js`
  - `getPresignedUploadUrl(key, contentType)`
  - `getSignedDownloadUrl(key)`
  - `downloadToLocal(key, destPath)` - Pour worker

### 4. **Adapters**
- [ ] `src/adapters/antivirusAdapter.js` (ClamAV)
- [ ] `src/adapters/ocrAdapter.js` (Tesseract CLI ou Google Vision)
- [ ] `src/adapters/faceMatchAdapter.js` (AWS Rekognition ou sim)

### 5. **Monitoring & Tests**
- [ ] Sentry pour erreurs
- [ ] Prometheus metrics
- [ ] Unit tests (adapters)
- [ ] Integration tests (end-to-end)

---

## 🛠️ Commencer Maintenant ?

**Option 1 : Migration Complète** (recommanded)
- Setup complet BullMQ/Redis
- Worker avec tous les adapters
- Presigned URLs
- **Temps** : 2-3 jours

**Option 2 : MVP Rapide**
- Garder Firebase Storage temporairement
- Backend endpoint simple qui enqueue
- Worker basique (antivirus + OCR simple)
- **Temps** : 1 jour

---

## ✅ Prochaines Étapes

1. **Désactiver OCR client** (✅ FAIT)
2. **Décider** : MVP rapide ou migration complète ?
3. **Si MVP rapide** :
   - Créer `POST /api/verification/submit`
   - Setup BullMQ local
   - Worker simple (antivirus + OCR Tesseract CLI)
4. **Si migration complète** :
   - Setup Google Cloud Storage
   - Presigned URLs
   - Worker avec tous adapters
   - Tests E2E

---

## 📝 Todo Pour Vous

**Décidez** :
- [ ] MVP rapide (1 jour) - Pour tester rapidement
- [ ] Migration complète (2-3 jours) - Pour production

**Je peux commencer immédiatement** dès que vous choisissez !

---

## 🎯 Recommandation

**Pour MVP** : Commencer avec **MVP Rapide**
- Garde Firebase Storage (déjà configuré)
- Backend enqueue simple
- Worker avec Tesseract CLI
- Tests basiques

**Pour Production** : Migrer vers Google Cloud Storage plus tard quand scaling necessaire.

**Voulez-vous que je commence le MVP rapide maintenant ?** 🚀

