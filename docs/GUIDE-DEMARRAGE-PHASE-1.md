# 🚀 Guide Démarrage Phase 1

## Situation Actuelle

Vous avez **déjà un `server.js`** qui gère Stripe webhooks et API d'admin.

**Prochaine étape** : Ajouter les endpoints de vérification à ce serveur existant.

---

## ✅ Étape 1 : Ajouter les Routes de Vérification

Ouvrez `server.js` et ajoutez après les routes existantes :

```javascript
// ==================== ROUTES DE VÉRIFICATION ====================

import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

// POST /api/verification - Créer une demande
app.post('/api/verification', express.json(), async (req, res) => {
  try {
    const { userId, idempotencyKey } = req.body;
    
    // Validation
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    
    // Vérifier idempotency
    if (idempotencyKey) {
      const existing = await db.collection('verification_requests')
        .where('userId', '==', userId)
        .where('idempotencyKey', '==', idempotencyKey)
        .limit(1)
        .get();
      
      if (!existing.empty) {
        const existingDoc = existing.docs[0].data();
        return res.status(200).json({
          verificationId: existing.docs[0].id,
          status: existingDoc.status,
          message: 'Request already processed'
        });
      }
    }
    
    // Créer la demande
    const docRef = await db.collection('verification_requests').add({
      userId,
      status: 'documents_submitted',
      idempotencyKey: idempotencyKey || randomUUID(),
      submittedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        submissionSource: 'web'
      },
      attemptsCount: 1
    });
    
    res.status(201).json({
      verificationId: docRef.id,
      status: 'documents_submitted'
    });
  } catch (error) {
    console.error('Erreur création vérification:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/verification/:id - Récupérer statut
app.get('/api/verification/:id', async (req, res) => {
  try {
    const doc = await db.collection('verification_requests').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Verification not found' });
    }
    
    const data = doc.data();
    res.json({
      id: doc.id,
      ...data,
      submittedAt: data.submittedAt?.toDate(),
      reviewedAt: data.reviewedAt?.toDate()
    });
  } catch (error) {
    console.error('Erreur récupération vérification:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/:userId/verification - Statut rapide
app.get('/api/user/:userId/verification', async (req, res) => {
  try {
    const snapshot = await db.collection('verification_requests')
      .where('userId', '==', req.params.userId)
      .orderBy('submittedAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.json({ status: 'unverified' });
    }
    
    const latest = snapshot.docs[0].data();
    res.json({
      status: latest.status,
      verificationId: snapshot.docs[0].id
    });
  } catch (error) {
    console.error('Erreur récupération statut utilisateur:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/verifications/:id/approve - Approver (admin only)
app.post('/api/admin/verifications/:id/approve', express.json(), async (req, res) => {
  try {
    // TODO: Ajouter middleware requireAdmin
    const { adminId } = req.body;
    
    const verificationRef = db.collection('verification_requests').doc(req.params.id);
    const verificationDoc = await verificationRef.get();
    
    if (!verificationDoc.exists) {
      return res.status(404).json({ error: 'Verification not found' });
    }
    
    // Mettre à jour status
    await verificationRef.update({
      status: 'verified',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId
    });
    
    // Mettre à jour utilisateur
    await db.collection('users').doc(verificationDoc.data().userId).update({
      isVerified: true,
      verificationStatus: 'verified',
      verifiedAt: serverTimestamp()
    });
    
    // TODO: Créer audit log
    
    res.json({ success: true, message: 'Verification approved' });
  } catch (error) {
    console.error('Erreur approbation:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/verifications/:id/reject - Rejeter (admin only)
app.post('/api/admin/verifications/:id/reject', express.json(), async (req, res) => {
  try {
    const { adminId, reason } = req.body;
    
    if (!reason || reason.length < 10) {
      return res.status(400).json({ error: 'Reason required (min 10 characters)' });
    }
    
    await db.collection('verification_requests').doc(req.params.id).update({
      status: 'rejected',
      rejectionReason: reason,
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId
    });
    
    // TODO: Créer audit log
    
    res.json({ success: true, message: 'Verification rejected' });
  } catch (error) {
    console.error('Erreur rejet:', error);
    res.status(500).json({ error: error.message });
  }
});

console.log(`📡 Routes de vérification ajoutées`);
```

---

## ✅ Étape 2 : Tester les Endpoints

```bash
# Lancer le serveur
npm run server

# Tester création
curl -X POST http://localhost:3001/api/verification \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","idempotencyKey":"abc123"}'

# Tester récupération
curl http://localhost:3001/api/verification/{verificationId}

# Tester statut utilisateur
curl http://localhost:3001/api/user/test123/verification
```

---

## ✅ Étape 3 : Mettre à Jour le Frontend

Dans `src/services/verificationService.ts`, modifier pour utiliser l'API backend :

```typescript
const API_BASE = 'http://localhost:3001';

static async requestVerification(userId, userData, documents) {
  // 1. Appeler POST /api/verification
  const response = await fetch(`${API_BASE}/api/verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      userId, 
      idempotencyKey: randomUUID() 
    })
  });
  
  const { verificationId } = await response.json();
  
  // 2. Upload documents (Firebase Storage - garder pour l'instant)
  // 3. Appeler submit endpoint
  
  return verificationId;
}
```

---

## 🎯 Prochaines Étapes

1. ✅ Ajouter les routes dans `server.js`
2. ✅ Tester avec curl
3. ✅ Mettre à jour frontend pour utiliser API
4. ⏳ Ajouter Presigned URLs (Phase 1.3)
5. ⏳ Ajouter Workers (Phase 2)

---

**Commencer par ajouter ces routes dans votre `server.js` !**

