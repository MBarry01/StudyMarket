# 🚀 Guide Worker Validation - MVP Rapide

## 📦 Ce Qui A Été Créé

### ✅ Fichiers Créés

1. **`src/queue/index.ts`** - Setup BullMQ queue
2. **`src/services/queueService.ts`** - Service pour enqueue jobs
3. **`src/worker/verificationWorker.ts`** - Worker principal
4. **`src/worker/adapters/antivirusAdapter.ts`** - Adapter antivirus
5. **`src/worker/adapters/ocrAdapter.ts`** - Adapter OCR
6. **`src/worker/adapters/faceMatchAdapter.ts`** - Adapter face matching

---

## 🛠️ Setup

### 1. Installer Redis

**Option A : Docker** (Recommandé)
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Option B : Local**
```bash
# Windows (avec Chocolatey)
choco install redis

# Mac (avec Homebrew)
brew install redis
```

### 2. Variables d'Environnement

Ajouter dans `.env` :
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. Démarrer le Worker

**Option A : Dans le même process que le serveur**

Ajouter dans `server.js` :
```javascript
import './src/queue/index';
import './src/worker/verificationWorker';
```

**Option B : Worker séparé**

Créer `worker.js` :
```javascript
import './src/queue/index';
import './src/worker/verificationWorker';

console.log('✅ Worker started on port', process.env.PORT || 3001);
```

Puis :
```bash
node worker.js
```

---

## 🔄 Workflow Complet

### 1. User Upload Documents

```typescript
// L'utilisateur upload des documents
await VerificationService.requestVerification(userId, userData, documents);
```

### 2. Enqueue Job

```typescript
// Dans requestVerification, après création du doc
await QueueService.enqueueVerification(verificationId, userId, { documents });
```

### 3. Worker Traite

```
Worker → Télécharge fichiers → Scan antivirus → OCR → Face Match → Score → Update DB
```

### 4. Status Change

Le frontend reçoit le nouveau statut via real-time listener.

---

## 🧪 Tester

### 1. Setup Redis

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
docker logs redis  # Vérifier que ça tourne
```

### 2. Démarrer le Serveur + Worker

```bash
npm run dev  # Frontend
node server.js  # Backend + Worker
```

### 3. Tester l'Upload

1. Aller sur `/verification`
2. Upload documents
3. Vérifier les logs du worker :
   ```
   🤖 [Worker] Processing verification xxx
   📥 [Worker] Downloaded 2 files
   🛡️ [Antivirus] Scanning...
   ✅ [Antivirus] Scan complete: CLEAN
   📄 [OCR] Extracting text...
   ✅ [OCR] Extracted 150 characters
   👤 [FaceMatch] Similarity: 85%
   📊 [Worker] Score: 68/100, Recommendation: under_review
   ✅ [Worker] Verification xxx processed successfully
   ```

---

## 🔧 Configuration

### BullMQ Options

```typescript
{
  concurrency: 5,        // 5 jobs en parallèle
  attempts: 3,           // 3 tentatives
  backoff: {
    type: 'exponential',
    delay: 5000,         // 5s, 10s, 20s
  },
}
```

### Worker Concurrency

Par défaut : 5 jobs en parallèle
Ajustable selon CPU/mémoire serveur

---

## 🎯 Prochaines Étapes

### Pour Production

1. **Environnement** :
   - [ ] Setup Redis production (hosted or self-managed)
   - [ ] Configurer REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

2. **Workers** :
   - [ ] Démarrer 2-3 workers pour high availability
   - [ ] Monitoring (queue length, failure rate)

3. **Adapters Réels** :
   - [ ] ClamAV pour antivirus
   - [ ] Tesseract CLI ou Google Vision pour OCR
   - [ ] AWS Rekognition pour face match

4. **Monitoring** :
   - [ ] Sentry pour erreurs
   - [ ] Prometheus pour métriques
   - [ ] Logs structurés (JSON)

---

## 📝 TODOs

- [ ] Activer enqueue dans `requestVerification`
- [ ] Installer et configurer Tesseract CLI
- [ ] Setup ClamAV pour antivirus réel
- [ ] Configurer AWS Rekognition pour face match
- [ ] Tests E2E complets

---

## ✅ État Actuel

- ✅ Queue system créé
- ✅ Worker prêt (simulation)
- ✅ Adapters créés (simulation)
- ⏳ Activé dans requestVerification (TODO)
- ⏳ Tests (à faire)

**Prêt à activer dès que Redis est installé !** 🚀

