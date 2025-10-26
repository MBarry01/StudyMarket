import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OCRService } from '@/services/ocrService';
import { FaceMatchService } from '@/services/faceMatchService';
import { AntivirusService } from '@/services/antivirusService';
import { AutoValidationService } from '@/services/autoValidationService';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const TestValidationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const runTests = async () => {
    setLoading(true);
    setResults(null);
    setCurrentTest('');

    try {
      // Utiliser l'image uploadée ou l'image de test par défaut
      const testImageUrl = uploadedImageUrl || 'https://example.com/student-card.jpg';
      
      // Test 1: OCR
      setCurrentTest('OCR Service');
      const ocrResult = await OCRService.extractTextFromImage(testImageUrl);
      
      // Test 2: Antivirus
      setCurrentTest('Antivirus Service');
      const avResult = await AntivirusService.scanFile('https://example.com/test.pdf', 'test.pdf');
      
      // Test 3: Face Match
      setCurrentTest('Face Match Service');
      const faceResult = await FaceMatchService.compareFaces(
        'https://example.com/selfie.jpg',
        'https://example.com/card.jpg'
      );
      
      // Test 4: Auto Validation
      setCurrentTest('Auto Validation Service');
      const validationResult = await AutoValidationService.validate(
        'student@university.edu',
        [
          { url: 'https://example.com/card.jpg', filename: 'card.jpg', type: 'student_card' },
          { url: 'https://example.com/selfie.jpg', filename: 'selfie.jpg', type: 'selfie' },
        ],
        { 
          ipAddress: '192.168.1.1',
          previousAttempts: 0 
        }
      );
      
      setResults({
        ocr: ocrResult,
        antivirus: avResult,
        faceMatch: faceResult,
        validation: validationResult,
      });
      
      setCurrentTest('');
    } catch (error) {
      console.error('❌ Test Error:', error);
      setCurrentTest(`Erreur: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (title: string, result: any, success: boolean) => {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {success ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <h3 className="font-semibold">{title}</h3>
        </div>
        <pre className="bg-muted p-3 rounded text-xs overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tests Validation Automatique</h1>
        <p className="text-muted-foreground">
          Testez les services de validation automatique (OCR, Face Match, Antivirus)
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Services de Validation</CardTitle>
          <CardDescription>
            Cliquez sur le bouton pour lancer les tests des services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload une image de test (optionnel)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-muted-foreground
                         file:mr-4 file:py-2 file:px-4 file:rounded-lg
                         file:border-0 file:text-sm file:font-semibold
                         file:bg-primary file:text-primary-foreground
                         hover:file:bg-primary/90 cursor-pointer"
            />
            {uploadedImageUrl && (
              <Alert className="mt-2">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Image chargée : {imageFile?.name}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <Button onClick={runTests} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {currentTest || 'Test en cours...'}
              </>
            ) : (
              'Lancer les Tests'
            )}
          </Button>
        </CardContent>
      </Card>

      {loading && currentTest && (
        <Alert className="mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <strong>{currentTest}</strong> en cours...
          </AlertDescription>
        </Alert>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats des Tests</CardTitle>
            <CardDescription>
              Détails des tests effectués sur les services de validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OCR Result */}
            {results.ocr && renderResult(
              'OCR Service - Extraction de Texte',
              results.ocr,
              true
            )}

            {/* Antivirus Result */}
            {results.antivirus && renderResult(
              'Antivirus Service - Scan de Sécurité',
              results.antivirus,
              results.antivirus.clean
            )}

            {/* Face Match Result */}
            {results.faceMatch && renderResult(
              'Face Match Service - Comparaison Faciale',
              results.faceMatch,
              results.faceMatch.matched
            )}

            {/* Validation Result */}
            {results.validation && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold text-lg">Auto Validation - Résultat Complet</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-2xl font-bold">{results.validation.score}/100</p>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <p className="text-lg font-semibold">
                      {results.validation.passed ? '✅ Passé' : '❌ Échoué'}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">Recommandation</p>
                  <Alert className={results.validation.recommendation === 'auto_approve' ? 'bg-green-50' : 
                                     results.validation.recommendation === 'admin_review' ? 'bg-yellow-50' : 'bg-red-50'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-semibold">
                      {results.validation.recommendation === 'auto_approve' && '✅ Approuvé automatiquement'}
                      {results.validation.recommendation === 'admin_review' && '⚠️ Demande revue admin'}
                      {results.validation.recommendation === 'reject' && '❌ Rejeté'}
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-semibold mb-2">Vérifications</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(results.validation.checks).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center gap-2">
                        {value ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Flags de Risque</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(results.validation.flags, null, 2)}
                  </pre>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Détails</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(results.validation.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestValidationPage;

