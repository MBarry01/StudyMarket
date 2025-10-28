# 🚀 Démarrer le Worker - Guide Rapide

## 📋 Prérequis

- Redis installé et démarré
- Node.js installé
- Variables d'environnement configurées

---

## 🎯 Setup Rapide (5 minutes)

### 1️⃣ Installer Redis

**Windows (avec Docker)** :
```powershell
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Mac** :
```bash
brew install redis
brew services start redis
```

**Linux** :
```bash
sudo apt install redis-server
sudo systemctl start redis
```

### 2️⃣ Vérifier Redis

```bash
# Windows/Mac/Linux
redis-cli ping
# Devrait retourner: PONG
```

### 3️⃣ Ajouter Variables d'Environnement

Créer `.env` :
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 4️⃣ Démarrer le Worker

**Option A : Worker dans le même process**
```bash
# Modifier server.js pour importer le worker
# Puis démarrer normalement
npm run dev
```

**Option B : Worker séparé** (recommandé)
```bash
# Créer worker.js dans la racine
# Puis démarrer
node worker.js
```

---

## 🔄 Tester

### 1. Démarrer les Services

```bash
# Terminal 1 : Redis
docker start redis

# Terminal 2 : Backend + Worker
npm run dev

# Terminal 3 : Frontend (si besoin)
npm run dev
```

### 2. Upload Documents

1. Aller sur `http://localhost:5173/#/verification`
2. Upload documents
3. Observer les logs :

```
📤 Verification xxx enqueued for worker processing
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

## 🐛 Troubleshooting

### Redis non démarré
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
→ Démarrer Redis : `docker start redis`

### Worker ne processe pas
```
⚠️ Failed to enqueue job (worker not running?)
```
→ Vérifier que le worker est démarré

### Port 6379 déjà utilisé
```bash
# Trouver le PID
netstat -ano | findstr :6379
# Tuer le processus
taskkill /PID <PID> /F
```

---

## ✅ Checklist

- [ ] Redis installé et démarré
- [ ] `.env` configuré
- [ ] Worker démarré
- [ ] Test upload documents
- [ ] Vérifier logs worker

---

## 🎉 Prêt !

Une fois Redis démarré, le système fonctionnera automatiquement !

**Prochaine étape** : Testez un upload de documents et observez les logs ! 🚀

