/**
 * 🚀 Listing Workflow Optimized - Architecture FSM avec extraction intelligente
 * Classes optimisées pour le workflow de création d'annonces
 */

// ============================================================================
// TYPES & INTERFACES - Typage strict pour robustesse
// ============================================================================

export type TransactionType = 'sell' | 'gift' | 'swap' | 'service';
export type Condition = 'new' | 'like-new' | 'good' | 'fair';
export type Category = 'books' | 'electronics' | 'furniture' | 'clothing' | 'services' | 'housing' | 'sport' | 'other';

export interface ExtractedData {
  price?: number;
  condition?: Condition;
  duration?: number;
  category?: Category;
  transactionType?: TransactionType;
  confidence: number; // 0-1 score de confiance
}

export interface FieldConfig {
  name: string;
  question: string;
  suggestions: string[];
  validator?: (value: any) => boolean;
  parser?: (value: any) => any;
  optional?: boolean;
}

export interface WorkflowState {
  type: 'create_listing';
  step: number;
  data: Record<string, any>;
  missing: string[];
  corrections: Record<string, number>; // Track correction attempts
  lastField?: string;
}

// ============================================================================
// CONFIGURATION CENTRALISÉE - Facile à maintenir et étendre
// ============================================================================

export class ListingConfig {
  // Patterns de détection optimisés (compilés une seule fois)
  private static readonly PATTERNS = {
    price: /(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:€|euros?|eur)?/i,
    duration: /(\d{1,3})\s*(?:h|heure|heures)/i,
    
    // Conditions avec score de confiance
    conditions: [
      { pattern: /\b(?:neuf|nouveau|jamais\s+servi|jamais\s+utilisé)\b/i, value: 'new' as Condition, confidence: 0.9 },
      { pattern: /\b(?:comme\s+neuf|quasi\s+neuf|très\s+bon|excellent\s+état)\b/i, value: 'like-new' as Condition, confidence: 0.85 },
      { pattern: /\b(?:bon\s+état|bonne?\s+état|correct|bien\s+entretenu)\b/i, value: 'good' as Condition, confidence: 0.8 },
      { pattern: /\b(?:usagé|usage|utilisé|occasion|signes\s+d'usure)\b/i, value: 'fair' as Condition, confidence: 0.75 }
    ],
    
    // Catégories avec mots-clés multiples
    categories: [
      { keywords: ['livre', 'manuel', 'cours', 'bd', 'roman', 'bouquin', 'harry potter'], value: 'books' as Category },
      { keywords: ['ordi', 'pc', 'macbook', 'phone', 'téléphone', 'telephone', 'tablette', 'console', 'écran', 'laptop'], value: 'electronics' as Category },
      { keywords: ['vélo', 'velo', 'bicyclette', 'trottinette', 'sport', 'fitness'], value: 'sport' as Category },
      { keywords: ['appartement', 'logement', 'chambre', 'studio', 'colocation'], value: 'housing' as Category },
      { keywords: ['vêtement', 'vetement', 'pull', 'pantalon', 'chaussure', 'manteau'], value: 'clothing' as Category },
      { keywords: ['meuble', 'chaise', 'table', 'mobilier'], value: 'furniture' as Category }
    ],
    
    // Transaction types
    transactions: [
      { keywords: ['don', 'gratuit', 'offre', 'cadeau', 'donner'], value: 'gift' as TransactionType },
      { keywords: ['échange', 'echange', 'troc', 'swap', 'échanger'], value: 'swap' as TransactionType },
      { keywords: ['service', 'cours', 'aide', 'réparation', 'tutorat', 'proposer un service'], value: 'service' as TransactionType }
    ]
  };

  // Champs requis par type de transaction (avec priorités)
  static readonly REQUIRED_FIELDS: Record<TransactionType, FieldConfig[]> = {
    sell: [
      {
        name: 'productName',
        question: 'Quel article veux-tu vendre ?',
        suggestions: ['📚 Livre', '💻 Électronique', '👕 Vêtements', '🚲 Vélo', 'Autre'],
        validator: (v) => typeof v === 'string' && v.length >= 3
      },
      {
        name: 'category',
        question: 'Dans quelle catégorie ?',
        suggestions: ['📚 Livres & Cours', '💻 Électronique', '👕 Vêtements', '🪑 Mobilier', 'Autre'],
        validator: (v) => typeof v === 'string' && v.length > 0
      },
      {
        name: 'price',
        question: 'À quel prix ? (ex: 20€)',
        suggestions: ['💰 10€', '💰 25€', '💰 50€', '💰 100€', '💰 Négociable'],
        validator: (v) => typeof v === 'number' && v >= 0,
        parser: (v) => ListingConfig.parsePrice(v)
      },
      {
        name: 'condition',
        question: 'Quel est son état ?',
        suggestions: ['✨ Neuf', '🌟 Comme neuf', '👍 Bon état', '⚠️ Usagé'],
        validator: (v) => ['new', 'like-new', 'good', 'fair'].includes(v)
      },
      {
        name: 'paymentMethods',
        question: 'Quels modes de paiement acceptes-tu ?',
        suggestions: ['💵 Espèces', '🏦 Virement', '📱 Lydia', '💳 PayPal'],
        optional: true
      }
    ],
    gift: [
      {
        name: 'productName',
        question: 'Qu\'est-ce que tu donnes ?',
        suggestions: ['📚 Livre', '🪑 Meuble', '👕 Vêtements', 'Autre'],
        validator: (v) => typeof v === 'string' && v.length >= 3
      },
      {
        name: 'category',
        question: 'Dans quelle catégorie ?',
        suggestions: ['📚 Livres & Cours', '💻 Électronique', '👕 Vêtements', '🪑 Mobilier', 'Autre'],
        validator: (v) => typeof v === 'string' && v.length > 0
      },
      {
        name: 'donationReason',
        question: 'Pourquoi le donnes-tu ?',
        suggestions: ['Plus besoin', 'Déménagement', 'Faire plaisir', 'Passer'],
        optional: true
      }
    ],
    swap: [
      {
        name: 'productName',
        question: 'Que proposes-tu à l\'échange ?',
        suggestions: ['📚 Livre', '🎮 Jeu', '💻 Tech', 'Autre'],
        validator: (v) => typeof v === 'string' && v.length >= 3
      },
      {
        name: 'category',
        question: 'Dans quelle catégorie ?',
        suggestions: ['📚 Livres & Cours', '💻 Électronique', '👕 Vêtements', '🪑 Mobilier', 'Autre'],
        validator: (v) => typeof v === 'string' && v.length > 0
      },
      {
        name: 'desiredItems',
        question: 'Contre quoi veux-tu l\'échanger ?',
        suggestions: ['Livres', 'Électronique', 'Vêtements', 'Ouvert à tout'],
        validator: (v) => typeof v === 'string' && v.length >= 3
      },
      {
        name: 'estimatedValue',
        question: 'Valeur estimée ? (ex: 50€)',
        suggestions: ['💰 25€', '💰 50€', '💰 100€', '💰 Autre'],
        validator: (v) => typeof v === 'number' && v >= 0,
        parser: (v) => ListingConfig.parsePrice(v)
      }
    ],
    service: [
      {
        name: 'productName',
        question: 'Quel service proposes-tu ?',
        suggestions: ['Cours particuliers', 'Aide informatique', 'Réparation', 'Autre'],
        validator: (v) => typeof v === 'string' && v.length >= 3
      },
      {
        name: 'category',
        question: 'Dans quelle catégorie ?',
        suggestions: ['🔧 Services', '📚 Cours', '💻 Informatique', 'Autre'],
        validator: (v) => typeof v === 'string' && v.length > 0
      },
      {
        name: 'hourlyRate',
        question: 'Tarif horaire ? (ex: 15€/h)',
        suggestions: ['💰 10€/h', '💰 15€/h', '💰 20€/h', '💰 25€/h', '💰 Gratuit'],
        validator: (v) => typeof v === 'number' && v >= 0,
        parser: (v) => ListingConfig.parsePrice(v)
      },
      {
        name: 'duration',
        question: 'Durée prévue ? (ex: 2h)',
        suggestions: ['⏱️ 1h', '⏱️ 2h', '⏱️ 5h', '⏱️ 10h'],
        optional: true
      },
      {
        name: 'skills',
        question: 'Décris tes compétences (bref)',
        suggestions: ['Maths/Physique', 'Langues', 'Informatique', 'Autre'],
        optional: true
      }
    ]
  };

  // Helper: parse price avec gestion multi-formats
  static parsePrice(input: any): number | null {
    if (input == null) return null;
    if (typeof input === 'number') return input >= 0 ? input : null;
    
    const cleaned = String(input)
      .toLowerCase()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    
    const num = parseFloat(cleaned);
    return !isNaN(num) && num >= 0 ? num : null;
  }

  // Obtenir patterns compilés
  static getPatterns() {
    return this.PATTERNS;
  }
}

// ============================================================================
// EXTRACTEUR INTELLIGENT - NLP léger avec scoring
// ============================================================================

export class EntityExtractor {
  // Cache pour optimisation
  private static cache = new Map<string, ExtractedData>();
  
  static extract(text: string): ExtractedData {
    if (!text || text.length < 2) return { confidence: 0 };
    
    // Check cache
    const cacheKey = text.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result: ExtractedData = { confidence: 0 };
    // Normalisation Unicode pour gérer accents
    const normalized = text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    const patterns = ListingConfig.getPatterns();
    
    let confidenceSum = 0;
    let extractionCount = 0;

    // 1. Prix (priorité haute) - Amélioré pour détecter tarifs horaires
    // Pattern pour tarif horaire: "10€/h", "15 euros par heure", etc.
    const hourlyRateMatch = normalized.match(/(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:€|euros?|eur)?\s*(?:\/|par)\s*(?:h|heure|heures)/i);
    if (hourlyRateMatch) {
      result.hourlyRate = parseFloat(hourlyRateMatch[1].replace(',', '.'));
      result.transactionType = 'service';
      confidenceSum += 0.95;
      extractionCount++;
    } else {
      // Prix standard
      const priceMatch = normalized.match(patterns.price);
      if (priceMatch) {
        result.price = parseFloat(priceMatch[1].replace(',', '.'));
        confidenceSum += 0.95;
        extractionCount++;
      }
    }

    // 2. Condition (avec score)
    for (const { pattern, value, confidence } of patterns.conditions) {
      if (pattern.test(normalized)) {
        result.condition = value;
        confidenceSum += confidence;
        extractionCount++;
        break;
      }
    }

    // 3. Durée
    const durationMatch = normalized.match(patterns.duration);
    if (durationMatch) {
      result.duration = parseInt(durationMatch[1], 10);
      confidenceSum += 0.85;
      extractionCount++;
    }

    // 4. Catégorie (match par mots-clés avec score)
    const words = normalized.split(/\s+/);
    let bestCategoryScore = 0;
    for (const { keywords, value } of patterns.categories) {
      const matchCount = keywords.filter(kw => 
        words.some(w => w.includes(kw.toLowerCase()))
      ).length;
      const score = matchCount / keywords.length;
      if (score > bestCategoryScore && score > 0.3) {
        result.category = value;
        bestCategoryScore = score;
      }
    }
    if (result.category) {
      confidenceSum += bestCategoryScore;
      extractionCount++;
    }

    // 5. Type de transaction
    for (const { keywords, value } of patterns.transactions) {
      if (keywords.some(kw => normalized.includes(kw.toLowerCase()))) {
        result.transactionType = value;
        confidenceSum += 0.8;
        extractionCount++;
        break;
      }
    }

    // Prix = 0 ou "gratuit" => gift
    if ((result.price === 0 || /\bgratuit\b/.test(normalized)) && !result.transactionType) {
      result.transactionType = 'gift';
      confidenceSum += 0.9;
      extractionCount++;
    }

    // Calcul confiance globale
    result.confidence = extractionCount > 0 ? confidenceSum / extractionCount : 0;

    // Cache result (max 100 entries)
    if (this.cache.size > 100) this.cache.clear();
    this.cache.set(cacheKey, result);

    return result;
  }

  // Clear cache si besoin
  static clearCache() {
    this.cache.clear();
  }
}

// ============================================================================
// WORKFLOW MANAGER - FSM (Finite State Machine)
// ============================================================================

export class WorkflowManager {
  private static readonly MAX_CORRECTIONS = 3;
  private static readonly MAX_STEPS = 8;

  // Valider et normaliser workflow state
  static validateState(state: any): WorkflowState {
    return {
      type: 'create_listing',
      step: Math.max(0, state?.step || 0),
      data: state?.data || {},
      missing: Array.isArray(state?.missing) ? state.missing : [],
      corrections: state?.corrections || {},
      lastField: state?.lastField
    };
  }

  // Merge data intelligent avec détection de corrections
  static mergeData(
    existing: Record<string, any>,
    incoming: Record<string, any>,
    extracted: ExtractedData
  ): Record<string, any> {
    const merged = { ...existing };

    // Incoming data (priorité haute - explicit user input)
    for (const [key, value] of Object.entries(incoming)) {
      if (value !== undefined && value !== null && value !== '') {
        merged[key] = value;
      }
    }

    // Extracted data (seulement si confiance > 0.6 et pas déjà présent)
    if (extracted.confidence > 0.6) {
      for (const [key, value] of Object.entries(extracted)) {
        if (key !== 'confidence' && !merged[key] && value !== undefined) {
          merged[key] = value;
        }
      }
    }

    return merged;
  }

  // Calculer champ suivant avec logique avancée
  static getNextField(
    missing: string[],
    transactionType: TransactionType,
    state: WorkflowState
  ): FieldConfig | null {
    if (missing.length === 0) return null;
    
    const fields = ListingConfig.REQUIRED_FIELDS[transactionType] || [];
    const corrections = state.corrections;

    // Filtrer champs qui ont eu trop de tentatives ratées
    const available = fields.filter(f => 
      missing.includes(f.name) && 
      (corrections[f.name] || 0) < this.MAX_CORRECTIONS
    );

    if (available.length === 0) return null;

    // Priorité: dernier champ si correction, sinon premier manquant
    if (state.lastField && available.some(f => f.name === state.lastField)) {
      return available.find(f => f.name === state.lastField)!;
    }

    return available[0];
  }

  // Valider input utilisateur
  static validateInput(field: FieldConfig, value: any): boolean {
    if (!field.validator) return true;
    
    try {
      const parsed = field.parser ? field.parser(value) : value;
      return field.validator(parsed);
    } catch {
      return false;
    }
  }

  // Incrémenter compteur de corrections
  static incrementCorrection(state: WorkflowState, fieldName: string): WorkflowState {
    return {
      ...state,
      corrections: {
        ...state.corrections,
        [fieldName]: (state.corrections[fieldName] || 0) + 1
      }
    };
  }
}

