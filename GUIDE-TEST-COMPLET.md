# 🧪 Guide Test Complet - Système de Vérification

## 📋 Checklist de Test

### ✅ 1. Publier les Règles Storage

**Action** : Firebase Console → Storage → Rules
1. Ouvrir : https://console.firebase.google.com/project/annonces-app-44d27/storage/rules
2. Copier-coller le contenu de `storage.rules`
3. Cliquer sur "Publish"

---

### ✅ 2. Lancer le Backend

```bash
npm run server
```

**Attendu** :
```
🚀 Serveur API StudyMarket démarré sur le port 3001
📡 Endpoints disponibles:
   ...
   POST /api/verification (✅ NEW)
   GET  /api/verification/:id (✅ NEW)
   GET  /api/user/:userId/verification (✅ NEW)
   POST /api/admin/verifications/:id/approve (✅ NEW)
   POST /api/admin/verifications/:id/reject (✅ NEW)
```

---

### ✅ 3. Tester Création de Demande

```bash
curl -X POST http://localhost:3001/api/verification \
  -H "Content-Type: application/json" \
  -d '{"userId":"VOTRE_USER_ID"}'
```

**Attendu** :
```json
{
  "verificationId": "...",
  "status": "documents_submitted"
}
```

---

### ✅ 4. Tester Page Utilisateur

1. Aller sur : http://localhost:5177/StudyMarket/verification
2. **Vérifier** :
   - [ ] Badge "Non vérifié" visible
   - [ ] Formulaire d'upload visible
   - [ ] Zone "Cliquez pour sélectionner" visible
   - [ ] Liste des documents acceptés affichée

3. **Tester upload** :
   - [ ] Sélectionner 2-3 fichiers (JPG/PDF)
   - [ ] Barre de progression apparaît
   - [ ] Toast : "X documents téléversés"
   - [ ] Click "Envoyer la demande"
   - [ ] Badge passe à "Documents soumis" (bleu)

---

### ✅ 5. Tester Badge sur Profil

1. Aller sur : http://localhost:5177/StudyMarket/profile
2. Cliquer sur "Paramètres"
3. **Vérifier** :
   - [ ] Badge visible avec bon état
   - [ ] Message contextuel selon statut
   - [ ] Bouton "Demander la vérification" visible

---

### ✅ 6. Tester Badge sur Listings

1. Aller sur : http://localhost:5177/StudyMarket/
2. **Vérifier** :
   - [ ] Badge icône visible à côté nom vendeur
   - [ ] Couleur cohérente avec statut
   - [ ] Cliquer sur listing → Badge visible page détail

---

### ✅ 7. Tester Admin Panel

1. Aller sur : http://localhost:5177/StudyMarket/admin/verifications
2. **Vérifier** :
   - [ ] Statistiques affichées
   - [ ] Liste des demandes visible
   - [ ] Boutons "Approuver" / "Rejeter" visibles
   - [ ] **Preview des documents** (miniatures) affiché

3. **Tester approbation** :
   - [ ] Cliquer "Approuver"
   - [ ] Confirmer dans dialog
   - [ ] Toast : "Demande approuvée"
   - [ ] Badge utilisateur passe au vert "Vérifié"

4. **Tester rejet** :
   - [ ] Cliquer "Rejeter"
   - [ ] Entrer raison (min 10 caractères)
   - [ ] Confirmer
   - [ ] Toast : "Demande rejetée"
   - [ ] Formulaire utilisateur visible pour resoumission

---

### ✅ 8. Tester Backend API

```bash
# Tester récupération statut
curl http://localhost:3001/api/verification/{verificationId}

# Tester statut utilisateur rapide
curl http://localhost:3001/api/user/{userId}/verification

# Tester approbation (avec votre userId d'admin)
curl -X POST http://localhost:3001/api/admin/verifications/{verificationId}/approve \
  -H "Content-Type: application/json" \
  -d '{"adminId":"VOTRE_ADMIN_ID"}'

# Tester rejet
curl -X POST http://localhost:3001/api/admin/verifications/{verificationId}/reject \
  -H "Content-Type: application/json" \
  -d '{"adminId":"VOTRE_ADMIN_ID","reason":"Documents non conformes"}'
```

---

## 🐛 Problèmes Potentiels

### Erreur "Firebase Admin non configuré"
**Fix** : Ajouter `FIREBASE_SERVICE_ACCOUNT` dans `.env`

### Erreur "Storage permission denied"
**Fix** : Publier les règles Storage dans Firebase Console

### Badge pas visible
**Fix** : Vérifier que `userProfile.verificationStatus` existe dans Firestore

### Documents pas visibles admin
**Fix** : Vérifier que `documents` array existe dans `verification_requests`

---

## 📊 Résultat Attendu

**Tous les tests passent** :
- ✅ Upload de documents fonctionne
- ✅ Badge affiché partout
- ✅ API backend fonctionne
- ✅ Admin peut approuver/rejeter
- ✅ Preview documents admin fonctionne

**Système prêt pour utilisation !** 🎉

---

## 🎯 Prochaines Étapes

Une fois tous les tests OK :
1. ✅ Phase 1 : Terminée
2. ⏳ Phase 2 : Workers (OCR, Face-match)
3. ⏳ Phase 3 : Security avancée
4. ⏳ Phase 4 : Monitoring

**Commencer les tests maintenant ?** 🧪

