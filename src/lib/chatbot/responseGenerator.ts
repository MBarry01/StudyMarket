/**
 * 💬 Response Generator Expert - Génération Réponses Naturelles
 * Générateur de réponses intelligentes avec personnalité adaptative
 */

import { IntentType, Sentiment, NLPResult } from './nlpEngine';
import { ContextEnrichment, UserContext } from './contextManager';
import { ActionResult } from './actionDispatcher';
import { llmService } from './llmService';

// ==================== CATEGORIES ====================

const CATEGORIES = [
  { value: 'electronics', label: '💻 Électronique' },
  { value: 'books', label: '📚 Livres & Cours' },
  { value: 'furniture', label: '🪑 Mobilier' },
  { value: 'clothing', label: '👕 Vêtements' },
  { value: 'services', label: '🔧 Services' },
  { value: 'housing', label: '🏠 Logement' },
  { value: 'jobs', label: '💼 Jobs & Stages' },
  { value: 'events', label: '🎉 Événements' },
  { value: 'lost-found', label: '🔍 Objets Perdus' },
  { value: 'donations', label: '🎁 Dons' },
  { value: 'exchange', label: '🔄 Échange' }
];

// ==================== TYPES ====================

export interface ResponseOptions {
  nlpResult: NLPResult;
  context: ContextEnrichment;
  userContext: UserContext;
  actionResult?: ActionResult;
  userMessage?: string;
}

export interface BotResponse {
  text: string;
  suggestions?: string[];
  components?: ResponseComponent[];
  tone: 'friendly' | 'professional' | 'empathetic' | 'enthusiastic' | 'apologetic';
  requiresAction?: boolean;
}

export interface ResponseComponent {
  type: 'preview' | 'quick_actions' | 'stats' | 'form' | 'carousel';
  data: any;
}

// ==================== RESPONSE TEMPLATES ====================

const GREETING_RESPONSES = [
  "Hey ! 👋 Comment puis-je t'aider ?",
  "Salut ! 😊 Que puis-je faire pour toi ?",
  "Hello ! Ravi de te revoir ! En quoi puis-je t'aider ?",
  "Coucou ! 🌟 Dis-moi tout !",
  "Bonjour ! Je suis là pour t'aider. Que cherches-tu ?"
];

const GOODBYE_RESPONSES = [
  "À bientôt ! 👋",
  "Bonne journée ! N'hésite pas à revenir !",
  "Au revoir ! Je suis toujours là si tu as besoin ! 😊",
  "À plus ! 🌟",
  "Bye ! Reviens quand tu veux !"
];

const THANKS_RESPONSES = [
  "De rien ! Content d'avoir pu aider ! 😊",
  "Avec plaisir ! 🌟",
  "Pas de souci ! Je suis là pour ça !",
  "Ravi d'avoir pu t'aider ! 💙",
  "Toujours un plaisir ! N'hésite pas pour autre chose !"
];

const CLARIFICATION_PROMPTS = {
  [IntentType.CREATE_LISTING]: [
    "Pour créer ton annonce, j'ai besoin de savoir :",
    "Super ! Dis-m'en plus sur ce que tu veux vendre :",
    "Ok ! Quelques infos pour créer ton annonce :"
  ],
  [IntentType.SEARCH_LISTING]: [
    "Précise ta recherche :",
    "Qu'est-ce que tu cherches exactement ?",
    "Pour t'aider à trouver, dis-moi :"
  ],
  [IntentType.EDIT_LISTING]: [
    "Quelle annonce veux-tu modifier ?",
    "De quelle annonce parles-tu ?",
    "Précise-moi l'annonce à modifier :"
  ]
};

const ENCOURAGEMENTS = [
  "Tu vas y arriver ! 💪",
  "Presque fini ! 🎉",
  "Super travail ! Continue !",
  "C'est bien parti ! ✨",
  "Excellent ! 🌟"
];

