# 🧪 Test OCR avec Image Réelle

## 🔍 Diagnostic

**Le message important** :
```
⚠️ Google Cloud Vision: pas de texte détecté, fallback simulation
```

Cela signifie que **Google Cloud Vision API a été appelée**, mais n'a pas trouvé de texte dans l'image.

**Raison** : Les URLs de test (`https://example.com/student-card.jpg`) ne pointent pas vers de vraies images.

---

## ✅ Solution : Tester avec une Image Réelle

### Option 1 : Utiliser une Image Publique

Google Cloud Vision peut lire des images publiquement accessibles.

**Exemple** :
```
https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png
```

### Option 2 : Utiliser une Image de Test avec Texte

Je peux :
1. **Créer** une image de test avec du texte
2. **L'héberger** publiquement
3. **Tester** l'OCR dessus

### Option 3 : Upload une Image via Firebase Storage

1. **Uploader** une vraie image de carte étudiante
2. **Obtenir** l'URL Firebase Storage
3. **Tester** l'OCR avec cette URL

---

## 🎯 Test Rapide

### Option A : Image Externe

Créer une nouvelle variable dans `.env` :

```env
VITE_TEST_IMAGE_URL=https://example.com/real-image-with-text.jpg
```

### Option B : Image Firebase Storage

Si vous avez une image dans Firebase Storage :

```
gs://votre-bucket/verifications/user123/document.jpg
https://firebasestorage.googleapis.com/v0/votre-bucket/o/verifications%2Fuser123%2Fdocument.jpg
```

---

## 📝 Ce Que Je Peux Faire

1. **Modifier** le code pour accepter une image de test réelle
2. **Créer** un exemple d'image avec du texte pour tester
3. **Ajouter** un upload d'image dans la page de test

**Votre choix ?**

---

## 🔄 Alternative : Vérifier la Clé API

Si vous voulez juste vérifier que l'API fonctionne, testez directement dans la console :

```javascript
// Dans la console du navigateur (F12)
const apiKey = 'VOTRE_CLE_API';

fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requests: [{
      image: { source: { imageUri: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png' } },
      features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
    }]
  })
})
.then(r => r.json())
.then(data => console.log('Résultat:', data));
```

**Remplacez `VOTRE_CLE_API` par votre vraie clé.**

---

**Quelle option préférez-vous ?**

1. Créer une image de test avec texte
2. Modifier la page de test pour upload d'image
3. Tester directement l'API dans la console
4. Continuer avec la simulation pour le moment

