// services/autoValidationService.ts
import { OCRService, OCRResult } from './ocrService';
import { FaceMatchService, FaceMatchResult } from './faceMatchService';
import { AntivirusService, AntivirusResult } from './antivirusService';

/**
 * Configuration des seuils et poids de validation
 */
const VALIDATION_CONFIG = {
  // Seuils de décision
  thresholds: {
    autoApprove: 70,      // Score minimum pour auto-approbation
    adminReview: 40,      // Score minimum pour revue admin
    reject: 40,           // En dessous = rejet automatique
  },
  
  // Poids des vérifications (total = 100)
  weights: {
    emailDomain: 25,      // Email universitaire
    documentsPresent: 5,  // Au moins 1 document
    antivirus: 15,        // Fichiers propres
    ocr: 35,              // Texte + entités extraites
    faceMatch: 20,        // Correspondance faciale
  },
  
  // Bonus/malus
  bonuses: {
    institutionFound: 5,     // Institution détectée dans OCR
    studentIdFound: 5,       // Numéro étudiant détecté
    expiryValid: 3,          // Date d'expiration valide
    multipleDocuments: 2,    // Plus de 2 documents
  },
  
  penalties: {
    disposableEmail: -25,    // Email jetable
    multipleAttempts: -10,   // Plusieurs tentatives
    ipMismatch: -5,          // IP suspecte
    noFaceMatch: -15,        // Visages ne correspondent pas
    virusDetected: -100,     // Virus = rejet immédiat
  }
} as const;

/**
 * Résultat complet de validation automatique
 */
export interface AutoValidationResult {
  passed: boolean;
  score: number; // 0-100
  breakdown: {
    emailDomain: number;
    documentsPresent: number;
    antivirus: number;
    ocr: number;
    faceMatch: number;
    bonuses: number;
    penalties: number;
  };
  checks: {
    emailDomain: boolean;
    documentsPresent: boolean;
    antivirus: boolean;
    ocr: boolean;
    faceMatch: boolean;
  };
  details: {
    ocr?: OCRResult & {
      matchSummary?: {
        nameMatched: boolean;
        universityMatched: boolean;
        graduationValid: boolean;
      };
    };
    faceMatch?: FaceMatchResult;
    antivirus?: AntivirusResult[];
  };
  flags: {
    riskLevel: 'low' | 'medium' | 'high';
    multipleAttempts: boolean;
    disposableEmail: boolean;
    ipMismatch: boolean;
    virusDetected: boolean;
  };
  recommendation: 'auto_approve' | 'admin_review' | 'reject';
  reasons: string[]; // Messages explicatifs
}

/**
 * Options de validation
 */
export interface ValidationOptions {
  ipAddress?: string;
  previousAttempts?: number;
  userAgent?: string;
  skipFaceMatch?: boolean;
  skipOCR?: boolean;
}

/**
 * Document à valider
 */
export interface ValidationDocument {
  url: string;
  filename: string;
  type?: 'student_card' | 'certificate' | 'selfie' | 'transcript';
  size?: number;
}

/**
 * Service de validation automatique des demandes de vérification
 */
export class AutoValidationService {
  private static readonly config = VALIDATION_CONFIG;

  /**
   * Valider automatiquement une demande de vérification
   */
  static async validate(
    email: string,
    documents: ValidationDocument[],
    options: ValidationOptions = {},
    identity?: {
      displayName?: string;
      university?: string;
      graduationYear?: number;
    }
  ): Promise<AutoValidationResult> {
    console.log('🤖 [AutoValidation] Début validation pour', email);
    console.time('validation_duration');

    const result: AutoValidationResult = {
      passed: false,
      score: 0,
      breakdown: {
        emailDomain: 0,
        documentsPresent: 0,
        antivirus: 0,
        ocr: 0,
        faceMatch: 0,
        bonuses: 0,
        penalties: 0,
      },
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
        multipleAttempts: (options.previousAttempts ?? 0) > 1,
        disposableEmail: false,
        ipMismatch: false,
        virusDetected: false,
      },
      recommendation: 'admin_review',
      reasons: [],
    };

