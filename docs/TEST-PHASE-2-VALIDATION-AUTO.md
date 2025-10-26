# 🧪 Guide de Test - Phase 2 Validation Automatique

## 📋 Vue d'ensemble

Ce guide explique comment tester les services de validation automatique créés dans la Phase 2.

**Services à tester** :
- ✅ OCR Service (extraction texte)
- ✅ Face Match Service (comparaison faciale)
- ✅ Antivirus Service (scan fichiers)
- ✅ Auto Validation Service (orchestration)

---

## 🚀 Étape 1 : Créer un script de test

### 1. Créer `test-validation-services.ts`

```typescript
// test-validation-services.ts
import { OCRService } from './src/services/ocrService';
import { FaceMatchService } from './src/services/faceMatchService';
import { AntivirusService } from './src/services/antivirusService';
import { AutoValidationService } from './src/services/autoValidationService';

async function testValidationServices() {
  console.log('🧪 Test des services de validation automatique\n');

  // Test 1: OCR Service
  console.log('📄 Test 1: OCR Service');
  try {
    const ocrResult = await OCRService.extractTextFromImage(
      'https://example.com/student-card.jpg'
    );
    console.log('✅ OCR Result:', ocrResult);
    console.log('   Entities:', ocrResult.entities);
    console.log('   Confidence:', ocrResult.confidence);
  } catch (error) {
    console.error('❌ OCR Error:', error);
  }
  console.log('');

  // Test 2: Antivirus Service
  console.log('🛡️ Test 2: Antivirus Service');
  try {
    const antivirusResult = await AntivirusService.scanFile(
      'https://example.com/document.pdf',
      'test.pdf'
    );
    console.log('✅ Antivirus Result:', antivirusResult);
    console.log('   Clean:', antivirusResult.clean);
    console.log('   Threats:', antivirusResult.threats);
  } catch (error) {
    console.error('❌ Antivirus Error:', error);
  }
  console.log('');

  // Test 3: Face Match Service
  console.log('🔍 Test 3: Face Match Service');
  try {
    const faceMatchResult = await FaceMatchService.compareFaces(
      'https://example.com/selfie.jpg',
      'https://example.com/id-photo.jpg'
    );
    console.log('✅ Face Match Result:', faceMatchResult);
    console.log('   Similarity:', faceMatchResult.similarityScore);
    console.log('   Matched:', faceMatchResult.matched);
    console.log('   Risk Level:', FaceMatchService.calculateRiskLevel(faceMatchResult));
  } catch (error) {
    console.error('❌ Face Match Error:', error);
  }
  console.log('');

  // Test 4: Auto Validation (tous ensemble)
  console.log('🤖 Test 4: Auto Validation Service');
  try {
    const validationResult = await AutoValidationService.validate(
      'student@university.edu',
      [
        { url: 'https://example.com/student-card.jpg', filename: 'card.jpg' },
        { url: 'https://example.com/selfie.jpg', filename: 'selfie.jpg' },
      ],
      {
        ipAddress: '192.168.1.1',
        previousAttempts: 1,
      }
    );
    console.log('✅ Validation Result:');
    console.log('   Score:', validationResult.score);
    console.log('   Passed:', validationResult.passed);
    console.log('   Recommendation:', validationResult.recommendation);
    console.log('   Checks:', validationResult.checks);
    console.log('   Flags:', validationResult.flags);
  } catch (error) {
    console.error('❌ Validation Error:', error);
  }
}

// Exécuter
testValidationServices();
```

### 2. Lancer le test

```bash
# Installer ts-node si pas déjà fait
npm install -g ts-node

# Lancer le test
ts-node test-validation-services.ts
```

---

## 🧪 Étape 2 : Tester depuis le navigateur

### 1. Créer une page de test dans l'app

Créer `src/pages/TestValidationPage.tsx` :

```tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OCRService } from '@/services/ocrService';
import { FaceMatchService } from '@/services/faceMatchService';
import { AntivirusService } from '@/services/antivirusService';
import { AutoValidationService } from '@/services/autoValidationService';

export const TestValidationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTests = async () => {
    setLoading(true);
    
    try {
      // Test 1: OCR
      console.log('🧪 Testing OCR...');
      const ocrResult = await OCRService.extractTextFromImage('https://example.com/test.jpg');
      
      // Test 2: Antivirus
      console.log('🧪 Testing Antivirus...');
      const avResult = await AntivirusService.scanFile('https://example.com/test.pdf', 'test.pdf');
      
      // Test 3: Face Match
      console.log('🧪 Testing Face Match...');
      const faceResult = await FaceMatchService.compareFaces(
        'https://example.com/selfie.jpg',
        'https://example.com/card.jpg'
      );
      
      // Test 4: Auto Validation
      console.log('🧪 Testing Auto Validation...');
      const validationResult = await AutoValidationService.validate(
        'test@university.edu',
        [
          { url: 'https://example.com/card.jpg', filename: 'card.jpg' },
          { url: 'https://example.com/selfie.jpg', filename: 'selfie.jpg' },
        ],
        { previousAttempts: 0 }
      );
      
      setResults({
        ocr: ocrResult,
        antivirus: avResult,
        faceMatch: faceResult,
        validation: validationResult,
      });
      
      alert('✅ Tests terminés ! Voir console pour détails.');
    } catch (error) {
      console.error('❌ Test Error:', error);
      alert('❌ Erreur lors des tests. Voir console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tests Validation Automatique</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Services de Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={loading}>
            {loading ? 'Test en cours...' : 'Lancer les Tests'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

### 2. Ajouter la route dans `App.tsx`

```tsx
import { TestValidationPage } from './pages/TestValidationPage';

