# 🏗️ Architecture Certification Étudiant Complète

## 📋 Résumé

Système de certification automatique avec validation OCR, vérification faciale, et revue admin.

---

## 🔄 États de Vérification (Source de Vérité)

```typescript
enum VerificationStatus {
  UNVERIFIED = 'unverified',           // État initial
  DOCUMENTS_SUBMITTED = 'documents_submitted',  // Upload terminé
  UNDER_REVIEW = 'under_review',        // Revue manuelle admin
  VERIFIED = 'verified',                // Auto-verified ou admin-approved
  REJECTED = 'rejected',                // Rejeté avec raison
  SUSPENDED = 'suspended'               // Fraude / abus
}
```

---

## 🗄️ Schéma Base de Données

### Table `student_verifications`

```sql
CREATE TABLE student_verifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  -- État
  status VARCHAR(50) NOT NULL DEFAULT 'unverified',
  
  -- Documents
  documents JSONB, -- [{ type, url, filename, size, checksum }]
  
  -- Métadonnées validation
  metadata JSONB, -- { email_domain_ok, id_expiry_ok, ocr_text, face_match }
  
  -- Compteurs
  attempts_count INT DEFAULT 0,
  
  -- Dates
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID, -- admin_id
  expires_at TIMESTAMP,
  
  -- Rejet
  reject_reason TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verifications_user ON student_verifications(user_id);
CREATE INDEX idx_verifications_status ON student_verifications(status);
CREATE INDEX idx_verifications_submitted ON student_verifications(submitted_at);
```

### Modification Table `users`

```sql
ALTER TABLE users ADD COLUMN is_verified_student BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN verified_by UUID;
```

---

## 🔐 Validation Automatique (Backend)

### Pipeline de Validation

```typescript
// Backend validation logic
interface ValidationMetadata {
  email_domain_ok: boolean;
  id_expiry_ok: boolean;
  ocr_text: {
    institution_name: string;
    student_id: string;
    expiry_date: string;
    confidence: number;
  };
  face_match: {
    confidence: number;
    verified: boolean;
  };
  fraud_signals: {
    disposable_email: boolean;
    ip_mismatch: boolean;
    multiple_attempts: boolean;
  };
}
```

### Checks Automatiques

1. **Email Domain** ✅
   ```typescript
   const allowedDomains = [
     'edu', 'univ-', '.ac.', 
     'student.', 'etudiant.', 'etu.',
     'sorbonne-universite.fr',
     // ... config
   ];
   
   const emailDomainOk = allowedDomains.some(domain => 
     user.email.includes(domain)
   );
   ```

2. **OCR Processing** (optionnel)
   ```typescript
   // Using Tesseract.js or AWS Textract
   const ocrResult = await extractTextFromImage(documentUrl);
   const hasInstitutionName = ocrResult.includes('UNIVERSITÉ') || 
                             ocrResult.includes('ÉCOLE');
   
   const studentIdMatch = ocrResult.match(/\d{6,10}/); // Numéro étudiant
   ```

3. **Face Match** (optionnel - AWS Rekognition)
   ```typescript
   const faceMatch = await compareFaces({
     source: selfieUrl,
     target: cardPhotoUrl,
     threshold: 0.90 // 90% confidence
   });
   ```

4. **ID Expiry Check**
   ```typescript
   const expiryDate = extractDateFromOCR(ocrResult);
   const isExpired = new Date(expiryDate) < new Date();
   ```

5. **Fraud Signals**
   ```typescript
   const signals = {
     disposable_email: await isDisposableEmail(user.email),
     ip_mismatch: checkIPGeolocation(user.ip, documents),
     multiple_attempts: attempts_count > 3
   };
   ```

### Logique de Décision

```typescript
function determineStatus(metadata: ValidationMetadata): VerificationStatus {
  // Auto-approve si tous les checks passent
  if (
    metadata.email_domain_ok &&
    metadata.ocr_text.confidence > 0.85 &&
    metadata.face_match.verified &&
    !metadata.fraud_signals.multiple_attempts
  ) {
    return 'verified'; // ✅ Auto-verified
  }
  
  // Revue manuelle si checks partiels
  return 'under_review';
}
```

