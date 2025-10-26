# 🔍 Debug API Cloud - Vérifier l'Activation

## 📊 État Actuel

Vos tests affichent des résultats de **simulation (mock)** au lieu d'appeler la vraie API Google Cloud Vision.

## 🎯 Pourquoi ?

### Analyse du Code

Le code vérifie :
```typescript
const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;

if (apiKey && apiKey !== 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
  // Appeler la vraie API
}
```

**Le problème** : La condition vérifie que la clé n'est **PAS** la clé d'exemple "AIzaSyxx...".

### Pour Tester Maintenant

Ouvrez la **console du navigateur (F12)** et regardez les logs :

```
📄 OCR extraction pour: https://example.com/student-card.jpg
✅ OCR simulation: {...}
```

Si vous voyez "OCR simulation", cela signifie que la clé API n'est pas chargée depuis `.env`.

## 🔧 Solutions

### Solution 1 : Vérifier que la clé est chargée

Dans la console (F12), tapez :

```javascript
// Vérifier si la clé est chargée
console.log(import.meta.env.VITE_GOOGLE_CLOUD_API_KEY);
```

**Attendu** : Votre clé API

**Si `undefined`** : Le fichier `.env` n'est pas chargé. Redémarrer avec `npm run dev`.

### Solution 2 : Redémarrer avec --mode development

```bash
npm run dev -- --mode development
```

### Solution 3 : Vérifier le fichier .env

Ouvrir `.env` et vérifier :

```env
VITE_GOOGLE_CLOUD_API_KEY=AIzaSyBRS3KCZFxtOYCMtjtTDGsWFAVnh_jTYwQ
```

⚠️ **Important** : Pas d'espaces, pas de guillemets

### Solution 4 : Forcer l'activation (temporaire)

Pour tester immédiatement, modifier le code :

```typescript
// Dans src/services/ocrService.ts
const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || 'AIzaSyBRS3KCZFxtOYCMtjtTDGsWFAVnh_jTYwQ';
```

Mais ce n'est **pas recommandé** pour production !

---

## 🧪 Test Immédiat

### Étape 1 : Vérifier dans Console

Ouvrir la console (F12) et exécuter :

```javascript
// Test 1: Vérifier la clé
console.log('API Key:', import.meta.env.VITE_GOOGLE_CLOUD_API_KEY);

// Test 2: Vérifier tous les env
console.log('All Env:', import.meta.env);
```

### Étape 2 : Relancer les Tests

1. **S'assurer** que l'app est redémarrée
2. **Aller** sur `/test-validation`
3. **Ouvrir** la console (F12)
4. **Cliquer** "Lancer les Tests"
5. **Regarder** les logs

**Si vous voyez** :
```
📄 OCR extraction pour: ...
⚠️ Fallback vers simulation
```

➡️ La clé n'est pas chargée depuis `.env`

**Si vous voyez** :
```
📄 OCR extraction pour: ...
🔌 Appel Google Cloud Vision API...
```

➡️ La vraie API est appelée !

---

## 📝 Logs Attendus

### Mode Simulation (Actuel)

```
📄 OCR extraction pour: https://example.com/image.jpg
✅ OCR simulation: { text: "...", confidence: 0.95 }
```

### Mode Production (Avec Clé)

```
📄 OCR extraction pour: https://example.com/image.jpg
🔌 Appel Google Cloud Vision API...
✅ OCR Google Cloud terminé: { text: "...", confidence: 0.95 }
```

OU

```
📄 OCR extraction pour: https://example.com/image.jpg
🔌 Appel Google Cloud Vision API...
❌ Erreur Google Cloud Vision: API Error...
⚠️ Fallback vers simulation
```

---

## 🎯 Commandes Rapides

### Vérifier les logs

```bash
# Dans le terminal où npm run dev tourne
# Regarder les logs de démarrage
```

### Redémarrer proprement

```bash
# 1. Arrêter (Ctrl+C)
# 2. Vérifier .env
cat .env | grep GOOGLE

# 3. Relancer
npm run dev
```

### Test rapide dans console

```javascript
// Dans la console navigateur (F12)
fetch('https://vision.googleapis.com/v1/images:annotate?key=VOTRE_CLE_API', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requests: [{
      image: { source: { imageUri: 'https://example.com/test.jpg' } },
      features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
    }]
  })
})
.then(r => r.json())
.then(console.log);
```

---

## 🔍 Diagnostic

**Question** : Voyez-vous "🔌 Appel Google Cloud Vision API..." dans les logs ?

- ✅ **Oui** → La vraie API est appelée
- ❌ **Non** → La clé n'est pas chargée depuis `.env`

**Solution** :
1. Vérifier `.env`
2. Redémarrer l'app
3. Vérifier console pour erreurs

---

**Faites-moi savoir ce que vous voyez dans la console ! 🔍**

