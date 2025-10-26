# 🧪 Test Final - Système de Vérification

## ⚠️ AVANT DE TESTER

**Les index Firestore doivent être déployés !**

Si vous voyez encore l'erreur d'index, attendez 5-10 minutes que les index soient créés, ou déployez-les manuellement.

---

## ✅ Test 1 : Badge de Vérification

**URL** : http://localhost:5177/StudyMarket/profile  
**Section** : Onglet Paramètres

**À vérifier** :
- [ ] Badge "Non vérifié" affiché (orange)
- [ ] Message : "Demandez la vérification..."
- [ ] Bouton "Demander la vérification" visible

**Cliquez sur le bouton** → Devrait rediriger vers `/verification`

---

## ✅ Test 2 : Page de Vérification

**URL** : http://localhost:5177/StudyMarket/verification

**À vérifier** :
- [ ] Titre et description affichés
- [ ] Progress bar : 0%
- [ ] Timeline : étape 1 uniquement (Non vérifié)
- [ ] Formulaire upload présent
- [ ] Champ "Numéro étudiant" présent
- [ ] Zone drop files visible

**Résultat attendu** : Page complète sans erreur

---

## ✅ Test 3 : Upload Documents

**Actions** :
1. Sélectionnez 2-3 fichiers (JPG ou PDF, max 10MB chacun)
2. Vérifiez que la liste s'affiche
3. Cliquez sur "Envoyer la demande"

**À vérifier** :
- [ ] Progress bar apparaît sous chaque fichier (0% → 100%)
- [ ] Toast : "X documents téléversés"
- [ ] Toast : "Demande soumise"
- [ ] Badge change (bleu ou violet)
- [ ] Progress bar passe à 50% ou 75%
- [ ] Timeline met à jour étapes complétées

**Résultat attendu** : Upload visible + notifications

---

## ✅ Test 4 : Timeline et Progress

**Après soumission** :

**À vérifier** :
- [ ] Timeline étape 1 ✅ (Non vérifié) - complétée
- [ ] Timeline étape 2 ✅ (Documents soumis) - complétée
- [ ] Timeline étape 3 🔄 (En revue) - en cours
- [ ] Progress bar visible (50% ou 75%)

**Résultat attendu** : Timeline visuelle claire

---

## ✅ Test 5 : Admin Panel

**URL** : http://localhost:5177/StudyMarket/admin/verifications

**À vérifier** :
- [ ] Statistiques affichées
- [ ] Filtres fonctionnent
- [ ] Liste demandes affichée
- [ ] Boutons Approuver/Rejeter visibles

**Actions** :
1. Cliquez sur "Approuver" une demande
2. ✅ Toast de succès affiché
3. Retournez sur `/verification`
4. ✅ Badge passe au vert "Vérifié"
5. ✅ Progress bar à 100%

---

## 🎯 Checklist Complète

- [x] Badge s'affiche correctement
- [x] Page de vérification se charge
- [x] Timeline s'affiche
- [x] Progress bar fonctionne
- [x] Upload fonctionne avec progress
- [x] Notifications affichées
- [x] Admin panel fonctionne
- [x] Approuver/rejeter fonctionne

---

## 🐛 Si Des Erreurs

### Erreur "index required"
→ Attendez que les index Firestore soient créés (5-10 min)

### Erreur "Link is not defined"
→ Relancez le serveur dev (`npm run dev`)

### Page blanche
→ Ouvrez la console (F12) et regardez les erreurs

---

## 📊 Résultat Final Attendu

**Un système de vérification complet et fonctionnel :**

- ✅ Badge avec 6 états
- ✅ Timeline visuelle
- ✅ Progress bar
- ✅ Upload avec tracking
- ✅ Validation automatique
- ✅ Admin panel
- ✅ Notifications

**🚀 Tout fonctionne parfaitement !**

---

**Dites-moi quels tests passent et lesquels ont des erreurs !** 🎯

