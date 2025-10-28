# 🧪 Test du Système de Vérification

## 🎯 Ce Qu'On Va Tester

1. Upload de documents ✅
2. Validation automatique (score) ✅
3. Statut déterminé ✅
4. Enqueue job ✅
5. Badge affiché ✅

---

## 📋 Setup Rapide

### 1. Démarrer le Serveur Backend

```bash
node server.js
```

**Attendu** :
```
🚀 Serveur API StudyMarket démarré sur le port 3001
📡 Endpoints disponibles:
   POST /api/verification/enqueue
```

### 2. Démarrer le Frontend

```bash
npm run dev
```

**Attendu** :
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🧪 Test Complet

### Étape 1 : Aller sur la Page de Vérification

Ouvrir : `http://localhost:5173/#/verification`

**Vérifier** :
- ✅ Formulaire visible
- ✅ Section "Vérification du compte" affichée
- ✅ Badge de statut visible

### Étape 2 : Upload Documents

1. Choisir un fichier (PDF ou image)
2. Cliquer "Soumettre"

**Observer dans Console** :
```
🤖 Démarrage validation automatique...
🤖 [AutoValidation] Début validation pour mohamadou.barryy@gmail.com
🛡️ Scan antivirus pour: Certificat_de_Scolarité.pdf
✅ Scan terminé: {clean: true, ...}
📄 OCR extraction pour: ...
⚠️ [OCR] Client-side temporairement désactivé. La validation se fera côté serveur.
✅ [OCR] Simulation retournée
✅ Validation terminée: {score: 68, recommendation: 'admin_review', ...}
📤 Verification xxx enqueued for worker processing
```

### Étape 3 : Vérifier le Résultat

**Sur la page** :
- ✅ Badge "En cours" ou "Vérifié" visible
- ✅ Progress bar affichée
- ✅ Timeline affichée
- ✅ Message correspondant au statut

**Dans Firestore** :
- ✅ `verification_requests` collection
- ✅ Document créé avec statut
- ✅ Documents uploadés référencés

### Étape 4 : Vérifier sur Profil

Aller sur : `http://localhost:5173/#/profile`

**Vérifier** :
- ✅ Badge de vérification visible
- ✅ Link vers `/verification` fonctionnel

### Étape 5 : Admin Panel (Optionnel)

Aller sur : `http://localhost:5173/#/admin/verifications`

**Vérifier** :
- ✅ Liste des demandes
- ✅ Filtres fonctionnels
- ✅ Détails visibles

---

## ✅ Résultats Attendus

### Simulation Actuelle

**Ce Qui Fonctionne** :
- ✅ Upload documents vers Firebase Storage
- ✅ Validation auto (score calculé)
- ✅ Statut déterminé automatiquement
- ✅ Enqueue job (simulé)
- ✅ Badge affiché
- ✅ Timeline affichée

**Ce Qui Est Simulé** :
- ⚠️ OCR (simulation retournée)
- ⚠️ Enqueue (juste log)
- ⚠️ Worker (pas encore activé)

### Console Logs Attendus

```
🔍 Fetching featured listings...
🤖 Démarrage validation automatique...
🤖 [AutoValidation] Début validation pour ...
🛡️ Scan antivirus pour: ...
✅ Scan terminé: {clean: true, ...}
📄 OCR extraction pour: ...
⚠️ [OCR] Client-side temporairement désactivé
✅ [OCR] Simulation retournée
✅ Validation terminée: {score: 68, recommendation: 'admin_review', passed: true}
✅ Validation automatique terminée
⚠️ Revue admin nécessaire. Score: 68
📤 Verification xxx enqueued for worker processing
✅ Audit log créé
```

---

## 🐛 Troubleshooting

### "Failed to enqueue job (worker not running?)"
**Normal** : Le worker n'est pas encore démarré, le système continue sans blocage.

### Badge ne s'affiche pas
Vérifier : `VerificationBadge` importé dans `ProfilePage.tsx` ?

### Statut reste "Non vérifié"
Vérifier dans Firestore : `users/{userId}` → `verificationStatus` et `isVerified`

### Upload échoue
Vérifier : `storage.rules` publiées dans Firebase Console

---

## 📊 Métriques

### Performance
- Upload : ~2-5 secondes
- Validation : ~500ms (simulation)
- Total flow : ~3-6 secondes

### Score Démo
```
Score: 68/100
Breakdown:
  Documents: 5
  Antivirus: 15
  OCR: 35
  Bonuses: 8
  Penalties: 0
Recommendation: admin_review
```

---

## 🎉 Si Tout Fonctionne

**Vous avez** :
- ✅ Upload fonctionnel
- ✅ Validation auto fonctionnelle
- ✅ Badge affiché
- ✅ Workflow complet opérationnel
- ⏳ Worker prêt à activer (optionnel)

**Le système fonctionne en PRODUCTION avec simulation !** 🚀

