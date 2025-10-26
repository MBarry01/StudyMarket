# 🧪 Test Workflow Complet - Guide Étape par Étape

## 🎯 OBJECTIF

Tester le système de vérification de A à Z pour confirmer que tout fonctionne.

**Temps estimé** : 5-10 minutes

---

## ✅ ÉTAPE 1 : Vérifier l'Upload

**Action** :
1. Aller sur `http://localhost:5173/verification`
2. Upload un document PDF ou image
3. Cliquer "Soumettre"

**Résultat attendu** :
```
✅ Document uploadé vers Firebase Storage
✅ Validation automatique exécutée
✅ Score calculé (0-100)
✅ Recommandation déterminée (auto_approve / admin_review / reject)
✅ Badge affiché : "Documents soumis" ou "Vérifié"
✅ Progress bar affichée
✅ Timeline affichée
✅ Notification toast
```

**Console logs** :
```
✅ Scan antivirus terminé: {clean: true}
✅ Validation automatique terminée: {score: XX, recommendation: '...'}
✅ Verification ... enqueued successfully
✅ Audit log créé: ...
```

---

## ✅ ÉTAPE 2 : Vérifier Badge Utilisateur

**Action** :
1. Aller sur `/profile`
2. Aller sur `/settings`
3. Aller sur `/verification`

**Résultat attendu** :
- Badge visible avec le bon statut
- Badge "Documents soumis" si score < 70
- Badge "Vérifié" si score ≥ 70
- Progress bar affichée
- Timeline affichée

---

## ✅ ÉTAPE 3 : Admin Panel - Voir Demande

**Action** :
1. Aller sur `/admin/verifications`
2. Voir la liste des demandes

**Résultat attendu** :
- Votre demande listée
- Badge "En cours" ou "Documents soumis"
- Email de l'utilisateur affiché
- Date de demande affichée
- Boutons "Voir docs", "Approuver", "Rejeter"

---

## ✅ ÉTAPE 4 : Admin Panel - Voir Documents

**Action** :
1. Cliquer "Voir docs"
2. Voir le document dans un modal

**Résultat attendu** :
- Modal s'ouvre
- PDF affiché dans iframe (Google Docs Viewer)
- Bouton "Download" fonctionne
- Bouton "Fermer" fonctionne

---

## ✅ ÉTAPE 5 : Admin Panel - Approuver Demande

**Action** :
1. Cliquer "Approuver"
2. Confirmer l'action
3. Attendre 1-2 secondes
4. Revenir sur `/verification` (page utilisateur)

**Résultat attendu** :
- Status de la demande mis à jour dans Firestore
- User status mis à jour (`isVerified: true`)
- Audit log créé
- Badge utilisateur change INSTANTANÉMENT → "Vérifié" (vert)
- Progress bar → 100%
- Timeline → "Vérifié" ✅
- Notification toast

---

## ✅ ÉTAPE 6 : Vérifier Badge Partout

**Action** :
1. Aller sur `/profile`
2. Aller sur `/settings`
3. Aller sur `/listings`
4. Voir badge "Vérifié" partout

**Résultat attendu** :
- Badge "Vérifié" (vert) visible partout
- Badge sur profil
- Badge sur settings
- Badge sur vos annonces

---

## ✅ ÉTAPE 7 : Tester Rejet (Optionnel)

**Action** :
1. Uploader un autre document
2. Aller sur `/admin/verifications`
3. Cliquer "Rejeter"
4. Entrer raison (min 10 caractères)
5. Confirmer

**Résultat attendu** :
- Status de la demande → "Rejected"
- Badge utilisateur → "Rejeté" (rouge)
- Message de rejet affiché avec raison
- Possibilité de renouveler la demande

---

## 🎊 RÉSULTAT FINAL

**Si tout fonctionne** :
- ✅ Upload OK
- ✅ Validation OK
- ✅ Badge OK
- ✅ Admin panel OK
- ✅ Approve/Reject OK
- ✅ Real-time updates OK

**Le système est prêt pour production !** 🚀

---

## 📝 NOTES

**Si erreurs** :
- Vérifier console logs (F12)
- Vérifier backend logs (terminal)
- Vérifier Firebase Console (Storage + Firestore)
- Envoyer logs pour debug

**Si tout OK** :
- Le système est fonctionnel
- Prêt pour production
- Peut être utilisé avec de vrais utilisateurs

---

**Bon test !** 🧪