// ==================== RESPONSE GENERATOR CLASS ====================

export class ResponseGenerator {
  /**
   * Generate a complete bot response
   */
  public generate(options: ResponseOptions): BotResponse {
    const { nlpResult, context, userContext, actionResult } = options;
    
    // Determine tone based on sentiment and situation
    const tone = this.determineTone(nlpResult, userContext);
    
    // Handle action results first
    if (actionResult) {
      return this.generateActionResponse(actionResult, tone, context, userContext);
    }
    
    // Handle greetings
    if (context.currentIntent === IntentType.GREETING) {
      return this.generateGreeting(userContext, tone);
    }
    
    // Handle goodbyes
    if (context.currentIntent === IntentType.GOODBYE) {
      return this.generateGoodbye(userContext, tone);
    }
    
    // Handle thanks
    if (context.currentIntent === IntentType.THANKS) {
      return this.generateThanks(tone);
    }
    
    // Handle help requests
    if (context.currentIntent === IntentType.GET_HELP) {
      return this.generateHelp(context, tone);
    }
    
    // Handle ambiguous queries (skip if context was recovered)
    if ((nlpResult.isAmbiguous || nlpResult.overallConfidence < 0.5) && !context.wasRecovered) {
      return this.generateClarification(context, nlpResult, tone);
    }
    
    // Handle missing information
    if (context.missingInformation.length > 0) {
      return this.generateMissingInfoPrompt(context, tone);
    }
    
    // Generate intent-specific response
    return this.generateIntentResponse(context, userContext, tone);
  }

  /**
   * Generate bot response with optional LLM fallback
   */
  public async generateAsync(options: ResponseOptions): Promise<BotResponse> {
    const { nlpResult, context, userContext, actionResult, userMessage } = options;
    
    // Try normal generation first
    let response = this.generate(options);
    
    // If LLM is enabled and confidence is low, try LLM fallback
    if (llmService.shouldUseLLM(nlpResult.overallConfidence, context.currentIntent)) {
      console.log('🤖 Attempting LLM fallback for low confidence');
      const llmResponse = await llmService.generateResponse(userMessage || '', {
        intent: context.currentIntent,
        entities: nlpResult.entities,
        conversationHistory: userContext?.conversationHistory,
        platformContext: { currentPage: context.conversationState }
      });
      
      // Use LLM response if available
      if (llmResponse) {
        console.log('✨ Using LLM response');
        return {
          text: llmResponse.response,
          suggestions: response.suggestions,
          tone: response.tone,
          requiresAction: false
        };
      }
    }
    
    return response;
  }

  /**
   * Generate response with action result
   */
  private generateActionResponse(
    actionResult: ActionResult,
    tone: string,
    context: ContextEnrichment,
    userContext: UserContext
  ): BotResponse {
    // Use missing info suggestions if applicable, otherwise smart suggestions
    let suggestions;
    if (context.missingInformation.length > 0) {
      suggestions = this.generateMissingInfoSuggestions(context.missingInformation);
    } else {
      suggestions = this.generateSmartSuggestions(context, userContext);
    }
    
    if (!actionResult.success) {
      return {
        text: this.addPersonality(actionResult.message, 'apologetic'),
        suggestions,
        tone: 'apologetic' as any,
        requiresAction: true
      };
    }
    
    // Success - add components based on data
    const components = this.generateComponents(actionResult.data);
    
    return {
      text: this.addPersonality(actionResult.message, tone as any),
      suggestions,
      components,
      tone: tone as any,
      requiresAction: false
    };
  }

  /**
   * Generate greeting with personalization
   */
  private generateGreeting(userContext: UserContext, tone: string): BotResponse {
    const greeting = this.pickRandom(GREETING_RESPONSES);
    const name = userContext.userProfile.name;
    
    let text = greeting;
    if (name) {
      text = text.replace(/Hey|Salut|Hello|Coucou|Bonjour/, `$& ${name}`);
    }
    
    const suggestions = [
      '🔍 Rechercher un article',
      '➕ Créer une annonce',
      '💬 Voir mes messages',
      '📋 Mes annonces'
    ];
    
    return { text, suggestions, tone: 'friendly' as any };
  }

