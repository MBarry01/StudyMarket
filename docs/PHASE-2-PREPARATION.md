# 🚀 Phase 2 - Préparation Workers

## 📋 Dépendances Nécessaires

### Installation Complète

```bash
npm install bull ioredis tesseract.js face-api.js @tensorflow/tfjs-node canvas axios express-rate-limit prom-client
```

**Temps d'installation** : 2-5 minutes

---

## 🏗️ Structure de Fichiers à Créer

```
StudyMarket-Git/
├── backend/
│   ├── queues/
│   │   └── verification-queue.js (✅ À créer)
│   └── workers/
│       ├── ocr-worker.js (✅ À créer)
│       ├── face-match-worker.js (✅ À créer)
│       └── antivirus-worker.js (✅ À créer)
├── models/ (✅ À créer, télécharger modèles face-api)
│   └── (fichiers .weights)
└── server.js (✅ À modifier : ajouter import queue)
```

---

## 🎯 Étapes Phase 2

### Étape 1 : Installer Dépendances (Maintenant)
```bash
npm install bull ioredis tesseract.js axios express-rate-limit
```

**Note** : `face-api.js` et `canvas` nécessitent compilation native (peut prendre 5-10 min)

### Étape 2 : Créer Job Queue
Créer `/backend/queues/verification-queue.js` avec Bull + Redis

### Étape 3 : Créer Workers
- OCR worker
- Face-match worker
- Antivirus worker

### Étape 4 : Intégrer dans server.js
Modifier endpoints pour enqueue jobs

---

## ⏱️ Estimation Totale

**Temps** : 1-2 jours
**Complexité** : Moyenne
**Dépendances** : 8 packages npm

---

## 🎯 Commencer Maintenant ?

Souhaitez-vous que je :
1. **Installe les dépendances** (`npm install ...`)
2. **Crée les fichiers de la Phase 2** (queues, workers)
3. **Modifie server.js** pour intégrer

**Ou préférez-vous tester d'abord ce qui existe** avec `GUIDE-TEST-COMPLET.md` ?

---

**Dites-moi ce que vous préférez faire maintenant !** 🚀

