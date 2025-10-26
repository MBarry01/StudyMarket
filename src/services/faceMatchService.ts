/**
 * Service de comparaison faciale pour vérifier que la photo correspond à la carte
 * 
 * Utilise AWS Rekognition ou Azure Face API pour la comparaison faciale
 */

export interface FaceMatchResult {
  similarityScore: number; // 0-100
  confidence: number; // 0-1
  matched: boolean;
  facesDetected: {
    source: number;
    target: number;
  };
}

export class FaceMatchService {
  private static readonly MIN_SIMILARITY_SCORE = 70; // Score minimum pour match
  private static readonly MIN_CONFIDENCE = 0.80; // Confiance minimum

  /**
   * Comparer deux images faciales
   * 
   * @param sourceUrl URL de la source (selfie)
   * @param targetUrl URL de la cible (photo carte étudiante)
   * @returns Résultat de comparaison
   */
  static async compareFaces(sourceUrl: string, targetUrl: string): Promise<FaceMatchResult> {
    try {
      console.log('🔍 Début comparaison faciale');
      console.log('  Source:', sourceUrl);
      console.log('  Target:', targetUrl);
      
      // TODO: Implémenter appel AWS Rekognition ou Azure Face
      // 1. Télécharger les deux images depuis Firebase Storage
      // 2. Appeler l'API Rekognition CompareFaces
      // 3. Calculer le score de similarité
      
      // Simulation pour développement
      // En production, remplacer par l'appel API réel
      const mockResult: FaceMatchResult = {
        similarityScore: 85,
        confidence: 0.92,
        matched: true,
        facesDetected: {
          source: 1,
          target: 1,
        },
      };
      
      console.log('✅ Comparaison terminée:', mockResult);
      return mockResult;
    } catch (error) {
      console.error('❌ Erreur comparaison faciale:', error);
      throw error;
    }
  }

  /**
   * Vérifier si la comparaison est valide
   */
  static isValid(result: FaceMatchResult): boolean {
    return (
      result.similarityScore >= this.MIN_SIMILARITY_SCORE &&
      result.confidence >= this.MIN_CONFIDENCE &&
      result.matched &&
      result.facesDetected.source >= 1 &&
      result.facesDetected.target >= 1
    );
  }

  /**
   * Calculer le niveau de risque basé sur le score
   */
  static calculateRiskLevel(result: FaceMatchResult): 'low' | 'medium' | 'high' {
    if (result.similarityScore >= 85 && result.confidence >= 0.90) {
      return 'low';
    } else if (result.similarityScore >= 70 && result.confidence >= 0.80) {
      return 'medium';
    } else {
      return 'high';
    }
  }
}

/**
 * TODO: Intégration AWS Rekognition
 * 
 * 1. Installer: npm install @aws-sdk/client-rekognition
 * 2. Ajouter clés AWS dans .env:
 *    AWS_ACCESS_KEY_ID=...
 *    AWS_SECRET_ACCESS_KEY=...
 *    AWS_REGION=...
 * 
 * 3. Implémenter le vrai appel:
 * 
 * ```typescript
 * import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition';
 * 
 * const client = new RekognitionClient({
 *   region: process.env.AWS_REGION,
 *   credentials: {
 *     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
 *   }
 * });
 * 
 * const command = new CompareFacesCommand({
 *   SourceImage: { Bytes: sourceImageBuffer },
 *   TargetImage: { Bytes: targetImageBuffer },
 *   SimilarityThreshold: 70,
 * });
 * 
 * const response = await client.send(command);
 * const similarity = response.FaceMatches?.[0]?.Similarity || 0;
 * 
 * return {
 *   similarityScore: similarity,
 *   confidence: response.FaceMatches?.[0]?.Face?.Confidence / 100,
 *   matched: similarity >= 70,
 * };
 * ```
 */

/**
 * TODO: Intégration Azure Face API
 * 
 * ```typescript
 * import { FaceClient } from '@azure/cognitiveservices-face';
 * 
 * const client = new FaceClient(
 *   new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': API_KEY } }),
 *   ENDPOINT
 * );
 * 
 * const verifyResult = await client.face.verifyFaceToFace(
 *   sourceFaceId,
 *   targetFaceId
 * );
 * 
 * return {
 *   similarityScore: verifyResult.confidence * 100,
 *   confidence: verifyResult.confidence,
 *   matched: verifyResult.isIdentical,
 * };
 * ```
 */