---

## 🌐 Backend API Endpoints

### POST /api/verification/request

```typescript
// Créer une nouvelle demande
// Retourne presigned URLs pour upload
interface Response {
  verificationId: string;
  presignedUrls: {
    studentCard: string;
    enrollmentCert: string;
    selfie?: string;
  };
  expiresIn: number; // seconds
}
```

### POST /api/verification/upload-url

```typescript
// Obtenir URL signée pour upload direct S3
body: { filename, contentType, docType }
response: { uploadUrl, assetId }
```

### POST /api/verification/submit

```typescript
// Soumettre la demande avec documents
body: { 
  userId, 
  documentIds: string[] 
}
// Déclenche validation automatique
// Retourne status: 'documents_submitted' | 'verified' | 'under_review'
```

### GET /api/verification/:userId

```typescript
// Obtenir statut de vérification
response: {
  status: VerificationStatus;
  documents: Document[];
  metadata: ValidationMetadata;
  submittedAt: string;
  reviewedAt?: string;
}
```

### GET /api/admin/verifications

```typescript
// Liste paginée pour admin
query: { status?, page?, limit? }
response: Verification[]
```

### GET /api/admin/verifications/:id

```typescript
// Détails complets avec documents
response: VerificationDetails {
  ...basicInfo,
  documents: Document[],
  ocrResults: OCRResult[],
  faceMatch: FaceMatchResult,
  auditLog: AuditEntry[]
}
```

### POST /api/admin/verifications/:id/approve

```typescript
// Approbation manuelle
// Met à jour user.is_verified_student = true
// Envoie notification à l'utilisateur
```

### POST /api/admin/verifications/:id/reject

```typescript
body: { reason: string }
// Met à jour status = 'rejected'
// Enregistre reason
// Envoie email avec motif
```

### POST /api/admin/verifications/:id/suspend

```typescript
// Suspension pour fraude
// Bloque le compte si nécessaire
```

---

## 🎨 Composants UI Frontend

### 1. StudentVerificationBanner

```tsx
// Bandeau dans le profil
<StudentVerificationBanner>
  <VerificationBadge status={status} />
  <VerificationProgress progress={getProgress(status)} />
  <CTA onClick={handleAction}>
    {getCTAText(status)}
  </CTA>
</StudentVerificationBanner>
```

**États** :
- `unverified` : "Demander la certification"
- `documents_submitted` : "Documents reçus - Traitement en cours"
- `under_review` : "En revue - 24-48h"
- `verified` : "✅ Étudiant certifié"
- `rejected` : "✗ Rejeté - Soumettre à nouveau"

### 2. VerificationModal

```tsx
// Modal upload documents
<VerificationModal>
  <DocumentChecklist required={['student_card', 'selfie']} />
  <FileUploader 
    accept=".jpg,.png,.pdf"
    maxSize={10 * 1024 * 1024}
    multiple
  />
  <FilePreview files={selectedFiles} />
  <SubmitButton disabled={!allRequiredUploaded} />
</VerificationModal>
```

### 3. VerificationTimeline

```tsx
// Timeline de progression
<Timeline>
  <Step completed={status >= 'submitted'} 
        icon="upload" 
        label="Documents soumis" 
        date={submittedAt} />
  <Step completed={status >= 'review'} 
        icon="eye" 
        label="En revue" />
  <Step completed={status === 'verified'} 
        icon="check" 
        label="Certifié" />
</Timeline>
```

### 4. AdminVerificationDetail

```tsx
// Vue admin complète
<AdminVerificationDetail>
  <Sidebar>
    <FaceMatchViewer source={selfie} target={card} score={0.92} />
    <ConfidenceBadge score={92} color="green" />
  </Sidebar>
  
  <MainContent>
    <DocumentViewer documents={documents} />
    <OCRResults text={ocrText} />
    <AuditLog entries={log} />
  </MainContent>
  
  <Actions>
    <ApproveButton onClick={handleApprove} />
    <RejectButton onClick={handleReject} />
    <SuspendButton onClick={handleSuspend} />
    <RequestMoreButton onClick={handleRequestMore} />
  </Actions>
</AdminVerificationDetail>
```

