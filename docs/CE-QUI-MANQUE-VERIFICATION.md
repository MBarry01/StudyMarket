# ❌ Ce Qui Manque - Système de Vérification

## 📊 Comparaison : Implémenté vs Objectifs

### ✅ CE QUI EST FAIT

#### Frontend
- ✅ Composants UI : Badge, Progress, Timeline
- ✅ Pages : VerificationRequestPage, ProfilePage, SettingsPage
- ✅ Badge affiché partout (profil, listings, vignettes)
- ✅ Upload avec progress bar
- ✅ Validation client (file type, size)

#### Backend
- ✅ VerificationService (créer, récupérer, approuver, rejeter)
- ✅ UploadService (Firebase Storage)
- ✅ NotificationService (toasts)
- ✅ Types et interfaces (6 états)
- ✅ Index Firestore

---

## ❌ CE QUI MANQUE

### 1. Source de Vérité Serveur

**Objectif** : Un serveur backend centralisé comme source de vérité

**Actuellement** :
- Pas de serveur backend dédié
- Logique côté client uniquement
- Pas de source de vérité unique

**Ce qu'il faut** :
- Backend Node.js/Express
- Endpoints API REST
- Base de données Firestore comme source de vérité
- Jobs/cron pour vérifications automatiques

---

### 2. Endpoints API Backend

**Manque** :
- ❌ `POST /api/verification` → Créer demande
- ❌ `POST /api/verification/upload-callback` → Confirmer upload
- ❌ `POST /api/verification/submit` → Soumettre et lancer auto-checks
- ❌ `GET /api/verification/:id` → Statut complet
- ❌ `GET /api/user/:id/verification` → Statut rapide
- ❌ `POST /api/admin/verifications/:id/approve` → Approuver
- ❌ `POST /api/admin/verifications/:id/reject` → Rejeter
- ❌ `POST /api/admin/verifications/:id/request-more` → Demander plus
- ❌ `POST /api/admin/verifications/:id/suspend` → Suspendre

**Actuellement** : Tout est côté client (Firebase SDK direct)

---

### 3. Workers & Jobs Automatisés

**Manque** :
- ❌ Job queue (Bull/Redis)
- ❌ Worker OCR
- ❌ Worker face-match
- ❌ Worker antivirus scan
- ❌ Worker expire/cleanup
- ❌ Retry logic avec exponential backoff

**Actuellement** : Pas de workers, pas de jobs

---

### 4. Presigned URLs (S3/Supabase)

**Objectif** : Upload direct vers S3/Supabase avec presigned URLs

**Actuellement** :
- ✅ Upload Firebase Storage
- ❌ Pas de presigned URLs
- ❌ Pas de checksums
- ❌ Pas de validation serveur

**Ce qu'il faut** :
- Backend génère presigned URLs
- Upload direct depuis client
- Checksums SHA256
- Validation après upload

---

### 5. Auto-Validation Robuste

**Objectif** : Auto-validation avancée

**Actuellement** :
- ✅ Email domain check (basique)
- ✅ Documents requis
- ✅ Tentatives multiples
- ❌ Pas d'OCR
- ❌ Pas de face-match
- ❌ Pas d'antivirus scan

**Ce qu'il faut** :
- OCR pour extraire texte des documents
- Face-match (selfie vs ID)
- Antivirus scan (VirusTotal API)
- Heuristiques de risque

---

### 6. Idempotency & Retries

**Manque** :
- ❌ Idempotency keys
- ❌ Retries idempotents
- ❌ Dead-letter queue
- ❌ Reconciliation job

**Actuellement** : Pas de gestion d'idempotency

---

### 7. Audit Trail Complet

**Objectif** : Logs immutables de toutes les actions

**Actuellement** :
- ❌ Pas de table `verification_audit`
- ❌ Pas de logs immutables
- ❌ Pas de suivi des actions admin

**Ce qu'il faut** :
```typescript
interface VerificationAudit {
  id: string;
  verificationId: string;
  actorId: string | 'system';
  action: 'created' | 'submitted' | 'auto_approved' | 'approved' | 'rejected' | 'suspended';
  payload: any;
  timestamp: Date;
}
```

---

### 8. Latency UX (< 2s)

**Objectif** : Feedback visible en < 2s

**Actuellement** :
- ❌ Pas de polling optimisé
- ❌ Pas de SSE/WebSocket
- ✅ Progress bar (bon début)

**Ce qu'il faut** :
- Polling `/api/verification/:id/status` toutes les 3s
- Ou SSE/WebSocket pour updates en temps réel
- Feedback immédiat après submit

