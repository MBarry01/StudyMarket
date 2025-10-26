import { OCRService, OCRResult } from './ocrService';
import { FaceMatchService, FaceMatchResult } from './faceMatchService';
import { AntivirusService, AntivirusResult } from './antivirusService';

/**
 * Résultat complet de validation automatique
 */
export interface AutoValidationResult {
  passed: boolean;
  score: number; // 0-100
  checks: {
    emailDomain: boolean;
    documentsPresent: boolean;
    antivirus: boolean;
    ocr: boolean;
    faceMatch: boolean;
  };
  details: {
    ocr?: OCRResult;
    faceMatch?: FaceMatchResult;
    antivirus?: AntivirusResult[];
  };
  flags: {
    riskLevel: 'low' | 'medium' | 'high';
    multipleAttempts: boolean;
    disposableEmail: boolean;
    ipMismatch: boolean;
  };
  recommendation: 'auto_approve' | 'admin_review' | 'reject';
}

export class AutoValidationService {
  private static readonly AUTO_APPROVE_THRESHOLD = 85; // Score minimum pour approbation automatique
  private static readonly ADMIN_REVIEW_THRESHOLD = 50; // Score minimum pour revue admin

  /**
   * Valider automatiquement une demande de vérification
   * 
   * Cette méthode exécute plusieurs vérifications:
   * 1. Vérification du domaine email
   * 2. Scan antivirus des documents
   * 3. Extraction OCR des informations
   * 4. Comparaison faciale si disponible
   * 
   * @param email Email de l'utilisateur
   * @param documents Liste des documents uploadés
   * @param options Options supplémentaires (IP, tentative précédente, etc.)
   * @returns Résultat complet de validation
   */
  static async validate(
    email: string,
    documents: Array<{ url: string; filename: string; type?: string }>,
    options: {
      ipAddress?: string;
      previousAttempts?: number;
      userAgent?: string;
    } = {}
  ): Promise<AutoValidationResult> {
    console.log('🤖 Début validation automatique');
    
    const result: AutoValidationResult = {
      passed: false,
      score: 0,
      checks: {
        emailDomain: false,
        documentsPresent: false,
        antivirus: false,
        ocr: false,
        faceMatch: false,
      },
      details: {},
      flags: {
        riskLevel: 'medium',
        multipleAttempts: options.previousAttempts ? options.previousAttempts > 1 : false,
        disposableEmail: false,
        ipMismatch: false,
      },
      recommendation: 'admin_review',
    };

    try {
      // 1. Vérifier domaine email
      const emailDomainOk = this.checkEmailDomain(email);
      result.checks.emailDomain = emailDomainOk;
      if (emailDomainOk) result.score += 20;
      
      // Détecter emails jetables
      if (this.isDisposableEmail(email)) {
        result.flags.disposableEmail = true;
        result.score -= 20;
      }

      // 2. Vérifier présence documents
      const documentsPresent = documents.length > 0;
      result.checks.documentsPresent = documentsPresent;
      if (documentsPresent) {
        result.score += 10;
        
        // 3. Scanner antivirus
        const antivirusResults = await AntivirusService.scanFiles(documents);
        result.details.antivirus = antivirusResults;
        const allClean = AntivirusService.areAllClean(antivirusResults);
        result.checks.antivirus = allClean;
        
        if (allClean) {
          result.score += 20;
        } else {
          result.score -= 50; // Menaces détectées
          result.flags.riskLevel = 'high';
          result.recommendation = 'reject';
          return result;
        }

        // 4. Extraction OCR sur la première image
        try {
          const firstDocument = documents.find(d => 
            d.filename.toLowerCase().match(/\.(jpg|jpeg|png|pdf)$/)
          );
          
          if (firstDocument) {
            const ocrResult = await OCRService.extractTextFromImage(firstDocument.url);
            result.details.ocr = ocrResult;
            result.checks.ocr = true;
            result.score += 20;
            
            // Vérifier si les entités importantes sont extraites
            const confidenceScore = OCRService.calculateConfidenceScore(ocrResult.entities);
            result.score += Math.floor(confidenceScore * 0.1); // +0-10 basé sur confiance
          }
        } catch (error) {
          console.error('Erreur OCR:', error);
        }

        // 5. Comparaison faciale si selfie présent
        try {
          const selfie = documents.find(d => 
            d.type === 'selfie' || d.filename.toLowerCase().includes('selfie')
          );
          const studentCard = documents.find(d => 
            d.type === 'student_card' || d.filename.toLowerCase().includes('card')
          );
          
          if (selfie && studentCard) {
            const faceMatchResult = await FaceMatchService.compareFaces(
              selfie.url,
              studentCard.url
            );
            result.details.faceMatch = faceMatchResult;
            result.checks.faceMatch = FaceMatchService.isValid(faceMatchResult);
            
            if (result.checks.faceMatch) {
              result.score += 20;
              result.flags.riskLevel = FaceMatchService.calculateRiskLevel(faceMatchResult);
            } else {
              result.score -= 30; // Non-match facial
              result.flags.riskLevel = 'high';
            }
          }
        } catch (error) {
          console.error('Erreur face match:', error);
        }
      }

      // 6. Vérifier tentatives multiples
      if (result.flags.multipleAttempts) {
        result.score -= 10;
      }

      // 7. Déterminer la recommandation finale
      result.recommendation = this.determineRecommendation(result.score);
      result.passed = result.score >= this.ADMIN_REVIEW_THRESHOLD;

      console.log('✅ Validation terminée:', {
        score: result.score,
        recommendation: result.recommendation,
        passed: result.passed,
      });

      return result;
    } catch (error) {
      console.error('❌ Erreur validation automatique:', error);
      result.recommendation = 'admin_review';
      return result;
    }
  }

  /**
   * Vérifier le domaine de l'email
   */
  private static checkEmailDomain(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    const validDomains = [
      '.edu',
      'univ-',
      '.ac.',
      'student.',
      'etudiant.',
      'etu.',
      'sorbonne-universite.fr',
      'sorbonne-nouvelle.fr',
      'dauphine.psl.eu',
    ];

    return validDomains.some(valid => domain.includes(valid));
  }

  /**
   * Détecter email jetable
   */
  private static isDisposableEmail(email: string): boolean {
    const disposableDomains = [
      'tempmail.com',
      'throwaway.email',
      'guerrillamail.com',
      '10minutemail.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain || '');
  }

  /**
   * Déterminer la recommandation basée sur le score
   */
  private static determineRecommendation(score: number): AutoValidationResult['recommendation'] {
    if (score >= this.AUTO_APPROVE_THRESHOLD) {
      return 'auto_approve';
    } else if (score >= this.ADMIN_REVIEW_THRESHOLD) {
      return 'admin_review';
    } else {
      return 'reject';
    }
  }
}

