/**
 * 🧠 Context Manager Expert - Gestion Mémoire Avancée
 * Gestionnaire de contexte conversationnel et profil utilisateur
 */

import { NLPResult, IntentType, EntityType } from './nlpEngine';

// ==================== TYPES ====================

export interface ConversationTurn {
  id: string;
  timestamp: Date;
  userMessage: string;
  nlpResult: NLPResult;
  botResponse: string;
  actionsTaken?: Action[];
  userFeedback?: 'positive' | 'negative';
}

export interface Action {
  type: string;
  payload: any;
  success: boolean;
  timestamp: Date;
}

export interface UserContext {
  userId?: string;
  sessionId: string;
  
  // Conversation history
  conversationHistory: ConversationTurn[];
  
  // Current state
  currentPage?: string;
  currentListingId?: string;
  currentOrderId?: string;
  
  // User profile (learned over time)
  userProfile: {
    name?: string;
    preferredCategories: string[];
    priceRange?: { min: number; max: number };
    location?: string;
    interests: string[];
    behaviorPattern: 'buyer' | 'seller' | 'both' | 'browser';
  };
  
  // Active workflow
  activeWorkflow?: {
    type: 'create_listing' | 'search' | 'purchase';
    step: number;
    data: Record<string, any>;
    startedAt: Date;
  };
  
  // Temporary memory (for current conversation)
  temporaryMemory: {
    lastMentionedListing?: any;
    lastSearchQuery?: string;
    lastMentionedPrice?: number;
    lastMentionedCategory?: string;
    pendingClarifications?: string[];
  };
  
  // Sentiment tracking
  sentimentHistory: Array<{ sentiment: string; timestamp: Date }>;
  
  // Metrics
  metrics: {
    totalMessages: number;
    successfulActions: number;
    failedActions: number;
    averageConfidence: number;
    sessionStartTime: Date;
  };
}

export interface ContextEnrichment {
  currentIntent: IntentType;
  confidence: number;
  
  // References resolved
  resolvedReferences: Record<string, any>;
  
  // Missing information
  missingInformation: string[];
  
  // Suggested next actions
  suggestedActions: Array<{ action: string; label: string; priority: number }>;
  
  // Personalized recommendations
  recommendations: Array<{ type: string; item: any; reason: string; confidence: number }>;
  
  // Conversation state
  conversationState: 'starting' | 'ongoing' | 'clarifying' | 'completing' | 'ending';
  
  // Context recovery flag
  wasRecovered?: boolean;
}

// ==================== CONTEXT MANAGER CLASS ====================

export class ContextManager {
  private contexts: Map<string, UserContext> = new Map();
  private readonly MAX_HISTORY = 50;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  /**
   * Get or create context for a session
   */
  public getContext(sessionId: string, userId?: string): UserContext {
    let context = this.contexts.get(sessionId);
    
    if (!context) {
      context = this.createNewContext(sessionId, userId);
      this.contexts.set(sessionId, context);
    }
    
    // Clean old contexts periodically
    this.cleanOldContexts();
    
    return context;
  }

  /**
   * Add a conversation turn
   */
  public addTurn(
    sessionId: string,
    userMessage: string,
    nlpResult: NLPResult,
    botResponse: string,
    actions?: Action[]
  ): void {
    const context = this.getContext(sessionId);
    
    const turn: ConversationTurn = {
      id: this.generateId(),
      timestamp: new Date(),
      userMessage,
      nlpResult,
      botResponse,
      actionsTaken: actions
    };
    
    context.conversationHistory.push(turn);
    
    // Update metrics
    context.metrics.totalMessages++;
    if (actions) {
      const successful = actions.filter(a => a.success).length;
      const failed = actions.filter(a => !a.success).length;
      context.metrics.successfulActions += successful;
      context.metrics.failedActions += failed;
    }
    
    // Update average confidence
    const totalConfidence = context.conversationHistory.reduce(
      (sum, turn) => sum + turn.nlpResult.overallConfidence,
      0
    );
    context.metrics.averageConfidence = totalConfidence / context.conversationHistory.length;
    
    // Update sentiment history
    context.sentimentHistory.push({
      sentiment: nlpResult.sentiment,
      timestamp: new Date()
    });
    
    // Learn from conversation
    this.learnFromTurn(context, turn);
    
    // Limit history size
    if (context.conversationHistory.length > this.MAX_HISTORY) {
      context.conversationHistory = context.conversationHistory.slice(-this.MAX_HISTORY);
    }
    
    // Update temporary memory
    this.updateTemporaryMemory(context, nlpResult);
  }

