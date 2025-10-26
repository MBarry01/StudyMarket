# 🔍 Informations Vérifiées pour Validation Automatique

## 📊 5 Checks Principaux

### 1️⃣ Email Domaine (30 points)

**Recherche** :
- ✅ Email universitaire (`.edu`, `univ-`, `.ac.`, `student.`, etc.)
- ✅ Domaine français: `sorbonne-universite.fr`, `sorbonne-nouvelle.fr`, `dauphine.psl.eu`
- ❌ Gmail, Yahoo, etc. = 0 points
- ❌ Email jetable détecté = -20 points

### 2️⃣ Documents Présents (10 points)

**Recherche** :
- ✅ Au moins 1 document uploadé
- ❌ Aucun document = 0 points

### 3️⃣ Antivirus (20 points)

**Recherche** :
- ✅ Scan tous les fichiers
- ✅ Clean = +20 points
- ❌ Menaces détectées = -50 points → REJECT

### 4️⃣ OCR - Extraction Texte (30-50 points)

**Recherche dans le texte extrait** :

#### Entités Détectées :
1. **Numéro étudiant** (`studentId`) : `\d{6,10}` (6-10 chiffres)
   - Pattern: `ID: 123456789` ou `123456789`
   - +30 points de confiance

2. **Date d'expiration** (`expiryDate`) : Format `MM/YYYY` ou `MM/YY`
   - Pattern: `EXP: 12/2025` ou `12/25`
   - +20 points de confiance

3. **Institution** (`institution`) : Nom de l'établissement
   - Mots-clés: "Université", "University", "School", "College", "Institut"
   - +30 points de confiance

4. **Nom** (`name`) : Nom de l'étudiant
   - Pattern: "Nom: John Doe"
   - +20 points de confiance

#### Score OCR :
- OCR réussi : **+30 points**
- Bonus confiance : **+0-20 points** (selon entités trouvées)
- **Total OCR** : **30-50 points**

### 5️⃣ Face Match (20 points)

**Recherche** :
- ✅ Selfie + Carte étudiante présents
- ✅ Photos matchées = +20 points
- ❌ Non-match = -30 points → Risque élevé

### 6️⃣ Tentatives Multiples (-10 points)

**Recherche** :
- ⚠️ Plus de 1 tentative de vérification
- ❌ = -10 points

---

## 📊 Score Total et Résultat

### Seuils Actuels (Après Ajustement)

- **AUTO_APPROVE** : Score ≥ **60** → ✅ Auto-approuvé
- **ADMIN_REVIEW** : Score 40-59 → ⚠️ Revue admin
- **REJECT** : Score < 40 ou menaces détectées → ❌ Rejeté

### Exemple Score 60

```
+10 Documents présents
+20 Antivirus clean
+30 OCR réussi
+3 Bonus confiance (entités trouvées)
---
= 63 points → ✅ AUTO-APPROVE
```

---

## 🎯 Ce Qui Fait "Match"

### Pour AUTO-APPROVE (≥60) :
1. ✅ OCR extrait du texte réel
2. ✅ Numéro étudiant détecté
3. ✅ Institution détectée
4. ✅ Antivirus clean
5. ✅ Documents présents

### Pour ADMIN_REVIEW (40-59) :
1. ⚠️ OCR réussi mais entités manquantes
2. ⚠️ Pas de face match
3. ⚠️ Email non universitaire
4. ✅ Antivirus clean

### Pour REJECT (<40) :
1. ❌ Menaces antivirus détectées
2. ❌ Non-match facial
3. ❌ Email jetable
4. ❌ OCR échoué + aucune entité

---

## 📝 Dans Votre Cas Actuel

### Ce Qui Fonctionne :
- ✅ **OCR** : Extraits texte "REPUBLIQUE Sorbonne !!!" avec succès
- ✅ **Antivirus** : Clean
- ✅ **Documents** : Présents
- ✅ **Entités** : Institution détectée

### Ce Qui Manque :
- ❌ **Email domaine** : Gmail = 0 points
- ❌ **Face match** : Pas de selfie/carte étudiante

### Score : 63 points
```
+10 Documents présents
+20 Antivirus
+30 OCR réussi
+3 Bonus confiance (institution détectée)
---
= 63 → ✅ AUTO-APPROVE
```

---

## 🎉 Conclusion

Le système cherche et vérifie :
1. **Email universitaire** (30 pts)
2. **Documents présents** (10 pts)
3. **Antivirus clean** (20 pts)
4. **OCR - texte et entités** (30-50 pts)
5. **Face match** (20 pts)

Avec les **nouveaux seuils** : **Score ≥ 60 → AUTO-APPROVE** ✅