  /**
   * Generate goodbye
   */
  private generateGoodbye(userContext: UserContext, tone: string): BotResponse {
    const goodbye = this.pickRandom(GOODBYE_RESPONSES);
    const name = userContext.userProfile.name;
    
    let text = goodbye;
    if (name) {
      text = `${text} ${name} !`;
    }
    
    return { text, tone: 'friendly' as any };
  }

  /**
   * Generate thanks response
   */
  private generateThanks(tone: string): BotResponse {
    const thanks = this.pickRandom(THANKS_RESPONSES);
    return { text: thanks, suggestions: ['Autre chose ?', "Retour à l'accueil"], tone: 'friendly' as any };
  }

  /**
   * Generate help response
   */
  private generateHelp(context: ContextEnrichment, tone: string): BotResponse {
    const helpText = `StudyMarket est une plateforme de marketplace étudiante ! 🎓

📍 StudyMarket, c'est quoi ?
Une place de marché où les étudiants peuvent acheter, vendre et échanger des biens et services entre eux. Pensez aux livres, matériel électronique, meubles, vêtements, cours particuliers, logements et plus encore !

🤖 Ce que je peux faire pour toi :

📝 Gestion d'annonces
• "Créer une annonce"
• "Voir mes annonces"
• "Modifier/supprimer mon annonce"

🔍 Recherche
• "Chercher [article]"
• "Montrer des livres"
• "Articles à moins de 50€"

💬 Messages & Commandes
• "Voir mes messages"
• "Mes commandes"
• "Contacter le vendeur"

⭐ Autres services
• "Mes favoris"
• "Mon profil"
• "Statistiques"

Dis-moi ce dont tu as besoin ! 😊`;

    const suggestions = [
      '🔍 Rechercher un article',
      '➕ Créer une annonce',
      '📋 Voir mes annonces',
      '💬 Mes messages'
    ];
    
    return { text: helpText, suggestions, tone: 'helpful' as any };
  }

  /**
   * Generate clarification request
   */
  private generateClarification(context: ContextEnrichment, nlpResult: NLPResult, tone: string): BotResponse {
    let text = "Je ne suis pas sûr de bien comprendre. ";
    
    if (nlpResult.isAmbiguous && nlpResult.ambiguityReasons) {
      text += "Peux-tu préciser ? ";
    }
    
    // Offer alternatives based on top intents
    const topIntents = nlpResult.intents.slice(0, 2);
    if (topIntents.length > 1) {
      text += `\n\nTu veux :\n`;
      text += topIntents.map((intent, i) => `${i + 1}. ${this.getIntentLabel(intent.type)}`).join('\n');
    }
    
    const suggestions = context.suggestedActions.map(a => a.label);
    // Add support contact suggestion if not already present
    if (!suggestions.some(s => s.toLowerCase().includes('contact') || s.toLowerCase().includes('support'))) {
      suggestions.push('💬 Contacter le support');
    }
    
    return {
      text,
      suggestions,
      tone: 'empathetic' as any,
      requiresAction: true
    };
  }

  /**
   * Generate missing info prompt
   */
  private generateMissingInfoPrompt(context: ContextEnrichment, tone: string): BotResponse {
    const intent = context.currentIntent;
    const missing = context.missingInformation;
    const prompts = CLARIFICATION_PROMPTS[intent] || ["Pour continuer, j'ai besoin de quelques infos :"];
    
    let text = this.pickRandom(prompts);
    
    // Add specific missing info questions
    if (missing.includes('category')) {
      text += "\n• Quelle catégorie ? 🏷️";
    }
    if (missing.includes('price')) {
      text += "\n• Quel prix ? 💰";
    }
    if (missing.includes('product')) {
      text += "\n• Quel article ? 📦";
    }
    
    const suggestions = this.generateMissingInfoSuggestions(missing);
    
    return { text, suggestions, tone: 'friendly' as any, requiresAction: true };
  }