---

## 🔒 Sécurité & Stockage

### Upload via Presigned URLs (S3)

```typescript
// Frontend
const presignedUrl = await fetch('/api/verification/upload-url', {
  method: 'POST',
  body: { filename, contentType: 'image/jpeg', docType: 'student_card' }
});

// Upload direct vers S3
await fetch(presignedUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': contentType }
});
```

### URLs Sécurisées

```typescript
// Backend - Generate signed download URL
function generateSecureUrl(documentId: string): string {
  return s3.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: `verifications/${documentId}`,
    Expires: 3600, // 1 hour
    ACL: 'private'
  });
}
```

### Audit Logging

```typescript
interface AuditEntry {
  id: string;
  verificationId: string;
  actor: string; // user_id | admin_id | 'system'
  action: 'submitted' | 'approved' | 'rejected' | 'suspended';
  details: any;
  timestamp: Date;
  ip?: string;
}
```

---

## 📧 Notifications

### Emails

1. **Soumission** : "Documents reçus - Traitement 24-48h"
2. **Auto-verified** : "🎉 Votre compte est certifié"
3. **Under review** : "Vos documents sont en cours de revue"
4. **Request more** : "Documents manquants requis"
5. **Rejected** : "Certification rejetée - Motif: ..."
6. **Admin alert** : "Nouvelle demande nécessite attention"

### In-App

- Toast notifications
- Badge notifications (nombre en attente admin)
- Progress notifications (changements de statut)

---

## 📊 Métriques & Monitoring

### KPIs à suivre

- **Taux d'auto-approbation** : % auto-verified
- **Temps moyen** : de submitted → verified
- **Taux de rejet** : % rejected
- **Fraud flags** : nombre de suspensions
- **Compliance** : documents conformes

### Dashboard Admin

```typescript
interface VerificationMetrics {
  submissionsToday: number;
  autoVerifiedCount: number;
  underReviewCount: number;
  avgReviewTime: number; // minutes
  rejectionRate: number; // %
  highRiskCount: number;
}
```

---

## 🚀 Plan d'Implémentation

### Phase 1 - Fondations (Prioritaire)
1. ✅ Refonte états (6 statuts)
2. ⏳ Table `student_verifications` dans Firestore
3. ⏳ Service validation automatique
4. ⏳ Upload via S3 presigned URLs

### Phase 2 - Validation Auto
5. ⏳ Email domain check
6. ⏳ OCR processing (optionnel)
7. ⏳ Face match (optionnel)
8. ⏳ Fraud detection

### Phase 3 - UI Avancée
9. ⏳ VerificationModal avec checklist
10. ⏳ Progress bar & timeline
11. ⏳ Admin panel complet
12. ⏳ Document viewer

### Phase 4 - Notifications
13. ⏳ Email templates
14. ⏳ In-app notifications
15. ⏳ WebSocket admin alerts

### Phase 5 - Monitoring
16. ⏳ Metrics dashboard
17. ⏳ Audit logging
18. ⏳ Error tracking

---

## 🎯 Différences avec l'implémentation actuelle

| Fonctionnalité | Actuel | Nouveau |
|----------------|--------|---------|
| États | 3 (pending/verified/rejected) | 6 états |
| Validation | Manuelle uniquement | Auto + admin |
| Upload | Direct Firestore | S3 presigned URLs |
| Documents | 5 max, pas de types | Types spécifiques + selfie |
| UI | Page simple | Modal + Timeline + Progress |
| Admin | Liste basique | Detail viewer + OCR + Face match |
| Notifications | Aucune | Emails + In-app |
| Sécurité | Basic | Encryption + Audit + Signed URLs |

---

## ✅ Prochaines Actions

**Souhaitez-vous que je :**

1. **Commence la refonte complète** avec tous ces éléments ?
2. **Mette à jour l'implémentation actuelle** pour ajouter les états et validation auto ?
3. **Crée un plan détaillé** par fonctionnalité pour étapes ultérieures ?

**Recommandation** : Commencer par **Phase 1** (états + DB + upload S3), puis **Phase 2** (validation auto).

---

**🚀 Prêt pour la refonte complète !**