// Dans les routes
<Route path="/test-validation" element={<TestValidationPage />} />
```

### 3. Accéder à la page

```
http://localhost:5173/StudyMarket/test-validation
```

---

## 🔍 Étape 3 : Tester via Console DevTools

### Dans la console du navigateur (F12) :

```javascript
// Importer les services (si accessibles)
import { OCRService } from './services/ocrService';

// Test OCR
OCRService.extractTextFromImage('https://example.com/image.jpg')
  .then(result => console.log('OCR:', result))
  .catch(error => console.error('Error:', error));
```

---

## 📊 Étape 4 : Tester avec de vraies données

### 1. Préparer des documents de test

Créer un dossier `public/test-documents/` :

```
public/
└── test-documents/
    ├── student-card.jpg      # Carte étudiante
    ├── selfie.jpg            # Selfie
    └── certificate.pdf       # Certificat
```

### 2. Tester avec ces documents

```typescript
const testDocuments = [
  {
    url: '/test-documents/student-card.jpg',
    filename: 'student-card.jpg',
    type: 'student_card',
  },
  {
    url: '/test-documents/selfie.jpg',
    filename: 'selfie.jpg',
    type: 'selfie',
  },
];

const result = await AutoValidationService.validate(
  'student@sorbonne.edu',
  testDocuments,
  { previousAttempts: 0 }
);

console.log('Result:', result);
```

---

## ✅ Checklist de Test

### Tests OCR Service

- [ ] Extraction de texte d'une image
- [ ] Extraction des entités (ID, date, institution)
- [ ] Score de confiance calculé correctement

### Tests Antivirus Service

- [ ] Scan d'un fichier propre (résultat: clean=true)
- [ ] Scan de plusieurs fichiers
- [ ] Détection de fichiers suspects (désactiver temporairement)

### Tests Face Match Service

- [ ] Comparaison de deux photos similaires (score > 70)
- [ ] Comparaison de photos différentes (score < 70)
- [ ] Calcul du niveau de risque

### Tests Auto Validation

- [ ] Validation complète avec tous les services
- [ ] Calcul du score global (0-100)
- [ ] Recommandation correcte (auto_approve/admin_review/reject)
- [ ] Flags détectés (multipleAttempts, disposableEmail, etc.)

---

## 🎯 Résultat Attendu

### Console Output

```
🧪 Test des services de validation automatique

📄 Test 1: OCR Service
✅ OCR Result: {
  text: 'CARTE ÉTUDIANTE\n...',
  confidence: 0.95,
  entities: {
    studentId: '123456789',
    expiryDate: '12/2025',
    institution: 'Université Paris Sorbonne'
  }
}

🛡️ Test 2: Antivirus Service
✅ Antivirus Result: {
  clean: true,
  threats: [],
  scanner: 'clamav'
}

🔍 Test 3: Face Match Service
✅ Face Match Result: {
  similarityScore: 85,
  matched: true,
  confidence: 0.92
}

🤖 Test 4: Auto Validation Service
✅ Validation Result: {
  score: 75,
  passed: true,
  recommendation: 'admin_review',
  checks: {
    emailDomain: true,
    documentsPresent: true,
    antivirus: true,
    ocr: true,
    faceMatch: true
  }
}
```

---

## 🚨 Dépannage

### Erreur "Module not found"

```bash
# Vérifier les imports
npm install

# Vérifier les chemins
import { OCRService } from '@/services/ocrService';
```

### Erreur "TypeScript"

```bash
# Vérifier types
npm run build

# Vérifier tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Services ne s'exécutent pas

- Vérifier la console pour erreurs
- Vérifier les logs dans le navigateur (F12)
- Vérifier les clés API (si configurées)

---

## 📝 Notes

- **Mode simulation** : Les services utilisent des mocks pour le moment
- **Vrais services** : Ajouter les clés API pour activer les services cloud
- **Données de test** : Utiliser des images PDF réelles pour meilleurs résultats

---

**Prêt à tester ! 🚀**