---

### 9. Security & Compliance

**Manque** :
- ❌ Admin routes protégées avec custom claims
- ❌ Presigned URLs avec TTL limité
- ❌ Rate limiting par utilisateur
- ❌ Checksums validation
- ❌ Files chiffrés at rest
- ❌ GDPR delete path

**Actuellement** :
- ✅ Règles Storage (basiques)
- ❌ Pas de custom claims
- ❌ Pas de rate limiting
- ❌ Pas de chiffrement

---

### 10. Observability & Monitoring

**Objectif** : Métriques et alertes

**Manque** :
- ❌ Metrics (Prometheus)
- ❌ Logs centralisés (Sentry/Logstash)
- ❌ Dashboards (Grafana)
- ❌ Alertes Slack/Email

**Métriques nécessaires** :
- `verifications.submitted_per_minute`
- `verifications.auto_approved_rate`
- `verifications.manual_queue_size`
- `avg_manual_review_time`
- `face_match_fail_rate`
- `upload_error_rate`

---

### 11. Admin Panel Complet

**Manque** :
- ❌ Page admin verifications avec viewer de documents
- ❌ Images avec zoom/rotate
- ❌ OCR text display
- ❌ Face-match viewer
- ❌ Queue triée par risk score
- ❌ Buttons Approve/Reject/Request More/Suspend

**Actuellement** : Pas de page admin pour verifications

---

### 12. Tests

**Manque** :
- ❌ Unit tests (validation logic, thresholds)
- ❌ Integration tests (upload→submit→worker flow)
- ❌ E2E tests
- ❌ Security tests (storage rules)
- ❌ Load tests (1000 uploads/day)

---

### 13. Operational Runbook

**Manque** :
- ❌ Documentation incident response
- ❌ Reconciliation job
- ❌ Monitoring dashboards
- ❌ Procedures disaster recovery

---

## 🎯 Priorités d'Implémentation

### P0 (Critique - À Faire Maintenant)

1. **Backend API Endpoints** (Node.js/Express)
2. **Presigned URLs** pour upload sécurisé
3. **Admin Panel** complet avec viewer
4. **Idempotency** pour retries
5. **Security** : custom claims, rate limiting

### P1 (Important - Bientôt)

6. **Workers** : OCR, face-match, antivirus
7. **Polling/SSE** pour updates temps réel
8. **Audit Trail** complet
9. **Metrics & Monitoring**
10. **Tests** complets

### P2 (Nice to Have)

11. **Dead-letter queue**
12. **Reconciliation job**
13. **GDPR delete**
14. **Load testing**
15. **Operational runbook**

---

## 📊 Gap Analysis

| Fonctionnalité | Objectif | Actuel | Gap |
|----------------|----------|--------|-----|
| Backend API | ✅ Serveur dédié | ❌ Client seulement | 100% |
| Workers | ✅ OCR, face-match, scan | ❌ Aucun | 100% |
| Presigned URLs | ✅ Upload sécurisé | ❌ Firebase direct | 80% |
| Auto-validation | ✅ Robuste | ✅ Basique | 50% |
| Idempotency | ✅ Retries sécures | ❌ Aucun | 100% |
| Audit Trail | ✅ Complet | ❌ Aucun | 100% |
| Latency UX | ✅ < 2s | ⚠️ Polling basique | 60% |
| Security | ✅ Enterprise-grade | ⚠️ Basique | 70% |
| Monitoring | ✅ Métriques | ❌ Aucun | 100% |
| Admin Panel | ✅ Complet | ⚠️ Partiel | 70% |
| Tests | ✅ Exhaustifs | ❌ Aucun | 100% |

---

## 🚀 Plan d'Action

### Sprint 1 (Backend Foundation)
1. Créer backend Node.js/Express
2. Endpoints API de base
3. Presigned URLs
4. Admin routes protégées

### Sprint 2 (Workers & Auto-Validation)
5. Job queue (Bull/Redis)
6. Workers : OCR, face-match, scan
7. Auto-validation robuste
8. Notifications email

### Sprint 3 (UX & Security)
9. Polling optimisé / SSE
10. Rate limiting
11. Chiffrement at rest
12. GDPR delete

### Sprint 4 (Monitoring & Tests)
13. Metrics (Prometheus)
14. Tests complets
15. Operational runbook
16. Load testing

---

**Conclusion** : Phase 1 et 2 OK pour MVP. Phase 3 (production-ready) nécessite backend, workers, et infrastructure complète.

