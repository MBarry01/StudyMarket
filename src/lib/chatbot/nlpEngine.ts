/**
 * 🧠 NLP Engine Expert avec ML et Intelligence Avancée
 * Moteur de traitement du langage naturel pour le chatbot StudyMarket
 */

import { aggressiveNormalize, levenshteinDistance } from './utils';

// ==================== TYPES ====================

export enum IntentType {
  // Actions Principales
  CREATE_LISTING = 'create_listing',
  SEARCH_LISTING = 'search_listing',
  VIEW_LISTINGS = 'view_listings',
  EDIT_LISTING = 'edit_listing',
  DELETE_LISTING = 'delete_listing',
  
  // Transactions
  BUY = 'buy',
  SELL = 'sell',
  NEGOTIATE = 'negotiate',
  VIEW_ORDERS = 'view_orders',
  
  // Messages
  SEND_MESSAGE = 'send_message',
  VIEW_MESSAGES = 'view_messages',
  
  // Favoris
  ADD_FAVORITE = 'add_favorite',
  VIEW_FAVORITES = 'view_favorites',
  
  // Compte
  VIEW_PROFILE = 'view_profile',
  EDIT_PROFILE = 'edit_profile',
  VIEW_STATS = 'view_stats',
  
  // Support
  GET_HELP = 'get_help',
  REPORT_ISSUE = 'report_issue',
  CONTACT_SUPPORT = 'contact_support',
  
  // Navigation
  NAVIGATE = 'navigate',
  
  // Informations
  GET_INFO = 'get_info',
  
  // Social
  GREETING = 'greeting',
  GOODBYE = 'goodbye',
  THANKS = 'thanks',
  
  // Fallback
  UNKNOWN = 'unknown'
}

export enum EntityType {
  CATEGORY = 'category',
  PRICE = 'price',
  LOCATION = 'location',
  CONDITION = 'condition',
  DATE = 'date',
  PRODUCT_NAME = 'product_name',
  PERSON = 'person',
  REFERENCE = 'reference',
  NUMBER = 'number'
}

export enum Sentiment {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  URGENT = 'urgent',
  FRUSTRATED = 'frustrated'
}

export interface Entity {
  type: EntityType;
  value: string;
  normalized?: any;
  confidence: number;
  position: { start: number; end: number };
}