  /**
   * Generate intent-specific response
   */
  private generateIntentResponse(context: ContextEnrichment, userContext: UserContext, tone: string): BotResponse {
    const intent = context.currentIntent;
    
    // Get base message
    let text = this.getIntentMessage(intent, userContext);
    
    // Add encouragement if in workflow
    if (userContext.activeWorkflow) {
      text += `\n\n${this.pickRandom(ENCOURAGEMENTS)}`;
    }
    
    // Generate suggestions
    const suggestions = this.generateSmartSuggestions(context, userContext);
    
    return {
      text: this.addPersonality(text, tone as any),
      suggestions,
      tone: tone as any
    };
  }

  /**
   * Determine response tone
   */
  private determineTone(nlpResult: NLPResult, userContext: UserContext): string {
    // Frustrated user → empathetic
    if (nlpResult.sentiment === Sentiment.FRUSTRATED) {
      return 'empathetic';
    }
    
    // Urgent request → professional
    if (nlpResult.sentiment === Sentiment.URGENT) {
      return 'professional';
    }
    
    // Positive sentiment → enthusiastic
    if (nlpResult.sentiment === Sentiment.POSITIVE) {
      return 'enthusiastic';
    }
    
    // Negative sentiment → apologetic
    if (nlpResult.sentiment === Sentiment.NEGATIVE) {
      return 'apologetic';
    }
    
    // Default → friendly
    return 'friendly';
  }

  /**
   * Add personality to text
   */
  private addPersonality(text: string, tone: 'friendly' | 'professional' | 'empathetic' | 'enthusiastic' | 'apologetic'): string {
    // For now, keep it simple and don't modify text too much
    return text;
  }

  /**
   * Generate smart contextual suggestions
   */
  private generateSmartSuggestions(context: ContextEnrichment, userContext: UserContext): string[] {
    const suggestions: string[] = [];
    
    // Intent-specific suggestions
    switch (context.currentIntent) {
      case IntentType.SEARCH_LISTING:
        // Add categories for search
        suggestions.push(...CATEGORIES.slice(0, 4).map(c => c.label));
        break;
        
      case IntentType.CREATE_LISTING:
        // Add categories for creation
        suggestions.push(...CATEGORIES.slice(0, 6).map(c => c.label));
        break;
        
      case IntentType.VIEW_LISTINGS:
      case IntentType.VIEW_FAVORITES:
        suggestions.push('🔍 Rechercher une annonce', '➕ Créer une annonce', '💬 Voir mes messages');
        break;
        
      default:
        // Add context-based actions
        context.suggestedActions.slice(0, 3).forEach(action => {
          suggestions.push(action.label);
        });
    }
    
    // Add workflow next steps
    if (userContext.activeWorkflow) {
      suggestions.push('▶️ Continuer');
      suggestions.push('❌ Annuler');
    }
    
    // Add common actions if not enough suggestions
    if (suggestions.length < 3) {
      const common = ['🔍 Rechercher', '➕ Créer une annonce', '💬 Messages', '📋 Mes annonces'];
      common.forEach(s => {
        if (suggestions.length < 4 && !suggestions.includes(s)) {
          suggestions.push(s);
        }
      });
    }
    
    return suggestions;
  }