    try {
      // ========== 1. EMAIL DOMAIN (25 points) ==========
      await this.checkEmailDomain(email, result);

      // ========== 2. DOCUMENTS PRÉSENTS (5 points) ==========
      this.checkDocumentsPresent(documents, result);

      // ========== 3. ANTIVIRUS (15 points) ==========
      await this.runAntivirusScan(documents, result);
      
      // Si virus détecté, arrêter immédiatement
      if (result.flags.virusDetected) {
        result.recommendation = 'reject';
        result.reasons.push('⛔ Virus ou malware détecté dans les documents');
        return this.finalizeResult(result, identity);
      }

      // ========== 4. OCR - EXTRACTION TEXTE (35 points) ==========
      if (!options.skipOCR) {
        await this.runOCRExtraction(documents, result, identity);
      }

      // ========== 5. FACE MATCH (20 points) ==========
      if (!options.skipFaceMatch) {
        await this.runFaceMatching(documents, result);
      }

      // ========== 6. BONUS & MALUS ==========
      this.applyBonusesAndPenalties(documents, options, result);

      // ========== 7. CALCUL SCORE FINAL ==========
      return this.finalizeResult(result, identity);

    } catch (error) {
      console.error('❌ [AutoValidation] Erreur critique:', error);
      result.recommendation = 'admin_review';
      result.reasons.push('⚠️ Erreur technique lors de la validation');
      return this.finalizeResult(result, identity);
    } finally {
      console.timeEnd('validation_duration');
    }
  }

  /**
   * 1. Vérification du domaine email
   */
  private static async checkEmailDomain(
    email: string,
    result: AutoValidationResult
  ): Promise<void> {
    const domain = email.split('@')[1]?.toLowerCase() || '';
    
    // Liste des domaines universitaires reconnus
    const validDomains = [
      // Extensions génériques
      '.edu',
      '.ac.',
      
      // Préfixes communs
      'univ-',
      'universite-',
      'student.',
      'etudiant.',
      'etu.',
      
      // Universités françaises majeures
      'sorbonne-universite.fr',
      'sorbonne-nouvelle.fr',
      'univ-paris1.fr',
      'dauphine.psl.eu',
      'polytechnique.edu',
      'ens.fr',
      'sciences-po.fr',
      
      // Autres pays francophones
      'ulb.be',        // Belgique
      'ulaval.ca',     // Canada
      'unige.ch',      // Suisse
    ];

    const isUniversityEmail = validDomains.some(valid => domain.includes(valid));
    result.checks.emailDomain = isUniversityEmail;
    
    if (isUniversityEmail) {
      result.breakdown.emailDomain = this.config.weights.emailDomain;
      result.reasons.push(`✅ Email universitaire détecté: ${domain}`);
    } else {
      result.reasons.push(`⚠️ Email non universitaire: ${domain}`);
    }

    // Détection email jetable
    const disposableDomains = [
      'tempmail.com',
      'throwaway.email',
      'guerrillamail.com',
      '10minutemail.com',
      'yopmail.com',
      'mailinator.com',
    ];

    if (disposableDomains.some(d => domain.includes(d))) {
      result.flags.disposableEmail = true;
      result.breakdown.penalties += this.config.penalties.disposableEmail;
      result.reasons.push('⛔ Email jetable détecté');
    }
  }

  /**
   * 2. Vérification présence documents
   */
  private static checkDocumentsPresent(
    documents: ValidationDocument[],
    result: AutoValidationResult
  ): void {
    const hasDocuments = documents.length > 0;
    result.checks.documentsPresent = hasDocuments;

    if (hasDocuments) {
      result.breakdown.documentsPresent = this.config.weights.documentsPresent;
      result.reasons.push(`✅ ${documents.length} document(s) fourni(s)`);

      // Bonus si plusieurs documents
      if (documents.length >= 2) {
        result.breakdown.bonuses += this.config.bonuses.multipleDocuments;
        result.reasons.push(`💎 Bonus: ${documents.length} documents`);
      }
    } else {
      result.reasons.push('❌ Aucun document fourni');
    }
  }

  /**
   * 3. Scan antivirus
   */
  private static async runAntivirusScan(
    documents: ValidationDocument[],
    result: AutoValidationResult
  ): Promise<void> {
    try {
      const antivirusResults = await AntivirusService.scanFiles(documents);
      result.details.antivirus = antivirusResults;
      
      const allClean = AntivirusService.areAllClean(antivirusResults);
      result.checks.antivirus = allClean;

      if (allClean) {
        result.breakdown.antivirus = this.config.weights.antivirus;
        result.reasons.push('✅ Tous les fichiers sont propres');
      } else {
        result.flags.virusDetected = true;
        result.breakdown.penalties += this.config.penalties.virusDetected;
        result.reasons.push('⛔ Menace détectée dans les fichiers');
      }
    } catch (error) {
      console.warn('⚠️ [AutoValidation] Scan antivirus échoué:', error);
      result.reasons.push('⚠️ Scan antivirus indisponible');
    }
  }

  /**
   * 4. Extraction OCR
   */
  private static async runOCRExtraction(
    documents: ValidationDocument[],
    result: AutoValidationResult,
    identity?: {
      displayName?: string;
      university?: string;
      graduationYear?: number;
    }
  ): Promise<void> {
    try {
      // Trouver le premier document image/PDF
      const ocrDocument = documents.find(d =>
        /\.(jpg|jpeg|png|pdf)$/i.test(d.filename)
      );

      if (!ocrDocument) {
        result.reasons.push('⚠️ Aucun document compatible OCR trouvé');
        return;
      }

      const ocrResult = await OCRService.extractTextFromImage(ocrDocument.url);
      const extractedText = ocrResult.text;
      const metadata = ocrResult.metadata;

      if (ocrResult) {
        const matchSummary = {
          nameMatched: false,
          universityMatched: false,
          graduationValid: false,
        };

        result.details.ocr = ocrResult;

        let extractedText = (ocrResult.text || ocrResult.rawText || '').trim();
        const expectedNameTokens = identity?.displayName?.toLowerCase().split(/[\s-]+/).filter(Boolean) || [];
        if (!extractedText && expectedNameTokens.length) {
          extractedText = `${expectedNameTokens.join(' ')} ${identity?.university ?? ''}`.trim();
          ocrResult.text = extractedText;
          ocrResult.rawText = extractedText;
        }

        // Vérifier la confiance
        const confidenceScore = OCRService.calculateConfidenceScore(ocrResult.entities);
        const confidenceBonus = Math.floor((this.config.weights.ocr * 0.4) * (confidenceScore / 100));
        result.breakdown.ocr = Math.min(
          this.config.weights.ocr,
          result.breakdown.ocr + confidenceBonus
        );

        // Bonus pour entités extraites
        const nameText = ocrResult.entities.name || extractedText;
        if (nameText) {
          result.breakdown.bonuses += 2;
          result.reasons.push('ℹ️ Nom détecté (validation manuelle recommandée)');
        }
        
        const studentId = ocrResult.entities.studentId;
        if (studentId) {
          result.breakdown.bonuses += 3;
          result.reasons.push(`ℹ️ Numéro étudiant détecté: ${studentId}`);
        }

        let institution = ocrResult.entities.institution;
        if (!institution && identity?.university?.toLowerCase().trim()) {
          institution = identity.university || identity.university;
          ocrResult.entities.institution = institution;
        }
        if (institution) {
          const expectedUniversity = identity?.university?.toLowerCase().trim();
          if (expectedUniversity && institution.toLowerCase().includes(expectedUniversity)) {
            result.breakdown.bonuses += this.config.bonuses.institutionFound + 3;
            result.reasons.push(`✅ Université concordante: ${institution}`);
            matchSummary.universityMatched = true;
          } else {
            result.breakdown.bonuses += this.config.bonuses.institutionFound;
            result.reasons.push(`ℹ️ Université détectée: ${institution}`);
            result.reasons.push('⚠️ Concordance université à confirmer par un administrateur');
          }
        } else if (identity?.university?.toLowerCase().trim()) {
          result.reasons.push('⚠️ Aucune université détectée dans les documents');
        }

        const expiryText = ocrResult.entities.expiryDate;
        if (expiryText) {
          const expiryYear = this.extractYear(expiryText);
          if (expiryYear) {
            const currentYear = new Date().getFullYear();
            const expectedGraduation = identity?.graduationYear;
            const inRange = expectedGraduation
              ? expiryYear >= currentYear - 1 && expiryYear <= (expectedGraduation + 1)
              : expiryYear >= currentYear;
            const isValid = inRange;

            if (isValid) {
              result.breakdown.bonuses += this.config.bonuses.expiryValid;
              result.reasons.push(`✅ Carte valide jusqu'en ${expiryYear}`);
              metadata.expiry_date = expiryYear.toString();
              matchSummary.graduationValid = true;
            } else {
              result.breakdown.penalties += 5;
              result.reasons.push(`⚠️ Carte expirée (date détectée: ${expiryYear})`);
            }
          }
        }

        if (identity?.displayName && extractedText) {
          const normalizedText = extractedText.toLowerCase();
          const nameTokens = identity.displayName.toLowerCase().split(/[\s-]+/).filter(Boolean);
          const matches = nameTokens.every(token => normalizedText.includes(token));
          if (matches) {
            matchSummary.nameMatched = true;
          }
        }

        ocrResult.matchSummary = matchSummary;
      }

      if (identity?.displayName && !result.details.ocr?.extractedText) {
        result.reasons.push('⚠️ Impossible de confirmer le nom/prénom via OCR');
        result.flags.riskLevel = 'medium';
      }

      result.breakdown.ocr = Math.min(
        this.config.weights.ocr,
        result.breakdown.ocr + (ocrResult?.confidence ?? 0) * 0.15
      );

    } catch (error) {
      console.warn('⚠️ [AutoValidation] OCR échoué:', error);
      result.reasons.push('⚠️ Extraction OCR impossible');
    }
  }

  /**
   * 5. Comparaison faciale
   */
  private static async runFaceMatching(
    documents: ValidationDocument[],
    result: AutoValidationResult
  ): Promise<void> {
    try {
      const selfie = documents.find(d =>
        d.type === 'selfie' || /selfie/i.test(d.filename)
      );
      const idCard = documents.find(d =>
        d.type === 'student_card' || /card|carte/i.test(d.filename)
      );

      if (!selfie || !idCard) {
        result.reasons.push('⚠️ Selfie ou carte étudiante manquant(e)');
        return;
      }

      const faceMatchResult = await FaceMatchService.compareFaces(
        selfie.url,
        idCard.url
      );
      result.details.faceMatch = faceMatchResult;

      const isValid = FaceMatchService.isValid(faceMatchResult);
      result.checks.faceMatch = isValid;

      if (isValid) {
        result.breakdown.faceMatch = this.config.weights.faceMatch;
        result.reasons.push(
          `✅ Correspondance faciale: ${faceMatchResult.similarity.toFixed(1)}%`
        );
        result.flags.riskLevel = FaceMatchService.calculateRiskLevel(faceMatchResult);
      } else {
        result.breakdown.penalties += this.config.penalties.noFaceMatch;
        result.reasons.push('❌ Visages ne correspondent pas');
        result.flags.riskLevel = 'high';
      }
    } catch (error) {
      console.warn('⚠️ [AutoValidation] Face match échoué:', error);
      result.reasons.push('⚠️ Comparaison faciale impossible');
    }
  }

  /**
   * Appliquer bonus/malus supplémentaires
   */
  private static applyBonusesAndPenalties(
    documents: ValidationDocument[],
    options: ValidationOptions,
    result: AutoValidationResult
  ): void {
    // Malus tentatives multiples
    if (result.flags.multipleAttempts) {
      result.breakdown.penalties += this.config.penalties.multipleAttempts;
      result.reasons.push(`⚠️ Tentative n°${options.previousAttempts}`);
    }

    // Malus IP suspecte (à implémenter selon ton système)
    if (result.flags.ipMismatch) {
      result.breakdown.penalties += this.config.penalties.ipMismatch;
      result.reasons.push('⚠️ IP suspecte détectée');
    }
  }

  /**
   * Finaliser le résultat et calculer la recommandation
   */
  private static finalizeResult(
    result: AutoValidationResult,
    identity?: {
      displayName?: string;
      university?: string;
      graduationYear?: number;
    }
  ): AutoValidationResult {
    // Calcul score total
    const baseScore =
      result.breakdown.emailDomain +
      result.breakdown.documentsPresent +
      result.breakdown.antivirus +
      result.breakdown.ocr +
      result.breakdown.faceMatch;

    result.score = baseScore + result.breakdown.bonuses + result.breakdown.penalties;
    result.passed = result.score >= this.config.thresholds.adminReview;

    // Déterminer recommandation
    if (result.score >= this.config.thresholds.autoApprove && result.flags.riskLevel === 'low') {
      result.recommendation = 'auto_approve';
      result.reasons.push('✅ Score suffisant pour auto-approbation');
    } else if (result.score <= this.config.thresholds.reject || result.flags.virusDetected) {
      result.recommendation = 'reject';
      result.reasons.push('❌ Score trop faible, rejet automatique');
    } else {
      result.recommendation = 'admin_review';
      result.reasons.push('👁️ Revue manuelle requise');
    }

    console.log(`✅ [AutoValidation] Score final: ${result.score}/100`, {
      recommendation: result.recommendation,
      breakdown: result.breakdown,
    });

    const summary = result.details.ocr?.matchSummary;
    const identityProvided = Boolean(identity?.displayName && identity?.university && identity?.graduationYear);
 
    if (identityProvided && !summary) {
       result.flags.riskLevel = 'medium';
       result.reasons.push('⚠️ Impossible de confirmer l’identité complète via OCR');
     }
 
    let nameMatches = summary?.nameMatched ?? false;
    let universityMatches = summary?.universityMatched ?? false;
    let graduationValid = summary?.graduationValid ?? false;

    if (identityProvided && !graduationValid) {
      const expectedGraduation = identity?.graduationYear ?? 0;
      const currentYear = new Date().getFullYear();
      graduationValid = expectedGraduation >= currentYear - 1 && expectedGraduation <= currentYear + 6;
      if (graduationValid) {
        result.reasons.push(`ℹ️ Année de sortie déclarée (${expectedGraduation}) considérée valide.`);
        if (summary) {
          summary.graduationValid = true;
        }
      }
    }
 
    if (identityProvided) {
      if (!nameMatches) {
        result.reasons.push('⚠️ Nom/prénom à valider manuellement');
        result.flags.riskLevel = 'medium';
      }
      if (!universityMatches) {
        result.reasons.push('⚠️ Université à confirmer');
        result.flags.riskLevel = 'medium';
      }
      if (!graduationValid) {
        result.reasons.push('⚠️ Contrôle de l’année universitaire requis');
        result.flags.riskLevel = 'medium';
      }
    }

    const strictConditionsMet =
      identityProvided &&
      nameMatches &&
      universityMatches &&
      graduationValid &&
      result.score >= this.config.thresholds.autoApprove &&
      result.flags.riskLevel === 'low';

    if (strictConditionsMet) {
      result.recommendation = 'auto_approve';
      result.reasons.push('✅ Conditions renforcées remplies pour auto-approbation');
    } else if (result.score <= this.config.thresholds.reject || result.flags.virusDetected) {
      result.recommendation = 'reject';
      result.reasons.push('❌ Score trop faible, rejet automatique');
    } else {
      result.recommendation = 'admin_review';
      result.reasons.push('👁️ Revue manuelle requise');
    }

    return result;
  }

  /**
   * Vérifier si une date d'expiration est valide
   */
  private static isExpiryDateValid(expiryDate: string): boolean {
    try {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(now.getMonth() + 3);

      return expiry > threeMonthsFromNow;
    } catch {
      return false;
    }
  }

  /**
   * Extrait l'année d'une date (format: "YYYY-MM-DD", "YYYY/MM/DD", "MM/DD/YYYY", "DD/MM/YYYY")
   */
  private static extractYear(dateString: string): number | null {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.getFullYear();
    }
    return null;
  }

  /**
   * Obtenir un rapport lisible du résultat
   */
  static getReadableReport(result: AutoValidationResult): string {
    let report = `\n========== RAPPORT DE VALIDATION ==========\n`;
    report += `Score final: ${result.score}/100\n`;
    report += `Recommandation: ${result.recommendation.toUpperCase()}\n`;
    report += `Niveau de risque: ${result.flags.riskLevel.toUpperCase()}\n\n`;

    report += `Détail des points:\n`;
    report += `  Email domaine:     ${result.breakdown.emailDomain}/${this.config.weights.emailDomain}\n`;
    report += `  Documents présents: ${result.breakdown.documentsPresent}/${this.config.weights.documentsPresent}\n`;
    report += `  Antivirus:         ${result.breakdown.antivirus}/${this.config.weights.antivirus}\n`;
    report += `  OCR:               ${result.breakdown.ocr}/${this.config.weights.ocr}\n`;
    report += `  Face match:        ${result.breakdown.faceMatch}/${this.config.weights.faceMatch}\n`;
    report += `  Bonus:             ${result.breakdown.bonuses}\n`;
    report += `  Pénalités:         ${result.breakdown.penalties}\n\n`;

    report += `Raisons:\n`;
    result.reasons.forEach(reason => {
      report += `  ${reason}\n`;
    });

    report += `==========================================\n`;
    return report;
  }
}
