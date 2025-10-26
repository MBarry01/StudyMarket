# 🧪 Guide de Test - Système de Vérification

## 📋 Checklist de Test

### Test 1 : Affichage Badge de Vérification

**Où tester** :
1. Allez sur http://localhost:5177/StudyMarket/profile
2. Cliquez sur l'onglet **"Paramètres"**
3. Regardez la section **"Vérification du compte"**

**À vérifier** :
- [ ] Badge affiché (orange si non vérifié, vert si vérifié)
- [ ] Message contextuel affiché
- [ ] Bouton "Demander la vérification" visible
- [ ] Section bien formatée

**Résultat attendu** : Badge avec icône et texte, couleurs cohérentes

---

### Test 2 : Page de Demande de Vérification

**Où tester** :
1. Allez sur http://localhost:5177/StudyMarket/verification
2. Ou depuis le profil : Paramètres > Bouton "Demander la vérification"

**À vérifier** :
- [ ] Titre et description affichés
- [ ] Badge de statut affiché (non vérifié)
- [ ] Progress bar visible (0%)
- [ ] Timeline visible avec 4 étapes
- [ ] Formulaire upload de fichiers présent
- [ ] Champ "Numéro étudiant" présent

**Résultat attendu** : Page complète avec progress, timeline et formulaire

---

### Test 3 : Upload de Documents

**Où tester** :
1. Sur la page `/verification`
2. Section "Documents à téléverser"

**À vérifier** :
- [ ] Validation type fichier : JPG, PNG, PDF acceptés
- [ ] Rejet fichiers invalides (ex: .doc, .xlsx)
- [ ] Validation taille max : 10MB max
- [ ] Message erreur si fichier trop gros
- [ ] Maximum 5 fichiers
- [ ] Liste fichiers sélectionnés affichée
- [ ] Bouton "Supprimer" fonctionne sur chaque fichier

**Actions** :
1. Sélectionnez un JPG → ✅ Devrait être accepté
2. Sélectionnez un PDF → ✅ Devrait être accepté
3. Sélectionnez un .doc → ❌ Devrait être rejeté avec message
4. Sélectionnez 6 fichiers → ❌ Message "Maximum 5 fichiers"

---

### Test 4 : Upload avec Progress

**Où tester** :
1. Sélectionnez 2-3 fichiers valides
2. Cliquez sur "Envoyer la demande"

**À vérifier** :
- [ ] Progress bar apparaît sous chaque fichier
- [ ] Progress bar va de 0% à 100% pendant upload
- [ ] Message "Documents téléversés" affiché
- [ ] Message "Demande soumise" affiché
- [ ] Badge passe en "Documents soumis"
- [ ] Progress bar dans statut passe à 50%
- [ ] Timeline met à jour étape 2 "Documents soumis"

**Résultat attendu** : Upload visible avec progress, notifications claires

---

### Test 5 : Timeline et Progress Bar

**Où tester** :
Après avoir soumis des documents

**À vérifier** :
- [ ] Timeline montre étape 1 ✅ (Non vérifié) complétée
- [ ] Timeline montre étape 2 ✅ (Documents soumis) complétée
- [ ] Timeline montre étape 3 🔄 (En revue) en cours
- [ ] Progress bar : 50%
- [ ] Ligne verticale entre étapes

**Résultat attendu** : Timeline visuelle claire de la progression

---

### Test 6 : Validation Automatique

**À vérifier** :
- [ ] Email universitaire (.edu, univ-, etc.) → Auto-verified si docs OK
- [ ] Email normal (gmail.com) → Under review
- [ ] Documents requis présents → OK
- [ ] Documents manquants → Under review

**Scénarios** :

**Scénario A - Auto-verified** :
1. Email universitaire (ex: sorbonne-universite.fr)
2. Upload carte étudiante OU certificat d'inscription
3. ✅ Devrait être auto-verified (status = 'verified')
4. Badge passe au vert
5. Progress bar à 100%

**Scénario B - Under review** :
1. Email gmail.com
2. Upload documents
3. ⚠️ Devrait passer en under_review
4. Badge passe au violet "En revue"
5. Progress bar à 75%

---

### Test 7 : Section Sécurité (Settings)

**Où tester** :
1. Allez sur http://localhost:5177/StudyMarket/settings
2. Onglet **"Sécurité"**

