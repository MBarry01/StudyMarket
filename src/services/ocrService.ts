/**
 * Service OCR pour l'extraction de texte depuis les images de documents
 * 
 * Utilise Tesseract.js pour l'extraction de texte (OCR) - Gratuit et local
 * Alternative: Google Cloud Vision API (payant mais plus précis)
 */

import Tesseract from 'tesseract.js';

/**
 * Entités extraites du document
 */
export interface OCREntities {
  studentId?: string;        // Numéro étudiant
  name?: string;             // Nom complet
  institution?: string;      // Université/École
  expiryDate?: string;       // Date d'expiration
  issueDate?: string;         // Date d'émission
  email?: string;            // Email (rare)
}

/**
 * Résultat de l'extraction OCR
 */
export interface OCRResult {
  text: string;              // Texte brut extrait
  confidence: number;        // Confiance globale (0-100)
  entities: OCREntities;     // Entités structurées
  rawText: string;          // Alias pour compatibilité
  language?: string;         // Langue détectée
  processingTime?: number;   // Temps de traitement (ms)
}

export class OCRService {
  /**
   * Extraire le texte d'une image ou PDF
   * 
   * @param fileUrl URL publique du fichier (Storage URL)
   * @param options Options Tesseract
   * @returns Résultat OCR avec entités extraites
   */
  static async extractTextFromImage(
    fileUrl: string,
    options: {
      language?: string;  // 'fra' | 'eng' | 'fra+eng'
      oem?: number;       // OCR Engine Mode (0-3)
      psm?: number;       // Page Segmentation Mode (0-13)
    } = {}
  ): Promise<OCRResult> {
    // ⚠️ OCR côté client temporairement désactivé (CORS Firebase Storage)
    // La validation complète sera gérée côté serveur par un worker
    console.log('⚠️ [OCR] Client-side temporairement désactivé. La validation se fera côté serveur.');
    
    // Simulation de base pour pas bloquer le flow
    const mockResult: OCRResult = {
      text: 'REPUBLIQUE Sorbonne !!!\nFRANÇAISE NOUVelle\nLiberti…ltés, contactez le Guichet Numérique\nHaut de page',
      rawText: 'REPUBLIQUE Sorbonne !!!',
      confidence: 85,
      entities: {
        institution: 'Sorbonne',
      },
      language: 'fra',
      processingTime: 0,
    };

    console.log('✅ [OCR] Simulation retournée (serveur traitera en vrai)');
    return mockResult;
  }


  /**
   * Extraire les entités du texte brut
   */
  private static extractEntities(text: string): OCREntities {
    const entities: OCREntities = {};

    // 1. Numéro étudiant (6-10 chiffres)
    const studentIdPattern = /(?:n[°o]?\s*(?:étudiant|student|matricule)[:\s]*)?(\d{6,10})/i;
    const studentIdMatch = text.match(studentIdPattern);
    if (studentIdMatch && studentIdMatch[2]) {
      entities.studentId = studentIdMatch[2];
    }

    // 2. Institution (Université, École, etc.)
    const institutionPatterns = [
      /(?:université|university|école|school|institut|college)\s+([a-zà-ÿ\s-]+)/gi,
      /(sorbonne|dauphine|polytechnique|sciences po|paris \d+)/gi,
      /([A-Z][a-zà-ÿ]+(?:\s+[A-Z][a-zà-ÿ]+)*)\s+(?:university|université)/gi,
    ];

    for (const pattern of institutionPatterns) {
      const match = text.match(pattern);
      if (match) {
        entities.institution = match[0].trim();
        break;
      }
    }

    // 3. Date d'expiration (MM/YYYY ou DD/MM/YYYY)
    const expiryPatterns = [
      /(?:valid(?:e|ité)?\s+(?:jusqu'au|until|to)[:\s]*)?([\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{4})/i,
      /(?:expire|expiration)[:\s]*([\d]{1,2}[\/\-][\d]{4})/i,
    ];

    for (const pattern of expiryPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        entities.expiryDate = match[1];
        break;
      }
    }

    // 4. Date d'émission
    const issueDatePattern = /(?:délivré|issued|date)[:\s]*([\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{4})/i;
    const issueDateMatch = text.match(issueDatePattern);
    if (issueDateMatch && issueDateMatch[1]) {
      entities.issueDate = issueDateMatch[1];
    }

    // 5. Nom (patterns complexes)
    const namePattern = /(?:nom|name)[:\s]*([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)+)/i;
    const nameMatch = text.match(namePattern);
    if (nameMatch && nameMatch[1]) {
      entities.name = nameMatch[1].trim();
    }

    // 6. Email
    const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emailMatch = text.match(emailPattern);
    if (emailMatch && emailMatch[1]) {
      entities.email = emailMatch[1];
    }

    return entities;
  }

  /**
   * Calculer un score de confiance basé sur les entités extraites
   */
  static calculateConfidenceScore(entities: OCREntities): number {
    let score = 0;

    if (entities.studentId) score += 30;
    if (entities.institution) score += 30;
    if (entities.name) score += 20;
    if (entities.expiryDate) score += 15;
    if (entities.issueDate) score += 5;

    return Math.min(100, score);
  }

  /**
   * Vérifier si les entités minimales sont présentes
   */
  static hasMinimumEntities(entities: OCREntities): boolean {
    return !!(
      entities.institution || 
      entities.studentId || 
      entities.name
    );
  }
}
