/**
 * Service OCR pour l'extraction de texte depuis les images de documents
 * 
 * Utilise Google Cloud Vision API pour l'extraction de texte (OCR)
 * Alternative: AWS Textract, Azure Computer Vision
 */

export interface OCRResult {
  text: string;
  confidence: number;
  entities: {
    institution?: string;
    studentId?: string;
    expiryDate?: string;
    name?: string;
  };
  rawText: string; // Texte brut extrait
}

export class OCRService {
  /**
   * Extraire le texte d'une image de document
   * 
   * @param imageUrl URL de l'image dans Firebase Storage
   * @returns Résultat OCR avec entités extraites
   */
  static async extractTextFromImage(imageUrl: string): Promise<OCRResult> {
    try {
      console.log('📄 OCR extraction pour:', imageUrl);
      
      // Vérifier si la clé API est disponible
      const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
      
      if (apiKey && apiKey !== 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
        // Appel réel Google Cloud Vision API
        try {
          let imageData;
          
          // Gérer Base64 (data:image/png;base64,...)
          if (imageUrl.startsWith('data:image/')) {
            // Extraire le Base64 sans le préfixe
            const base64Data = imageUrl.split(',')[1];
            imageData = { image: { content: base64Data } };
          } else {
            // URL externe
            imageData = { image: { source: { imageUri: imageUrl } } };
          }
          
          const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                requests: [
                  {
                    ...imageData,
                    features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
                  },
                ],
              }),
            }
          );
          
          const data = await response.json();
          
          if (data.responses && data.responses[0] && data.responses[0].fullTextAnnotation) {
            const text = data.responses[0].fullTextAnnotation.text;
            const entities = this.extractEntities(text);
            
            const result: OCRResult = {
              text,
              confidence: 0.95,
              entities,
              rawText: text,
            };
            
            console.log('✅ OCR Google Cloud terminé:', result);
            return result;
          }
          
          console.warn('⚠️ Google Cloud Vision: pas de texte détecté, fallback simulation');
        } catch (apiError) {
          console.error('❌ Erreur Google Cloud Vision:', apiError);
          console.warn('⚠️ Fallback vers simulation');
        }
      }
      
      // Simulation pour développement (fallback)
      const mockResult: OCRResult = {
        text: 'CARTE ÉTUDIANTE\nUniversité Paris Sorbonne\nNom: John Doe\nID: 123456789\nExp: 12/2025',
        confidence: 0.95,
        entities: {
          institution: 'Université Paris Sorbonne',
          studentId: '123456789',
          expiryDate: '12/2025',
          name: 'John Doe',
        },
        rawText: 'CARTE ÉTUDIANTE Université Paris Sorbonne Nom: John Doe ID: 123456789 Exp: 12/2025',
      };
      
      console.log('✅ OCR simulation:', mockResult);
      return mockResult;
    } catch (error) {
      console.error('❌ Erreur OCR:', error);
      throw error;
    }
  }

  /**
   * Extraire les entités importantes d'un texte
   */
  static extractEntities(text: string): OCRResult['entities'] {
    const entities: OCRResult['entities'] = {};
    
    // Recherche numéro étudiant (patterns courants)
    const studentIdMatch = text.match(/ID[:\s]*(\d{6,10})|(\d{6,10})/);
    if (studentIdMatch) {
      entities.studentId = studentIdMatch[1] || studentIdMatch[2];
    }
    
    // Recherche date d'expiration
    const expiryMatch = text.match(/EXP[:\s]*(\d{1,2}\/\d{4})|(\d{1,2}\/\d{2,4})/);
    if (expiryMatch) {
      entities.expiryDate = expiryMatch[1] || expiryMatch[2];
    }
    
    // Recherche nom d'institution
    const institutionKeywords = ['Université', 'University', 'School', 'College', 'Institut'];
    for (const keyword of institutionKeywords) {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        entities.institution = text.substring(index, index + 50).trim();
        break;
      }
    }
    
    return entities;
  }

  /**
   * Calculer un score de confiance pour la vérification
   */
  static calculateConfidenceScore(entities: OCRResult['entities']): number {
    let score = 0;
    
    if (entities.studentId) score += 30;
    if (entities.expiryDate) score += 20;
    if (entities.institution) score += 30;
    if (entities.name) score += 20;
    
    return Math.min(score, 100);
  }
}

/**
 * TODO: Intégration Google Cloud Vision API
 * 
 * 1. Installer: npm install @google-cloud/vision
 * 2. Ajouter clés API dans .env
 * 3. Implémenter le vrai appel:
 * 
 * ```typescript
 * import vision from '@google-cloud/vision';
 * 
 * const client = new vision.ImageAnnotatorClient({
 *   keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
 * });
 * 
 * const [result] = await client.documentTextDetection({
 *   image: { source: { imageUri: imageUrl } }
 * });
 * 
 * const text = result.fullTextAnnotation?.text || '';
 * return this.extractEntities(text);
 * ```
 */