export interface Intent {
  type: IntentType;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface NLPResult {
  intents: Intent[];
  entities: Entity[];
  sentiment: Sentiment;
  sentimentScore: number;
  tokens: string[];
  language: 'fr' | 'en';
  correctedText?: string;
  overallConfidence: number;
  isAmbiguous: boolean;
  ambiguityReasons?: string[];
}

// ==================== PATTERNS ML ====================

const INTENT_PATTERNS = {
  [IntentType.CREATE_LISTING]: {
    keywords: ['creer', 'créer', 'cree', 'créé', 'creé', 'publier', 'publie', 'publication', 'poster', 'post', 'poste', 'mettre', 'met', 'mise', 'vendre', 'vente', 'vend', 'vends', 'ajouter', 'ajout', 'ajoute', 'nouvelle', 'nouveau', 'new'],
    phrases: [
      /(?:je|j)\s*(?:veux|voudrais|aimerais|peux|peut|souhaite)\s*(?:creer|créer|publier|poster|mettre|faire)/i,
      /(?:creer|créer|publier|poster|ajouter|mettre)\s*(?:une|un)?\s*(?:annonce|anonce|article|articl)/i,
      /comment\s*(?:creer|créer|publier|poster|faire|mettre)/i,
      /(?:nouvelle|nouveau|new)\s*(?:annonce|anonce)/i,
      /(?:faire|mettre)\s*(?:une)?\s*(?:vente|annonce)/i
    ],
    negativeKeywords: ['recherch', 'trouv', 'voir mes', 'supprim', 'toutes', 'tous les', 'toutes les', 'mes annonces', 'annonces', 'articles'],
    weight: 1.0
  },
  
  [IntentType.SEARCH_LISTING]: {
    keywords: ['chercher', 'cherche', 'cherché', 'rechercher', 'recherche', 'rechércher', 'trouver', 'trouve', 'trouvé', 'voir', 'voit', 'regarde', 'regarder', 'consulter', 'consulte', 'acheter', 'achete', 'achat', 'achté', 'cherches', 'recherches', 'trouves', 'besoin', 'interesse', 'intéressé', 'disponible', 'disponibilité'],
    phrases: [
      /(?:je|j)\s*(?:cherche|recherche|veux|voudrais|besoin|interesse|intéressé)/i,
      /(?:ou|où)\s*(?:trouver|acheter|voir)/i,
      /(?:montre|affiche|voir)\s*.*\s*(?:annonce|article|offre)/i,
      /(?:as tu|a tu|y a t il)\s*(?:des?)?\s*(?:annonce|article)/i,
      /(?:cherche|recherche|besoin)\s*(?:de|d|un|une)/i,
      // Nouveaux patterns améliorés
      /^(recherche|cherche|trouve)\s*(.*)/i,
      /^(je veux|j'ai besoin)\s*(.*)/i,
      /^(dis moi|montre moi)\s*(.*)/i,
      /^(y a t il|est ce qu'il y a)\s*(.*)/i
    ],
    negativeKeywords: ['creer', 'créer', 'publier', 'vendre', 'supprim', 'mes annonces', 'mes articles'],
    weight: 0.9
  },
  
  [IntentType.VIEW_LISTINGS]: {
    keywords: ['mes annonces', 'mes articles', 'mes offres', 'mes publications', 'annonces', 'toutes les annonces', 'toutes annonces', 'toutes les publications'],
    phrases: [
      /^(voir|afficher|consulter|gérer)\s*(mes)?\s*(annonce|article|publication)/i,
      /^(mes|liste de mes)\s*(annonce|article|offre)/i,
      /^(toutes les|tous les)\s*(annonces|publications)/i,
      // Nouveaux patterns améliorés
      /^(mes\s+annonces|mes\s+publications)/i,
      /^(voir\s+mes\s+ventes|mes\s+ventes)/i
    ],
    negativeKeywords: ['chercher', 'rechercher', 'trouver', 'acheter'],
    weight: 1.2
  },
  
  [IntentType.EDIT_LISTING]: {
    keywords: ['modifier', 'éditer', 'changer', 'mettre à jour', 'corriger'],
    phrases: [
      /^(modifier|editer|changer|corriger)\s*(mon|ma|cette|l')?\s*(annonce|article)/i,
      /^(mettre à jour)\s*(mon|ma|cette)/i
    ],
    weight: 1.0
  },
  
  [IntentType.DELETE_LISTING]: {
    keywords: ['supprimer', 'effacer', 'retirer', 'enlever', 'désactiver'],
    phrases: [
      /^(supprimer|effacer|retirer|enlever)\s*(mon|ma|cette|l')?\s*(annonce|article)/i
    ],
    weight: 1.0
  },
  
  [IntentType.BUY]: {
    keywords: ['acheter', 'achat', 'commander', 'prendre'],
    phrases: [
      /^(je|j')?\s*(veux|voudrais)\s*(acheter|commander)/i,
      /^(acheter|commander|prendre)\s*(ce|cette|cet|ça)/i
    ],
    weight: 1.0
  },
  
  [IntentType.NEGOTIATE]: {
    keywords: ['négocier', 'négociation', 'proposer', 'offre', 'prix'],
    phrases: [
      /^(on peut|peut-on|puis-je)\s*(negocier|discuter)/i,
      /^(proposer|faire)\s*(une)?\s*offre/i,
      /est-ce\s*(que)?\s*(le)?\s*prix\s*(est)?\s*(negociable|fixe)/i
    ],
    weight: 1.0
  },
  
  [IntentType.VIEW_ORDERS]: {
    keywords: ['commandes', 'achats', 'mes achats', 'historique'],
    phrases: [
      /^(voir|afficher|consulter)\s*(mes)?\s*(commande|achat)/i,
      /^(mes|liste de mes)\s*(commande|achat)/i,
      /^historique\s*(des?)?\s*(commande|achat)/i
    ],
    weight: 1.0
  },
  
  [IntentType.SEND_MESSAGE]: {
    keywords: ['message', 'contacter', 'écrire', 'envoyer'],
    phrases: [
      /^(contacter|ecrire|envoyer\s*message)\s*(à|au|vendeur|acheteur)/i,
      /^(je\s*veux|puis-je)\s*(contacter|ecrire)/i
    ],
    weight: 1.0
  },
  
  [IntentType.VIEW_MESSAGES]: {
    keywords: ['messages', 'messagerie', 'conversations'],
    phrases: [
      /^(voir|afficher|consulter|ouvrir)\s*(mes)?\s*(message|conversation)/i,
      /^(mes|liste de mes)\s*(message|conversation)/i
    ],
    weight: 1.0
  },
  
  [IntentType.VIEW_FAVORITES]: {
    keywords: ['favoris', 'favoris', 'sauvegardés', 'likes'],
    phrases: [
      /^(voir|afficher|consulter)\s*(mes)?\s*favori/i,
      /^mes\s*favori/i
    ],
    weight: 1.0
  },
  
  [IntentType.VIEW_PROFILE]: {
    keywords: ['profil', 'profile', 'compte', 'mon compte', 'mes infos', 'mes informations'],
    phrases: [
      /^(voir|afficher|consulter)\s*(mon)?\s*(profil|compte|profile)/i,
      /^mon\s*(profil|compte|profile)/i,
      /^(mes\s*)?infos?/i,
      /^profile$/i
    ],
    weight: 1.0
  },
  
  [IntentType.VIEW_STATS]: {
    keywords: ['statistiques', 'stats', 'chiffres', 'données'],
    phrases: [
      /^(voir|afficher|consulter)\s*(mes)?\s*(statistique|stat|chiffre)/i
    ],
    weight: 1.0
  },
  
  [IntentType.GET_HELP]: {
    keywords: ['aide', 'help', 'comment', 'tutoriel', 'guide', 'study market', 'studymarket', 'platforme', 'plateforme'],
    phrases: [
      /^(aide|help|besoin d'aide)/i,
      /^comment\s*(faire|ça marche|utiliser)/i,
      /(c'est quoi|qu'est-ce que)\s*(study market|studymarket|cette platforme|cette plateforme|la platforme|la plateforme)/i,
      /(explique|expliquer|comprendre)\s*(study market|studymarket|cette platforme|cette plateforme)/i,
      /(c'est quoi|qu'est-ce que)\s*(study|market)/i,
      /^que\s*(est|fait|permet|peux|peux tu)\s*(study market|studymarket|cette|la|toi|me)/i,
      /^que\s*peux?(?:-tu)?\s*(tu|tu me)\s*dire\s*(de|sur|à propos)/
    ],
    weight: 1.2 // Augmenté pour prioritizer l'aide
  },
  
  [IntentType.CONTACT_SUPPORT]: {
    keywords: ['support', 'problème', 'bug', 'erreur', 'signaler', 'vous contacter', 'contacter admin', 'contacter équipe', 'contacter le support'],
    phrases: [
      /^(contacter|joindre)(\s*(le\s*)?)?support/i,
      /^(contacter|joindre)\s*(admin|équipe|vous)/i,
      /^(je\s*)?(veux|voudrais|souhaite|aimerais)\s*(vous\s*)?contacter/i,
      /comment\s*(vous\s*)?contacter/i,
      /^(j'ai|il y a)\s*(un)?\s*(problème|bug|erreur)/i,
      /^(signaler|reporter)\s*(un)?\s*(problème|bug)/i
    ],
    weight: 1.0
  },
  
  [IntentType.GREETING]: {
    keywords: ['bonjour', 'salut', 'hello', 'hey', 'coucou', 'bonsoir'],
    phrases: [
      /^(bonjour|salut|hello|hey|coucou|bonsoir)/i
    ],
    weight: 0.8
  },
  
  [IntentType.GOODBYE]: {
    keywords: ['au revoir', 'bye', 'adieu', 'à bientôt', 'salut'],
    phrases: [
      /^(au revoir|bye|adieu|à bientôt|merci et)/i
    ],
    weight: 0.8
  },
  
  [IntentType.THANKS]: {
    keywords: ['merci', 'thanks', 'thank you', 'cool', 'super', 'parfait'],
    phrases: [
      /^(merci|thanks|thank you|cool|super|parfait|génial)/i
    ],
    weight: 0.7
  }
};

const ENTITY_PATTERNS = {
  [EntityType.CATEGORY]: {
    values: {
      'books': ['livre', 'livres', 'manuel', 'manuels', 'bouquin', 'bd', 'roman', 'romans', 'harry potter'],
      'electronics': ['electronique', 'électronique', 'electroniqu', 'telephone', 'téléphone', 'phone', 'tel', 'laptop', 'ordinateur', 'ordi', 'pc', 'tablette', 'tablet', 'iphone', 'ipad', 'macbook', 'samsung', 'console', 'playstation', 'xbox', 'nintendo', 'chargeur', 'air pod', 'airpod', 'écouteurs'],
      'clothing': ['vetement', 'vêtement', 'vêtements', 'vetements', 'veste', 'pantalon', 'pull', 'chemise', 'robe', 'jupe', 'chaussure', 'chaussures', 'habit', 'habits', 'fringue', 'fringues'],
      'furniture': ['meuble', 'meubles', 'mobilier', 'mobiliers', 'deco', 'déco', 'décoration', 'decoration', 'lampe', 'chaise', 'table', 'bureau', 'lit', 'etagere', 'étagère', 'étagères'],
      'sports': ['sport', 'sports', 'fitness', 'velo', 'vélo', 'raquette', 'ballon', 'basket', 'bicyclette'],
      'housing': ['logement', 'logements', 'chambre', 'studio', 'appartement', 'appart', 'colocation', 'coloc', 'location', 'sous logement'],
      'services': ['service', 'services', 'cours', 'aide', 'assistance', 'soutien']
    }
  },
  
  [EntityType.PRICE]: {
    regex: [
      /(\d+)\s*€/i,
      /(\d+)\s*euros?/i,
      /(\d+)\s*eur/i,
      /€\s*(\d+)/i,
      /prix:?\s*(\d+)/i,
      /(\d+)\s*(balles?|sacs?)/i
    ],
    normalizer: (match: string) => {
      const num = match.match(/\d+/)?.[0];
      return num ? parseInt(num) : null;
    }
  },
  
  [EntityType.LOCATION]: {
    regex: [
      /à\s+([A-Z][a-z]+(?:-[A-Z][a-z]+)?)/,
      /sur\s+([A-Z][a-z]+)/,
      /près\s+de\s+([A-Z][a-z]+)/
    ],
    common: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg']
  },
  
  [EntityType.CONDITION]: {
    values: {
      'new': ['neuf', 'neuve', 'nouveau', 'nouvelle', 'jamais utilise', 'jamais utilisé', 'jamais servi'],
      'like-new': ['comme neuf', 'excellent etat', 'excellent état', 'parfait etat', 'parfait état', 'quasi neuf'],
      'good': ['bon etat', 'bon état', 'bonne condition', 'correct'],
      'used': ['usage', 'usagé', 'utilise', 'utilisé', 'occasion', 'd occasion', "d'occasion"]
    }
  },
  
  [EntityType.DATE]: {
    regex: [
      /aujourd'hui/i,
      /demain/i,
      /hier/i,
      /cette\s+semaine/i,
      /ce\s+mois/i,
      /(\d{1,2})[\/\-](\d{1,2})/,
      /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i
    ],
    normalizer: (match: string) => {
      const now = new Date();
      if (/aujourd'hui/i.test(match)) return now;
      if (/demain/i.test(match)) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      }
      return match;
    }
  },
  
  [EntityType.REFERENCE]: {
    keywords: ['ce', 'cette', 'cet', 'ça', 'celui', 'celle', 'dernier', 'dernière', 'précédent']
  }
};

const SPELL_CORRECTIONS: Record<string, string> = {
  'bonjur': 'bonjour',
  'anonce': 'annonce',
  'recherce': 'recherche',
  'cherche': 'cherche',
  'comman': 'comment',
  'publié': 'publier',
  'crée': 'créer',
  'crer': 'créer',
  'creer': 'créer',
  'vendre': 'vendre',
  'achté': 'acheter',
  'électronique': 'electronique',
  'éléctronique': 'electronique',
  'mobilier': 'mobilier',
  'mobillier': 'mobilier',
  'logement': 'logement',
  'logemment': 'logement'
};

// ==================== NLP ENGINE CLASS ====================

export class NLPEngine {
  private stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou',
    'est', 'sont', 'a', 'ont', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
    'ce', 'cet', 'cette', 'ces', 'qui', 'que', 'quoi', 'dont', 'où'
  ]);
  
  /**
   * Analyse complète d'un message utilisateur
   */
  public analyze(message: string, context?: any): NLPResult {
    // Preprocessing avec normalisation agressive
    const corrected = this.spellCheck(message);
    const normalized = aggressiveNormalize(corrected);
    const tokens = this.tokenize(normalized);
    
    if (corrected !== message) {
      console.log(`✨ Spell correction: "${message}" → "${corrected}"`);
    }
    
    // Intent detection (multi-label)
    const intents = this.detectIntents(normalized, tokens, context);
    
    // Entity extraction
    const entities = this.extractEntities(message, normalized, tokens);
    
    // Sentiment analysis
    const { sentiment, score } = this.analyzeSentiment(normalized, tokens);
    
    // Language detection
    const language = this.detectLanguage(tokens);
    
    // Ambiguity detection
    const { isAmbiguous, reasons } = this.detectAmbiguity(intents, entities);
    
    // Overall confidence
    const overallConfidence = this.calculateOverallConfidence(intents, entities);
    
    return {
      intents,
      entities,
      sentiment,
      sentimentScore: score,
      tokens,
      language,
      correctedText: corrected !== message ? corrected : undefined,
      overallConfidence,
      isAmbiguous,
      ambiguityReasons: reasons
    };
  }
  
  /**
   * Tokenization intelligente
   */
  private tokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .map(token => token.replace(/[^\w]/g, ''))
      .filter(token => token.length > 0 && !this.stopWords.has(token));
  }
  
  /**
   * Correction orthographique basique
   */
  private spellCheck(text: string): string {
    let corrected = text;
    for (const [wrong, right] of Object.entries(SPELL_CORRECTIONS)) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    }
    return corrected;
  }
  
  /**
   * Détection d'intentions (multi-label avec ML)
   */
  private detectIntents(normalized: string, tokens: string[], context?: any): Intent[] {
    const scores: Array<{ type: IntentType; score: number; metadata?: any }> = [];
    
    console.log(`🔍 Detecting intents for normalized: "${normalized}", tokens:`, tokens);
    
    for (const [intentType, pattern] of Object.entries(INTENT_PATTERNS)) {
      let score = 0;
      const metadata: any = {};
      
      // 1. Keyword matching avec TF-IDF simplifié (normaliser aussi les keywords)
      const keywordMatches = pattern.keywords.filter(kw => {
        const normalizedKeyword = aggressiveNormalize(kw);
        // Exact match
        if (normalized.includes(normalizedKeyword)) return true;
        // Fuzzy match avec Levenshtein (seulement mots > 5 caractères, strict)
        return tokens.some(t => {
          if (t.length < 5 || normalizedKeyword.length < 5) return false;
          const distance = levenshteinDistance(t, normalizedKeyword);
          const maxDistance = normalizedKeyword.length <= 6 ? 1 : 2;
          return distance <= maxDistance && distance / normalizedKeyword.length < 0.4;
        });
      });
      score += keywordMatches.length * 0.4; // Augmenté de 0.35 à 0.4
      
      // 2. Phrase pattern matching (plus fort)
      for (const regex of pattern.phrases) {
        if (regex.test(normalized)) {
          score += 0.6; // Augmenté de 0.5 à 0.6
          metadata.patternMatch = true;
          break;
        }
      }
      
      // 3. Negative keywords (pénalité) - normaliser aussi
      if ('negativeKeywords' in pattern && pattern.negativeKeywords) {
        const hasNegative = pattern.negativeKeywords.some((nk: string) => {
          const normalizedNK = aggressiveNormalize(nk);
          return normalized.includes(normalizedNK);
        });
        if (hasNegative) score *= 0.6; // Réduit de 0.3 à 0.6 (moins pénalisant)
      }
      
      // 4. Context boost
      if (context) {
        if (context.currentPage && this.isRelevantToPage(intentType as IntentType, context.currentPage)) {
          score *= 1.5; // Augmenté de 1.3 à 1.5
          metadata.contextBoost = true;
        }
        
        // Boost pour les réponses attendues
        if (context.expectingResponse && this.isExpectedIntent(intentType as IntentType, context.expectedIntent)) {
          score *= 2.0; // Double le score pour les réponses attendues
          metadata.expectedResponse = true;
        }
      }
      
      // 5. Apply weight
      score *= pattern.weight;
      
      // Seuil de détection de base
      if (score > 0.25) {
        scores.push({ 
          type: intentType as IntentType, 
          score: Math.min(score, 1.0),
          metadata 
        });
      }
    }
    
    // Sort by score and keep top intents
    scores.sort((a, b) => b.score - a.score);
    
    // Debug logging
    if (scores.length > 0 && scores[0].score > 0) {
      console.log(`🎯 Intent detection for "${normalized}":`, scores.slice(0, 3).map(s => `${s.type} (${s.score.toFixed(2)})`));
    }
    
    // Return top intents above 0.25, but only if gap is significant
    let topIntents = scores
      .filter(s => s.score > 0.25)
      .slice(0, 3)
      .map(s => ({
        type: s.type,
        confidence: s.score,
        metadata: s.metadata
      }));
    
    // Gap detection: if multiple intents close in score, keep only best one
    if (topIntents.length > 1) {
      const bestScore = topIntents[0].confidence;
      const secondBestScore = topIntents[1].confidence;
      const gap = bestScore - secondBestScore;
      
      if (gap < 0.15) {
        // Scores too close - keep only the best
        topIntents = [topIntents[0]];
        console.log(`✂️ Keeping only best intent: ${topIntents[0].type} (gap: ${gap.toFixed(2)})`);
      }
    }
    
    // Fallback to UNKNOWN if no intent detected
    if (topIntents.length === 0) {
      console.log(`⚠️ No intent above 0.25 for "${normalized}", using UNKNOWN`);
      topIntents.push({
        type: IntentType.UNKNOWN,
        confidence: 0.1,
        metadata: { fallback: true }
      });
    }
    
    return topIntents;
  }
  
  /**
   * Extraction d'entités avec NER
   */
  private extractEntities(original: string, normalized: string, tokens: string[]): Entity[] {
    const entities: Entity[] = [];
    
    console.log(`🔍 Extracting entities from normalized: "${normalized}"`);
    
    // Category extraction with normalization (avec fuzzy matching)
    for (const [category, keywords] of Object.entries(ENTITY_PATTERNS[EntityType.CATEGORY].values)) {
      for (const keyword of keywords) {
        const normalizedKeyword = aggressiveNormalize(keyword);
        
        // Exact match
        const exactIndex = normalized.indexOf(normalizedKeyword);
        if (exactIndex !== -1) {
          console.log(`✅ Category exact match: "${keyword}" → ${category}`);
          entities.push({
            type: EntityType.CATEGORY,
            value: keyword,
            normalized: category,
            confidence: 0.95,
            position: { start: exactIndex, end: exactIndex + normalizedKeyword.length }
          });
          break; // Only one category per match
        }
        
        // Fuzzy match sur les tokens (seulement pour mots > 5 caractères pour éviter faux positifs)
        const fuzzyToken = tokens.find(t => {
          if (t.length < 5 || normalizedKeyword.length < 5) return false; // Ignorer mots trop courts
          const distance = levenshteinDistance(t, normalizedKeyword);
          // Plus strict : max 1 distance pour mots courts, max 2 pour longs, mais avec ratio
          const maxDistance = normalizedKeyword.length <= 6 ? 1 : 2;
          return distance <= maxDistance && distance / normalizedKeyword.length < 0.4; // Max 40% de différence
        });
        
        if (fuzzyToken) {
          console.log(`✅ Category fuzzy match: "${fuzzyToken}" ≈ "${keyword}" → ${category}`);
          entities.push({
            type: EntityType.CATEGORY,
            value: fuzzyToken,
            normalized: category,
            confidence: 0.7, // Confidence réduite pour fuzzy match
            position: { start: 0, end: 0 } // Position approximative
          });
          break; // Only one category per match
        }
      }
    }
    
    if (entities.length === 0) {
      console.log(`❌ No category entities found for "${normalized}"`);
    }
    
    // Price extraction
    for (const regex of ENTITY_PATTERNS[EntityType.PRICE].regex) {
      const matches = original.matchAll(new RegExp(regex, 'g'));
      for (const match of matches) {
        const value = match[0];
        const normalized = ENTITY_PATTERNS[EntityType.PRICE].normalizer(value);
        if (normalized) {
          entities.push({
            type: EntityType.PRICE,
            value,
            normalized,
            confidence: 0.95,
            position: { start: match.index!, end: match.index! + value.length }
          });
        }
      }
    }
    
    // NUMBER extraction (for standalone numbers that might be prices in context)
    const numberMatches = original.matchAll(/\b(\d+)\b/g);
    for (const match of numberMatches) {
      const value = match[1];
      const num = parseInt(value);
      // Only extract numbers that could be prices (10-10000)
      if (num >= 10 && num <= 10000) {
        console.log(`✅ Number extracted: "${value}" → ${num}`);
        entities.push({
          type: EntityType.NUMBER,
          value,
          normalized: num,
          confidence: 0.6, // Lower confidence for numbers without context
          position: { start: match.index!, end: match.index! + value.length }
        });
      }
    }
    
    // Location extraction
    for (const regex of ENTITY_PATTERNS[EntityType.LOCATION].regex) {
      const match = original.match(regex);
      if (match && match[1]) {
        entities.push({
          type: EntityType.LOCATION,
          value: match[1],
          normalized: match[1],
          confidence: 0.8,
          position: { start: match.index!, end: match.index! + match[0].length }
        });
      }
    }
    
    // Condition extraction with normalization
    for (const [condition, keywords] of Object.entries(ENTITY_PATTERNS[EntityType.CONDITION].values)) {
      for (const keyword of keywords) {
        const normalizedKeyword = aggressiveNormalize(keyword);
        if (normalized.includes(normalizedKeyword)) {
          const index = normalized.indexOf(normalizedKeyword);
          entities.push({
            type: EntityType.CONDITION,
            value: keyword,
            normalized: condition,
            confidence: 0.85,
            position: { start: index, end: index + normalizedKeyword.length }
          });
          break; // Only one condition per match
        }
      }
    }
    
    // Date extraction
    for (const regex of ENTITY_PATTERNS[EntityType.DATE].regex) {
      const match = original.match(regex);
      if (match) {
        const value = match[0];
        const normalized = ENTITY_PATTERNS[EntityType.DATE].normalizer(value);
        entities.push({
          type: EntityType.DATE,
          value,
          normalized,
          confidence: 0.9,
          position: { start: match.index!, end: match.index! + value.length }
        });
      }
    }
    
    // Reference detection with word boundaries
    const hasReference = ENTITY_PATTERNS[EntityType.REFERENCE].keywords.some(kw => {
      const normalizedKw = aggressiveNormalize(kw);
      // Use word boundary to avoid matching substrings
      const regex = new RegExp(`\\b${normalizedKw}\\b`, 'i');
      return regex.test(normalized);
    });
    if (hasReference) {
      entities.push({
        type: EntityType.REFERENCE,
        value: 'reference',
        confidence: 0.7,
        position: { start: 0, end: 0 }
      });
    }
    
    return entities;
  }
  
  /**
   * Analyse de sentiment avancée
   */
  private analyzeSentiment(normalized: string, tokens: string[]): { sentiment: Sentiment; score: number } {
    const positiveWords = ['merci', 'super', 'génial', 'parfait', 'excellent', 'cool', 'top', 'bien', 'content'];
    const negativeWords = ['problème', 'bug', 'erreur', 'nul', 'mauvais', 'pas', 'jamais', 'rien'];
    const urgentWords = ['urgent', 'vite', 'rapidement', 'immédiatement', 'maintenant', 'asap'];
    const frustratedWords = ['pourquoi', 'comment', 'toujours', 'encore', 'comprends pas', 'marche pas'];
    
    let score = 0;
    let urgentCount = 0;
    let frustratedCount = 0;
    
    for (const token of tokens) {
      if (positiveWords.includes(token)) score += 0.3;
      if (negativeWords.includes(token)) score -= 0.3;
      if (urgentWords.includes(token)) urgentCount++;
      if (frustratedWords.includes(token)) frustratedCount++;
    }
    
    // Normalize score
    score = Math.max(-1, Math.min(1, score));
    
    // Determine sentiment
    let sentiment: Sentiment;
    if (urgentCount >= 2) sentiment = Sentiment.URGENT;
    else if (frustratedCount >= 2) sentiment = Sentiment.FRUSTRATED;
    else if (score > 0.2) sentiment = Sentiment.POSITIVE;
    else if (score < -0.2) sentiment = Sentiment.NEGATIVE;
    else sentiment = Sentiment.NEUTRAL;
    
    return { sentiment, score };
  }
  
  /**
   * Détection de langue
   */
  private detectLanguage(tokens: string[]): 'fr' | 'en' {
    const frenchWords = ['le', 'la', 'les', 'un', 'une', 'et', 'pour', 'dans', 'avec'];
    const englishWords = ['the', 'a', 'an', 'and', 'for', 'in', 'with', 'to'];
    
    const frScore = tokens.filter(t => frenchWords.includes(t)).length;
    const enScore = tokens.filter(t => englishWords.includes(t)).length;
    
    return frScore >= enScore ? 'fr' : 'en';
  }
  
  /**
   * Détection d'ambiguïté
   */
  private detectAmbiguity(intents: Intent[], entities: Entity[]): { isAmbiguous: boolean; reasons?: string[] } {
    const reasons: string[] = [];
    
    // Multiple intents with similar confidence
    if (intents.length > 1) {
      const [first, second] = intents;
      if (Math.abs(first.confidence - second.confidence) < 0.2) {
        reasons.push('Plusieurs intentions possibles détectées');
      }
    }
    
    // Conflicting intents
    const hasCreate = intents.some(i => i.type === IntentType.CREATE_LISTING);
    const hasSearch = intents.some(i => i.type === IntentType.SEARCH_LISTING);
    if (hasCreate && hasSearch) {
      reasons.push('Intention ambiguë entre créer et rechercher');
    }
    
    // Missing critical entities
    const hasPrice = entities.some(e => e.type === EntityType.PRICE);
    const hasCategory = entities.some(e => e.type === EntityType.CATEGORY);
    const needsEntities = intents.some(i => 
      [IntentType.CREATE_LISTING, IntentType.SEARCH_LISTING].includes(i.type)
    );
    if (needsEntities && !hasCategory) {
      reasons.push('Catégorie manquante pour compléter l\'action');
    }
    
    return {
      isAmbiguous: reasons.length > 0,
      reasons: reasons.length > 0 ? reasons : undefined
    };
  }
  
  /**
   * Calcul de confiance globale
   */
  private calculateOverallConfidence(intents: Intent[], entities: Entity[]): number {
    if (intents.length === 0) return 0;
    
    const intentConfidence = intents[0].confidence;
    const entityBonus = Math.min(entities.length * 0.1, 0.3);
    
    return Math.min(intentConfidence + entityBonus, 1.0);
  }
  
  /**
   * Vérifie si un intent est pertinent pour une page
   */
  private isRelevantToPage(intent: IntentType, page: string): boolean {
    const pageIntents: Record<string, IntentType[]> = {
      '/listings': [IntentType.VIEW_LISTINGS, IntentType.CREATE_LISTING, IntentType.SEARCH_LISTING],
      '/create': [IntentType.CREATE_LISTING],
      '/orders': [IntentType.VIEW_ORDERS],
      '/messages': [IntentType.VIEW_MESSAGES, IntentType.SEND_MESSAGE],
      '/favorites': [IntentType.VIEW_FAVORITES],
      '/profile': [IntentType.VIEW_PROFILE, IntentType.EDIT_PROFILE]
    };
    
    return pageIntents[page]?.includes(intent) || false;
  }
  
  /**
   * Vérifie si l'intention est attendue dans le contexte
   */
  private isExpectedIntent(currentIntent: IntentType, expectedIntent?: IntentType): boolean {
    if (!expectedIntent) return false;
    
    const expectedMap: Partial<Record<IntentType, IntentType[]>> = {
      [IntentType.CREATE_LISTING]: [IntentType.CREATE_LISTING],
      [IntentType.SEARCH_LISTING]: [IntentType.SEARCH_LISTING],
      [IntentType.UNKNOWN]: [IntentType.CREATE_LISTING, IntentType.SEARCH_LISTING] // Pour les réponses aux questions
    };
    
    return expectedMap[expectedIntent]?.includes(currentIntent) || false;
  }
}

// ==================== SINGLETON EXPORT ====================

export const nlpEngine = new NLPEngine();