  /**
   * Enrich NLP result with contextual information
   */
  public enrichWithContext(
    sessionId: string,
    nlpResult: NLPResult,
    currentState?: { page?: string; listingId?: string }
  ): ContextEnrichment {
    const context = this.getContext(sessionId);
    
    // Update current state
    if (currentState?.page) context.currentPage = currentState.page;
    if (currentState?.listingId) context.currentListingId = currentState.listingId;
    
    let primaryIntent = nlpResult.intents[0]?.type || IntentType.UNKNOWN;
    let wasRecovered = false;
    
    // Context recovery: If UNKNOWN, recover from active workflow or conversation history
    if (primaryIntent === IntentType.UNKNOWN) {
      const hasCategory = nlpResult.entities.some(e => e.type === EntityType.CATEGORY);
      const hasPrice = nlpResult.entities.some(e => e.type === EntityType.PRICE);
      
      console.log(`🔍 Context recovery attempt: UNKNOWN with entities (category: ${hasCategory}, price: ${hasPrice}), history: ${context.conversationHistory.length}, workflow: ${context.activeWorkflow?.type || 'none'}`);
      
      // FIRST: Check active workflow (prioritaire)
      if (context.activeWorkflow) {
        console.log(`🔍 Checking active workflow: type=${context.activeWorkflow.type}`);
        const workflowAge = Date.now() - context.activeWorkflow.startedAt.getTime();
        
        if (workflowAge < 30000) { // 30 seconds timeout
          // If workflow active and entities found, recover
          if ((context.activeWorkflow.type === 'create_listing' && (hasCategory || hasPrice || nlpResult.entities.length === 0)) ||
              (context.activeWorkflow.type === 'search' && (hasCategory || nlpResult.entities.length === 0))) {
            primaryIntent = context.activeWorkflow.type === 'create_listing' ? IntentType.CREATE_LISTING : IntentType.SEARCH_LISTING;
            wasRecovered = true;
            console.log(`✅ Workflow recovery: UNKNOWN → ${primaryIntent} (workflow: ${context.activeWorkflow.type})`);
          } else {
            console.log(`❌ Workflow type ${context.activeWorkflow.type} doesn't match entities`);
          }
        } else {
          console.log(`⏱️ Workflow expired (${Math.round(workflowAge / 1000)}s old)`);
        }
      } else {
        console.log(`❌ No active workflow`);
      }
      
      // SECOND: Search backwards through history (max 2 turns, 30s timeout)
      if (!wasRecovered && context.conversationHistory.length > 0) {
        let foundIntent = false;
        const now = Date.now();
        
        // Look back up to 2 turns to find a valid intent
        for (let i = context.conversationHistory.length - 1; i >= 0 && i >= context.conversationHistory.length - 2 && !foundIntent; i--) {
          const turn = context.conversationHistory[i];
          const turnAge = now - turn.timestamp.getTime();
          
          if (turnAge > 30000) { // 30 seconds timeout
            console.log(`⏱️ Turn ${i} too old (${Math.round(turnAge / 1000)}s), skipping`);
            break;
          }
          
          const turnIntent = turn.nlpResult.intents[0]?.type;
          
          console.log(`🔍 Checking turn ${i}: intent=${turnIntent}`);
          
          // If we have entities matching the workflow, recover the intent
          if ((turnIntent === IntentType.CREATE_LISTING && (hasCategory || hasPrice)) ||
              (turnIntent === IntentType.SEARCH_LISTING && hasCategory)) {
            primaryIntent = turnIntent;
            wasRecovered = true;
            foundIntent = true;
            console.log(`✅ Context recovery: UNKNOWN → ${primaryIntent} (from turn ${i}, entities: ${nlpResult.entities.map(e => e.type).join(', ')})`);
            break;
          }
        }
        
        if (!foundIntent && !wasRecovered) {
          console.log(`❌ Context recovery failed: no matching intent in last 2 turns`);
        }
      } else if (!wasRecovered) {
        console.log(`❌ No conversation history available`);
      }
      
      // Log skip if no recovery
      if (!wasRecovered) {
        console.log(`⏭️ Skipping context recovery: no eligible context found`);
      }
    }
    
    return {
      currentIntent: primaryIntent,
      confidence: nlpResult.overallConfidence,
      resolvedReferences: this.resolveReferences(context, nlpResult),
      missingInformation: this.detectMissingInformation(context, nlpResult, primaryIntent),
      suggestedActions: this.generateSuggestedActions(context, nlpResult),
      recommendations: this.generateRecommendations(context, nlpResult),
      conversationState: this.determineConversationState(context, nlpResult),
      wasRecovered
    };
  }

