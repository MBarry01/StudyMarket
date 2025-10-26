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
    const startTime = Date.now();
    console.log('🔍 [OCR] Début extraction:', fileUrl);

    try {
      // Si c'est un PDF, extraire la première page en image d'abord
      let imageUrl = fileUrl;
      if (fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.toLowerCase().includes('pdf')) {
        imageUrl = await this.convertPDFToImage(fileUrl);
      }

      // Configuration Tesseract
      const worker = await Tesseract.createWorker(options.language || 'fra+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      // Paramètres OCR
      await worker.setParameters({
        tessedit_pageseg_mode: options.psm || Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: options.oem || Tesseract.OEM.LSTM_ONLY,
      });

      // Extraction
      const { data } = await worker.recognize(imageUrl);
      await worker.terminate();

      const processingTime = Date.now() - startTime;
      const text = data.text.trim();

      console.log(`✅ [OCR] Texte extrait (${processingTime}ms):`, text.substring(0, 100));

      // Extraction des entités
      const entities = this.extractEntities(text);

      return {
        text,
        rawText: text,
        confidence: data.confidence,
        entities,
        language: options.language || 'fra+eng',
        processingTime,
      };

    } catch (error) {
      console.error('❌ [OCR] Erreur extraction:', error);
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convertir PDF en image pour OCR
   */
  private static async convertPDFToImage(pdfUrl: string): Promise<string> {
    try {
      // Utiliser pdf.js pour extraire la première page
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configure worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = 
        `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1); // Première page

      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('⚠️ [OCR] Impossible de convertir PDF, utilisation directe:', error);
      return pdfUrl;
    }
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
