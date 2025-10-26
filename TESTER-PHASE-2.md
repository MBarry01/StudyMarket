# 🧪 Comment Tester la Phase 2

## 📋 Étapes Simplifiées

### 1. Lancer l'application

```bash
npm run dev
```

L'application se lance sur `http://localhost:5173`

### 2. Accéder à la page de test

Ouvrir dans le navigateur :
```
http://localhost:5173/StudyMarket/#/test-validation
```

OU ajouter le lien dans le menu de navigation (temporairement)

### 3. Cliquer sur "Lancer les Tests"

Le bouton va :
- ✅ Tester OCR Service (extraction texte)
- ✅ Tester Antivirus Service (scan fichiers)
- ✅ Tester Face Match Service (comparaison faciale)
- ✅ Tester Auto Validation (orchestration complète)

### 4. Voir les résultats

La page affichera :
- ✅ Score global (0-100)
- ✅ Détail des vérifications (emailDomain, documents, antivirus, OCR, faceMatch)
- ✅ Recommandation (auto_approve / admin_review / reject)
- ✅ Flags de risque
- ✅ Détails de chaque service

---

## 🎯 Résultat Attendue

### En simulation (mode actuel)

```
Score: 75-85
Recommandation: admin_review
Vérifications: Toutes ✅
```

### Avec vrais services (après configuration)

```
Score: 85-95
Recommandation: auto_approve
Vérifications: Toutes ✅
```

---

## 🚀 Alternative : Tester depuis la Console

Ouvrir la console (F12) et exécuter :

```javascript
// Test OCR
import('./services/ocrService').then(({ OCRService }) => {
  OCRService.extractTextFromImage('https://example.com/test.jpg')
    .then(result => console.log('OCR:', result));
});

// Test Auto Validation
import('./services/autoValidationService').then(({ AutoValidationService }) => {
  AutoValidationService.validate(
    'test@university.edu',
    [{ url: 'https://example.com/doc.jpg', filename: 'doc.jpg' }],
    {}
  ).then(result => console.log('Validation:', result));
});
```

---

## ✅ Checklist

- [ ] Application lancée (npm run dev)
- [ ] Page de test accessible
- [ ] Bouton "Lancer les Tests" cliqueable
- [ ] Résultats affichés dans la page
- [ ] Console (F12) sans erreurs
- [ ] Services retournent des résultats de simulation

---

**C'est tout ! 🎉**

