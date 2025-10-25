# ⚠️ Note Importante - gmail.com Temporaire

## 🔧 Configuration Actuelle

### **Validation Email**
```typescript
const universityDomains = [
  '.edu', 'univ-', '.ac.', 'student.', 'etudiant.', 'etu.',
  'gmail.com', // ⚠️ TEMPORAIRE : pour tests uniquement
  'sorbonne-universite.fr',
  // ... autres domaines universitaires
];
```

## ✅ État Actuel

**Mode** : 🧪 **DÉVELOPPEMENT / TEST**

**Emails Acceptés** :
- ✅ Tous les emails universitaires
- ✅ gmail.com (**temporaire pour tests**)

---

## 🚀 Avant Mise en Production

### **À FAIRE** : Retirer gmail.com

1. **Ouvrir** : `src/pages/AuthPage.tsx`

2. **Chercher** (2 endroits) :
   ```typescript
   'gmail.com', // TEMPORAIRE : pour tests uniquement
   ```

3. **Supprimer** cette ligne (2 fois) :
   - Ligne ~35 (dans `signUpSchema`)
   - Ligne ~136 (dans `isUniversityEmail`)

4. **Résultat** :
   ```typescript
   const universityDomains = [
     '.edu', 'univ-', '.ac.', 'student.', 'etudiant.', 'etu.',
     // gmail.com retiré ✅
     'sorbonne-universite.fr',
     // ...
   ];
   ```

---

## 📋 Checklist Avant Production

- [ ] Retirer `gmail.com` de `signUpSchema` (ligne ~35)
- [ ] Retirer `gmail.com` de `isUniversityEmail` (ligne ~136)
- [ ] Tester avec un vrai email universitaire
- [ ] Vérifier que gmail.com est bien rejeté
- [ ] Déployer

---

## 🧪 Tests à Effectuer

### **En Développement (Maintenant)**
```bash
✅ test@gmail.com → Accepté (pour tests)
✅ test@univ-paris.fr → Accepté
✅ test@student.sorbonne.fr → Accepté
```

### **En Production (Après retrait gmail.com)**
```bash
❌ test@gmail.com → Rejeté ✅
✅ test@univ-paris.fr → Accepté
✅ test@student.sorbonne.fr → Accepté
```

---

## ⚡ Rappel

**Pourquoi gmail.com est temporaire ?**
- 🧪 Facilite les tests en développement
- 🚀 Évite de créer de faux emails universitaires
- 🔐 **DOIT être retiré en production** pour garantir une vraie communauté étudiante

---

**Date d'ajout** : 25 octobre 2025  
**Statut** : ⚠️ **TEMPORAIRE - À retirer avant production**  
**Action requise** : 🚀 Retirer `gmail.com` avant déploiement