  /**
   * Update active workflow
   */
  public updateWorkflow(
    sessionId: string,
    workflow: { type: 'create_listing' | 'search' | 'purchase'; step: number; data: Record<string, any> }
  ): void {
    const context = this.getContext(sessionId);
    context.activeWorkflow = {
      ...workflow,
      startedAt: context.activeWorkflow?.startedAt || new Date()
    };
  }

  /**
   * Complete workflow
   */
  public completeWorkflow(sessionId: string): void {
    const context = this.getContext(sessionId);
    context.activeWorkflow = undefined;
  }

  /**
   * Get conversation summary
   */
  public getConversationSummary(sessionId: string): string {
    const context = this.getContext(sessionId);
    
    if (context.conversationHistory.length === 0) {
      return "Nouvelle conversation";
    }
    
    const recentTurns = context.conversationHistory.slice(-5);
    const mainIntents = recentTurns
      .map(t => t.nlpResult.intents[0]?.type)
      .filter((v, i, a) => a.indexOf(v) === i);
    
    return `Conversation en cours (${context.conversationHistory.length} messages). Sujets: ${mainIntents.join(', ')}`;
  }

  /**
   * Get user insights
   */
  public getUserInsights(sessionId: string): {
    isEngaged: boolean;
    needsHelp: boolean;
    frustrationLevel: number;
    primaryGoal?: string;
  } {
    const context = this.getContext(sessionId);
    
    // Engagement
    const isEngaged = context.metrics.totalMessages > 5 && context.metrics.successfulActions > 0;
    
    // Needs help
    const needsHelp = context.metrics.averageConfidence < 0.5 || 
                      context.metrics.failedActions > context.metrics.successfulActions;
    
    // Frustration
    const recentSentiments = context.sentimentHistory.slice(-5);
    const negativeSentiments = recentSentiments.filter(s => s.sentiment === 'negative' || s.sentiment === 'frustrated').length;
    const frustrationLevel = negativeSentiments / Math.max(recentSentiments.length, 1);
    
    // Primary goal
    const intentCounts: Record<string, number> = {};
    context.conversationHistory.forEach(turn => {
      const intent = turn.nlpResult.intents[0]?.type;
      if (intent) {
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      }
    });
    
    const primaryGoal = Object.entries(intentCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    return { isEngaged, needsHelp, frustrationLevel, primaryGoal };
  }

  /**
   * Record user feedback
   */
  public recordFeedback(sessionId: string, turnId: string, feedback: 'positive' | 'negative'): void {
    const context = this.getContext(sessionId);
    const turn = context.conversationHistory.find(t => t.id === turnId);
    if (turn) {
      turn.userFeedback = feedback;
    }
  }

  // ==================== PRIVATE METHODS ====================

  private createNewContext(sessionId: string, userId?: string): UserContext {
    return {
      userId,
      sessionId,
      conversationHistory: [],
      userProfile: {
        preferredCategories: [],
        interests: [],
        behaviorPattern: 'browser'
      },
      temporaryMemory: {},
      sentimentHistory: [],
      metrics: {
        totalMessages: 0,
        successfulActions: 0,
        failedActions: 0,
        averageConfidence: 0,
        sessionStartTime: new Date()
      }
    };
  }

  private learnFromTurn(context: UserContext, turn: ConversationTurn): void {
    const { nlpResult } = turn;
    
    // Learn preferred categories
    const categoryEntities = nlpResult.entities.filter(e => e.type === EntityType.CATEGORY);
    categoryEntities.forEach(entity => {
      const category = entity.normalized as string;
      if (!context.userProfile.preferredCategories.includes(category)) {
        context.userProfile.preferredCategories.push(category);
      }
    });
    
    // Learn price range
    const priceEntities = nlpResult.entities.filter(e => e.type === EntityType.PRICE);
    if (priceEntities.length > 0) {
      const prices = priceEntities.map(e => e.normalized as number);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      
      if (!context.userProfile.priceRange) {
        context.userProfile.priceRange = { min, max };
      } else {
        context.userProfile.priceRange.min = Math.min(context.userProfile.priceRange.min, min);
        context.userProfile.priceRange.max = Math.max(context.userProfile.priceRange.max, max);
      }
    }
    
    // Learn behavior pattern
    const createIntents = context.conversationHistory.filter(
      t => t.nlpResult.intents.some(i => i.type === IntentType.CREATE_LISTING)
    ).length;
    const searchIntents = context.conversationHistory.filter(
      t => t.nlpResult.intents.some(i => i.type === IntentType.SEARCH_LISTING)
    ).length;
    
    if (createIntents > searchIntents * 2) {
      context.userProfile.behaviorPattern = 'seller';
    } else if (searchIntents > createIntents * 2) {
      context.userProfile.behaviorPattern = 'buyer';
    } else if (createIntents > 0 && searchIntents > 0) {
      context.userProfile.behaviorPattern = 'both';
    }
    
    // Extract name if mentioned
    if (!context.userProfile.name) {
      const match = turn.userMessage.match(/je m'appelle ([A-Z][a-z]+)/i);
      if (match) {
        context.userProfile.name = match[1];
      }
    }
  }

  private updateTemporaryMemory(context: UserContext, nlpResult: NLPResult): void {
    // Update last mentioned category
    const category = nlpResult.entities.find(e => e.type === EntityType.CATEGORY);
    if (category) {
      context.temporaryMemory.lastMentionedCategory = category.normalized as string;
    }
    
    // Update last mentioned price
    const price = nlpResult.entities.find(e => e.type === EntityType.PRICE);
    if (price) {
      context.temporaryMemory.lastMentionedPrice = price.normalized as number;
    }
  }

  private resolveReferences(context: UserContext, nlpResult: NLPResult): Record<string, any> {
    const resolved: Record<string, any> = {};
    
    // Check for reference entities
    const hasReference = nlpResult.entities.some(e => e.type === EntityType.REFERENCE);
    
    if (hasReference) {
      // Resolve from temporary memory
      if (context.temporaryMemory.lastMentionedListing) {
        resolved.listing = context.temporaryMemory.lastMentionedListing;
      }
      if (context.currentListingId) {
        resolved.listingId = context.currentListingId;
      }
      
      // Resolve from recent conversation
      const recentTurn = context.conversationHistory[context.conversationHistory.length - 2];
      if (recentTurn) {
        resolved.previousMessage = recentTurn.userMessage;
        resolved.previousIntent = recentTurn.nlpResult.intents[0]?.type;
      }
    }
    
    return resolved;
  }

  private detectMissingInformation(context: UserContext, nlpResult: NLPResult, primaryIntent?: IntentType): string[] {
    const missing: string[] = [];
    const intent = primaryIntent || nlpResult.intents[0]?.type;
    
    // Collect all entities from current message + workflow history
    const hasCategory = nlpResult.entities.some(e => e.type === EntityType.CATEGORY);
    const hasPrice = nlpResult.entities.some(e => e.type === EntityType.PRICE);
    
    // Check if workflow already has these entities
    const workflowHasCategory = context.activeWorkflow?.data?.category !== undefined;
    const workflowHasPrice = context.activeWorkflow?.data?.price !== undefined;
    
    switch (intent) {
      case IntentType.CREATE_LISTING:
        if (!hasCategory && !workflowHasCategory) {
          missing.push('category');
        }
        if (!hasPrice && !workflowHasPrice) {
          missing.push('price');
        }
        break;
      
      case IntentType.SEARCH_LISTING:
        if (!hasCategory && !workflowHasCategory && 
            !context.temporaryMemory.lastMentionedCategory) {
          missing.push('category');
        }
        break;
      
      case IntentType.SEND_MESSAGE:
        if (!context.currentListingId && !context.temporaryMemory.lastMentionedListing) {
          missing.push('recipient');
        }
        break;
    }
    
    return missing;
  }

  private generateSuggestedActions(context: UserContext, nlpResult: NLPResult): Array<{ action: string; label: string; priority: number }> {
    const suggestions: Array<{ action: string; label: string; priority: number }> = [];
    const primaryIntent = nlpResult.intents[0]?.type;
    
    // Context-based suggestions
    if (primaryIntent === IntentType.SEARCH_LISTING) {
      suggestions.push({ action: 'search', label: '🔍 Lancer la recherche', priority: 10 });
      if (context.userProfile.preferredCategories.length > 0) {
        suggestions.push({ 
          action: 'search_favorites', 
          label: '⭐ Rechercher dans mes catégories préférées', 
          priority: 7 
        });
      }
    }
    
    if (primaryIntent === IntentType.CREATE_LISTING) {
      suggestions.push({ action: 'start_creation', label: '➕ Commencer à créer', priority: 10 });
      if (context.activeWorkflow?.type === 'create_listing') {
        suggestions.push({ action: 'continue_creation', label: '▶️ Continuer la création', priority: 9 });
      }
    }
    
    // Always available
    suggestions.push({ action: 'view_my_listings', label: '📋 Voir mes annonces', priority: 5 });
    
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  private generateRecommendations(context: UserContext, nlpResult: NLPResult): Array<{ type: string; item: any; reason: string; confidence: number }> {
    const recommendations: Array<{ type: string; item: any; reason: string; confidence: number }> = [];
    
    // Based on behavior
    if (context.userProfile.behaviorPattern === 'buyer' && context.userProfile.preferredCategories.length > 0) {
      recommendations.push({
        type: 'search',
        item: { categories: context.userProfile.preferredCategories },
        reason: 'Basé sur tes catégories préférées',
        confidence: 0.8
      });
    }
    
    // Based on price range
    if (context.userProfile.priceRange) {
      recommendations.push({
        type: 'price_filter',
        item: context.userProfile.priceRange,
        reason: 'Selon ta fourchette de prix habituelle',
        confidence: 0.7
      });
    }
    
    return recommendations;
  }

  private determineConversationState(context: UserContext, nlpResult: NLPResult): 'starting' | 'ongoing' | 'clarifying' | 'completing' | 'ending' {
    const turnCount = context.conversationHistory.length;
    
    if (turnCount === 0 || nlpResult.intents[0]?.type === IntentType.GREETING) {
      return 'starting';
    }
    
    if (nlpResult.intents[0]?.type === IntentType.GOODBYE) {
      return 'ending';
    }
    
    if (nlpResult.isAmbiguous || nlpResult.overallConfidence < 0.5) {
      return 'clarifying';
    }
    
    if (context.activeWorkflow && context.activeWorkflow.step >= 3) {
      return 'completing';
    }
    
    return 'ongoing';
  }

  private cleanOldContexts(): void {
    const now = Date.now();
    for (const [sessionId, context] of this.contexts.entries()) {
      const sessionAge = now - context.metrics.sessionStartTime.getTime();
      if (sessionAge > this.SESSION_TIMEOUT) {
        this.contexts.delete(sessionId);
      }
    }
  }

  /**
   * Gestion améliorée du contexte pour les réponses aux questions
   */
  public enhanceContext(nlpResult: NLPResult, currentState: any): any {
    const context = { ...currentState };
    
    // Si on attend une réponse et que l'utilisateur donne une catégorie
    if (context.expectingCategory && nlpResult.entities.some(e => e.type === EntityType.CATEGORY)) {
      context.currentIntent = IntentType.CREATE_LISTING;
      context.missingInfo = context.missingInfo?.filter((info: string) => info !== 'category');
    }
    
    // Si l'utilisateur donne juste une catégorie sans contexte clair
    if (nlpResult.intents[0].type === IntentType.UNKNOWN && 
        nlpResult.entities.some(e => e.type === EntityType.CATEGORY)) {
      
      // Vérifier l'historique pour deviner l'intention
      const lastIntent = context.lastIntent;
      if (lastIntent === IntentType.CREATE_LISTING || lastIntent === IntentType.SEARCH_LISTING) {
        context.currentIntent = lastIntent;
      } else {
        // Par défaut, supposer que c'est une recherche
        context.currentIntent = IntentType.SEARCH_LISTING;
      }
    }
    
    return context;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ==================== SINGLETON EXPORT ====================

export const contextManager = new ContextManager();