  /**
   * Generate components for rich display
   */
  private generateComponents(data: any): ResponseComponent[] | undefined {
    if (!data) return undefined;
    
    const components: ResponseComponent[] = [];
    
    if (data.action === 'display_results' && data.results) {
      components.push({ type: 'carousel', data: { items: data.results, type: 'listing' } });
    }
    
    if (data.action === 'display_listings' && data.listings) {
      components.push({ type: 'preview', data: { items: data.listings, type: 'listing' } });
    }
    
    if (data.action === 'display_stats' && data.stats) {
      components.push({ type: 'stats', data: data.stats });
    }
    
    return components.length > 0 ? components : undefined;
  }

  /**
   * Generate suggestions for missing info
   */
  private generateMissingInfoSuggestions(missing: string[]): string[] {
    const suggestions: string[] = [];
    
    if (missing.includes('category')) {
      // Return first 6 categories as suggestions
      suggestions.push(...CATEGORIES.slice(0, 6).map(c => c.label));
    }
    if (missing.includes('price')) {
      suggestions.push('< 50€', '50-100€', '> 100€');
    }
    if (missing.includes('location')) {
      suggestions.push('📍 Paris', '📍 Lyon', '📍 Campus');
    }
    
    return suggestions;
  }

  /**
   * Get intent label
   */
  private getIntentLabel(intent: IntentType): string {
    const labels: Record<IntentType, string> = {
      [IntentType.CREATE_LISTING]: 'Créer une annonce',
      [IntentType.SEARCH_LISTING]: 'Rechercher',
      [IntentType.VIEW_LISTINGS]: 'Voir tes annonces',
      [IntentType.EDIT_LISTING]: 'Modifier une annonce',
      [IntentType.DELETE_LISTING]: 'Supprimer une annonce',
      [IntentType.BUY]: 'Acheter',
      [IntentType.SELL]: 'Vendre',
      [IntentType.NEGOTIATE]: 'Négocier',
      [IntentType.VIEW_ORDERS]: 'Voir les commandes',
      [IntentType.SEND_MESSAGE]: 'Envoyer un message',
      [IntentType.VIEW_MESSAGES]: 'Voir les messages',
      [IntentType.ADD_FAVORITE]: "Ajouter aux favoris",
      [IntentType.VIEW_FAVORITES]: "Voir les favoris",
      [IntentType.VIEW_PROFILE]: 'Voir le profil',
      [IntentType.EDIT_PROFILE]: 'Modifier le profil',
      [IntentType.VIEW_STATS]: 'Voir les stats',
      [IntentType.GET_HELP]: "Obtenir de l'aide",
      [IntentType.REPORT_ISSUE]: 'Signaler un problème',
      [IntentType.CONTACT_SUPPORT]: 'Contacter le support',
      [IntentType.NAVIGATE]: 'Naviguer',
      [IntentType.GET_INFO]: "Obtenir des infos",
      [IntentType.GREETING]: 'Dire bonjour',
      [IntentType.GOODBYE]: 'Dire au revoir',
      [IntentType.THANKS]: 'Remercier',
      [IntentType.UNKNOWN]: 'Autre chose'
    };
    
    return labels[intent] || 'Faire quelque chose';
  }

  /**
   * Get intent-specific message
   */
  private getIntentMessage(intent: IntentType, userContext: UserContext): string {
    const messages: Partial<Record<IntentType, string>> = {
      [IntentType.CREATE_LISTING]: "D'accord ! Je vais t'aider à créer ton annonce.",
      [IntentType.SEARCH_LISTING]: "Je lance la recherche...",
      [IntentType.VIEW_LISTINGS]: "Voici tes annonces !",
      [IntentType.VIEW_ORDERS]: "Chargement de tes commandes...",
      [IntentType.VIEW_MESSAGES]: "Voici tes conversations !",
      [IntentType.VIEW_FAVORITES]: "Tes favoris !",
      [IntentType.VIEW_PROFILE]: "Ton profil !"
    };
    
    return messages[intent] || "Compris ! Je m'en occupe.";
  }

  /**
   * Pick random item from array
   */
  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

// ==================== SINGLETON EXPORT ====================

export const responseGenerator = new ResponseGenerator();