**À vérifier** :
- [ ] Section "Vérification du compte" présente
- [ ] Badge affiché correctement
- [ ] Bouton d'action visible
- [ ] Message contextuel affiché

**Résultat attendu** : Section bien formatée avec badge

---

### Test 8 : Dashboard Admin

**Où tester** :
1. Connectez-vous comme admin
2. http://localhost:5177/StudyMarket/admin
3. Sidebar > **"Vérifications"**

**À vérifier** :
- [ ] Statistiques affichées (Total, En attente, Approuvées, Rejetées)
- [ ] Filtres fonctionnent
- [ ] Liste demandes affichée
- [ ] Boutons "Approuver" / "Rejeter" fonctionnent
- [ ] Documents cliquables pour voir

**Actions** :
1. Approuvez une demande
2. ✅ L'utilisateur devrait recevoir notification "Compte vérifié"
3. ✅ Badge passe au vert

---

### Test 9 : Notifications In-App

**À vérifier** :
- [ ] Toast après upload documents
- [ ] Toast après soumission demande
- [ ] Toast après changement statut (verified, rejected)
- [ ] Messages contextuels (success, error, info)

**Test** :
1. Upload documents → Toast "X documents téléversés"
2. Submit demande → Toast "Documents soumis - Traitement en cours"
3. Si auto-verified → Toast "Félicitations ! Compte vérifié"
4. Si rejected → Toast "Demande rejetée : raison"

---

### Test 10 : États de Vérification

**À vérifier que chaque état affiche** :

1. **UNVERIFIED** :
   - Badge gris "Non vérifié"
   - Progress 0%
   - Timeline étape 1

2. **DOCUMENTS_SUBMITTED** :
   - Badge bleu "Documents soumis"
   - Progress 50%
   - Timeline étape 2

3. **UNDER_REVIEW** :
   - Badge violet "En revue"
   - Progress 75%
   - Timeline étape 3

4. **VERIFIED** :
   - Badge vert "Vérifié"
   - Progress 100%
   - Timeline étape 4

5. **REJECTED** :
   - Badge rouge "Rejeté"
   - Alert avec motif
   - Bouton "Soumettre à nouveau"

6. **SUSPENDED** :
   - Badge orange "Suspendu"
   - Alert explicatif
   - Message contact support

---

## 🐛 Erreurs Potentielles

### Problème : Badge ne s'affiche pas
**Solution** : Vérifier que `VerificationBadge` est importé

### Problème : Progress bar ne s'affiche pas
**Solution** : Vérifier que `VerificationProgress` est importé

### Problème : Timeline ne s'affiche pas
**Solution** : Vérifier que `VerificationTimeline` est importé

### Problème : Upload échoue
**Solution** : Vérifier Firebase Storage configuré

### Problème : Validation auto ne fonctionne pas
**Solution** : Vérifier logique dans `performAutoValidation`

---

## ✅ Résultat Final Attendu

**Pour un utilisateur non vérifié** :
1. Badge orange "Non vérifié"
2. Progress bar 0%
3. Timeline étape 1 uniquement
4. Formulaire de demande disponible

**Après soumission documents** :
1. Badge change (bleu "Documents soumis" ou violet "En revue")
2. Progress bar progresse (50% ou 75%)
3. Timeline met à jour étapes complétées
4. Notifications affichées

**Après approbation** :
1. Badge vert "Vérifié"
2. Progress bar 100%
3. Timeline toutes étapes complétées
4. Toast "Compte vérifié"

---

## 📊 Fichiers à Tester

- `src/pages/VerificationRequestPage.tsx` - Page demande
- `src/pages/SettingsPage.tsx` - Section sécurité
- `src/pages/ProfilePage.tsx` - Section paramètres
- `src/pages/AdminVerificationsPage.tsx` - Page admin
- `src/components/ui/VerificationBadge.tsx` - Badge
- `src/components/ui/VerificationProgress.tsx` - Progress
- `src/components/ui/VerificationTimeline.tsx` - Timeline

---

## 🎯 Prochaines Étapes Après Tests

Si tous les tests passent :
1. ✅ Phase 2 validée
2. → Passer à Phase 3 (OCR, Face match, Email notifs)

Si problèmes détectés :
1. Lister erreurs trouvées
2. Corriger problèmes
3. Re-tester
4. Commit corrections

---

**Bon test ! 🚀**

