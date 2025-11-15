/**
 * 🎭 Chatbot Orchestrator - Coordinateur Principal
 * Coordonne tous les composants du chatbot expert
 */

import { nlpEngine, NLPResult, IntentType } from './nlpEngine';
import { contextManager, ContextEnrichment, UserContext } from './contextManager';
import { actionDispatcher, ActionResult } from './actionDispatcher';
import { responseGenerator, BotResponse } from './responseGenerator';

// ==================== TYPES ====================

export interface ChatbotConfig {
  sessionId: string;
  userId?: string;
  currentPage?: string;
  currentListingId?: string;
  stores?: any;
}

export interface ProcessMessageOptions {
  message: string;
  config: ChatbotConfig;
}

export interface ProcessMessageResult {
  botResponse: BotResponse;
  nlpResult: NLPResult;
  context: ContextEnrichment;
  actionResult?: ActionResult;
  debug?: {
    processingTime: number;
    confidence: number;
    intents: string[];
  };
}

export interface ChatbotMetrics {
  totalMessages: number;
  averageConfidence: number;
  successRate: number;
  averageResponseTime: number;
  topIntents: Array<{ intent: string; count: number }>;
  userSatisfaction: number;
}

// ==================== CHATBOT ORCHESTRATOR CLASS ====================

export class ChatbotOrchestrator {
  private initialized = false;
  private metrics: Map<string, ChatbotMetrics> = new Map();

  /**
   * Initialize the chatbot system
   */
  public init(stores?: any): void {
    if (this.initialized) {
      console.warn('Chatbot already initialized');
      return;
    }
    
    // Initialize action dispatcher with stores
    if (stores) {
      actionDispatcher.init(stores);
    }
    
    this.initialized = true;
    console.log('🤖 Expert Chatbot System initialized');
  }

  /**
   * Process a user message through the entire pipeline
   */
  public async processMessage(options: ProcessMessageOptions): Promise<ProcessMessageResult> {
    const startTime = Date.now();
    const { message, config } = options;
    
    if (!this.initialized) {
      throw new Error('Chatbot not initialized. Call init() first.');
    }
    
    try {
      // ===== STEP 1: NLP Analysis =====
      const context = contextManager.getContext(config.sessionId, config.userId);
      const nlpResult = nlpEngine.analyze(message, { 
        currentPage: config.currentPage,
        ...context
      });
      
      console.log('📊 NLP Result:', {
        intents: nlpResult.intents.map(i => `${i.type} (${i.confidence.toFixed(2)})`),
        entities: nlpResult.entities.map(e => `${e.type}: ${e.value}`),
        sentiment: nlpResult.sentiment,
        confidence: nlpResult.overallConfidence
      });
      
      // ===== STEP 2: Context Enrichment =====
      const enrichedContext = contextManager.enrichWithContext(
        config.sessionId,
        nlpResult,
        { page: config.currentPage, listingId: config.currentListingId }
      );
      
      console.log('🎯 Enriched Context:', {
        currentIntent: enrichedContext.currentIntent,
        missingInfo: enrichedContext.missingInformation,
        suggestedActions: enrichedContext.suggestedActions.length,
        conversationState: enrichedContext.conversationState
      });
      
      // ===== STEP 3: Action Execution (if needed) =====
      let actionResult: ActionResult | undefined;
      
      if (this.shouldExecuteAction(nlpResult, enrichedContext)) {
        const primaryIntent = nlpResult.intents[0];
        // Get context before extracting entities to pass workflow info
        const currentContextForExtraction = contextManager.getContext(config.sessionId);
        const entities = this.extractEntitiesMap(nlpResult, enrichedContext.currentIntent, currentContextForExtraction);
        
        // Merge workflow data with entities if workflow exists
        const currentContext = contextManager.getContext(config.sessionId);
        const mergedEntities = currentContext.activeWorkflow?.data
          ? { ...currentContext.activeWorkflow.data, ...entities }
          : entities;
        
        // Update workflow BEFORE dispatching action (so handleCreateListing sees updated data)
        // Always update if we have CREATE_LISTING intent, even with empty entities (to maintain workflow)
        if (enrichedContext.currentIntent === 'create_listing') {
          if (!currentContext.activeWorkflow) {
            console.log('🔄 Starting CREATE_LISTING workflow (before action)');
            contextManager.updateWorkflow(config.sessionId, {
              type: 'create_listing',
              step: 1,
              data: { ...entities }
            });
          } else {
            const mergedData = { ...currentContext.activeWorkflow.data, ...entities };
            const newStep = this.calculateWorkflowStep('create_listing', mergedData);
            console.log('🔄 Updating CREATE_LISTING workflow (before action):', {
              step: `${currentContext.activeWorkflow.step} → ${newStep}`,
              entities: Object.keys(entities),
              collected: Object.keys(mergedData),
              hasProductName: !!mergedData.productName || !!mergedData.title,
              hasCategory: !!mergedData.category,
              hasPrice: !!mergedData.price
            });
            contextManager.updateWorkflow(config.sessionId, {
              type: 'create_listing',
              step: newStep,
              data: mergedData
            });
            
            // Update currentContext to reflect the change immediately
            currentContext.activeWorkflow = {
              ...currentContext.activeWorkflow,
              step: newStep,
              data: mergedData
            };
            
            // Update mergedEntities to include the latest workflow data
            Object.assign(mergedEntities, mergedData);
          }
        }
        
        // Re-fetch context after workflow update to ensure we have latest data
        const updatedContext = contextManager.getContext(config.sessionId);
        if (updatedContext.activeWorkflow) {
          // Merge again with updated workflow data
          Object.assign(mergedEntities, updatedContext.activeWorkflow.data);
        }
        
        console.log('🔨 Dispatching action:', {
          intent: primaryIntent?.type,
          enrichedIntent: enrichedContext.currentIntent,
          entities: Object.keys(mergedEntities),
          fromWorkflow: !!updatedContext.activeWorkflow?.data,
          workflowStep: updatedContext.activeWorkflow?.step,
          workflowData: Object.keys(updatedContext.activeWorkflow?.data || {})
        });
        
        // Update enrichedContext with latest workflow info
        enrichedContext.activeWorkflow = updatedContext.activeWorkflow;
        
        actionResult = await actionDispatcher.dispatch({
          intent: enrichedContext.currentIntent, // Use enriched intent, not original
          entities: mergedEntities,
          context: enrichedContext,
          nlpResult
        });
        
        console.log('⚡ Action Result:', {
          success: actionResult.success,
          message: actionResult.message,
          nextStep: actionResult.nextStep
        });
      }
      
      // ===== STEP 4: Response Generation (with optional LLM fallback) =====
      const botResponse = await responseGenerator.generateAsync({
        nlpResult,
        context: enrichedContext,
        userContext: context,
        actionResult,
        userMessage: message
      });
      
      console.log('💬 Bot Response:', {
        text: botResponse.text.substring(0, 100),
        tone: botResponse.tone,
        hasSuggestions: !!botResponse.suggestions,
        hasComponents: !!botResponse.components
      });
      
      // ===== STEP 5: Update Context =====
      // Create enriched NLP result for history
      const enrichedNlpResult: NLPResult = {
        ...nlpResult,
        intents: [{
          type: enrichedContext.currentIntent,
          confidence: enrichedContext.wasRecovered ? 0.8 : nlpResult.intents[0]?.confidence || 1.0,
          metadata: { enriched: true }
        }]
      };
      
      contextManager.addTurn(
        config.sessionId,
        message,
        enrichedNlpResult,
        botResponse.text,
        actionResult 
          ? [{ type: enrichedContext.currentIntent, payload: actionResult.data, success: actionResult.success, timestamp: new Date() }] 
          : undefined
      );
      
      // ===== STEP 5.5: Manage workflow based on context =====
      const currentContext = contextManager.getContext(config.sessionId);
      const entities = this.extractEntitiesMap(nlpResult, enrichedContext.currentIntent);
      
      // Update workflow from action result if available (more accurate step tracking)
      // 🚀 OPTIMIZED: Use workflow state from optimized action dispatcher
      if (actionResult?.data?.workflow) {
        const workflowData = actionResult.data.workflow;
        console.log('🔄 Updating workflow from action result (optimized):', {
          type: workflowData.type,
          step: workflowData.step,
          transactionType: workflowData.transactionType,
          collected: Object.keys(workflowData.collected || {}),
          missing: workflowData.missing || []
        });
        // Use collected data directly (already merged in optimized workflow)
        contextManager.updateWorkflow(config.sessionId, {
          type: workflowData.type,
          step: workflowData.step,
          data: workflowData.collected || workflowData.data || {}
        });
      } else if (enrichedContext.currentIntent === 'create_listing') {
        // Always update workflow for CREATE_LISTING, even if no missing info (to track progress)
        if (!currentContext.activeWorkflow) {
          console.log('🔄 Starting CREATE_LISTING workflow');
          contextManager.updateWorkflow(config.sessionId, {
            type: 'create_listing',
            step: 1,
            data: { ...entities }
          });
        } else {
          // Merge entities into existing workflow and update step
          const mergedData = { ...currentContext.activeWorkflow.data, ...entities };
          const newStep = this.calculateWorkflowStep('create_listing', mergedData);
          console.log('🔄 Updating CREATE_LISTING workflow:', {
            step: `${currentContext.activeWorkflow.step} → ${newStep}`,
            entities: Object.keys(entities),
            collected: Object.keys(mergedData),
            hasProductName: !!mergedData.productName || !!mergedData.title,
            hasCategory: !!mergedData.category,
            hasPrice: !!mergedData.price,
            hasCondition: !!mergedData.condition
          });
          contextManager.updateWorkflow(config.sessionId, {
            type: 'create_listing',
            step: newStep,
            data: mergedData
          });
        }
      } else if (enrichedContext.currentIntent === 'search_listing' && enrichedContext.missingInformation.length > 0) {
        if (!currentContext.activeWorkflow) {
          console.log('🔄 Starting SEARCH_LISTING workflow');
          contextManager.updateWorkflow(config.sessionId, {
            type: 'search',
            step: 1,
            data: { ...entities }
          });
        } else {
          console.log('🔄 Updating SEARCH_LISTING workflow with entities:', Object.keys(entities));
          contextManager.updateWorkflow(config.sessionId, {
            type: 'search',
            step: currentContext.activeWorkflow.step,
            data: { ...currentContext.activeWorkflow.data, ...entities }
          });
        }
      } else if (enrichedContext.missingInformation.length === 0 && currentContext.activeWorkflow) {
        // Keep workflow active after collection completes
        // User can continue from where they left off
        console.log('⏳ [NEW CODE] Workflow complete - keeping active for context continuity (30s timeout)');
      }
      
      // ===== STEP 6: Update Metrics =====
      const processingTime = Date.now() - startTime;
      this.updateMetrics(config.sessionId, nlpResult, actionResult, processingTime);
      
      // ===== STEP 7: Return Complete Result =====
      return {
        botResponse,
        nlpResult,
        context: enrichedContext,
        actionResult,
        debug: {
          processingTime,
          confidence: nlpResult.overallConfidence,
          intents: nlpResult.intents.map(i => i.type)
        }
      };
      
    } catch (error) {
      console.error('❌ Chatbot processing error:', error);
      
      // Return error response
      return {
        botResponse: {
          text: "Oups ! Une erreur s'est produite. 😔 Peux-tu reformuler ou réessayer ?",
          tone: 'apologetic',
          suggestions: ['🔄 Réessayer', '🏠 Retour accueil', '❓ Aide']
        },
        nlpResult: {
          intents: [],
          entities: [],
          sentiment: 'neutral' as any,
          sentimentScore: 0,
          tokens: [],
          language: 'fr',
          overallConfidence: 0,
          isAmbiguous: true
        },
        context: {
          currentIntent: 'unknown' as any,
          confidence: 0,
          resolvedReferences: {},
          missingInformation: [],
          suggestedActions: [],
          recommendations: [],
          conversationState: 'ongoing'
        }
      };
    }
  }

  /**
   * Get conversation summary
   */
  public getConversationSummary(sessionId: string): string {
    return contextManager.getConversationSummary(sessionId);
  }

  /**
   * Get user insights
   */
  public getUserInsights(sessionId: string) {
    return contextManager.getUserInsights(sessionId);
  }

  /**
   * Record user feedback
   */
  public recordFeedback(sessionId: string, turnId: string, feedback: 'positive' | 'negative'): void {
    contextManager.recordFeedback(sessionId, turnId, feedback);
    
    // Update satisfaction metric
    const metrics = this.metrics.get(sessionId);
    if (metrics) {
      const feedbackScore = feedback === 'positive' ? 1 : -1;
      metrics.userSatisfaction = (metrics.userSatisfaction + feedbackScore) / 2;
    }
  }

  /**
   * Get chatbot metrics
   */
  public getMetrics(sessionId: string): ChatbotMetrics | undefined {
    return this.metrics.get(sessionId);
  }

  /**
   * Reset conversation
   */
  public resetConversation(sessionId: string): void {
    const context = contextManager.getContext(sessionId);
    context.conversationHistory = [];
    context.temporaryMemory = {};
    context.activeWorkflow = undefined;
    console.log(`🔄 Conversation ${sessionId} reset`);
  }

  /**
   * Calculate workflow step based on collected data
   */
  private calculateWorkflowStep(type: string, data: Record<string, any>): number {
    if (type === 'create_listing') {
      if (!data.productName && !data.title) return 1;
      if (!data.category) return 2;
      if (!data.price) return 3;
      if (!data.condition) return 4;
      return 5; // All required info collected
    }
    return 1;
  }

  /**
   * Update active workflow
   */
  public updateWorkflow(
    sessionId: string,
    workflow: { type: 'create_listing' | 'search' | 'purchase'; step: number; data: Record<string, any> }
  ): void {
    contextManager.updateWorkflow(sessionId, workflow);
  }

  /**
   * Complete active workflow
   */
  public completeWorkflow(sessionId: string): void {
    contextManager.completeWorkflow(sessionId);
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Determine if an action should be executed
   */
  private shouldExecuteAction(nlpResult: NLPResult, context: ContextEnrichment): boolean {
    // Don't execute for greetings, goodbyes, thanks
    const socialIntents = ['greeting', 'goodbye', 'thanks'];
    if (socialIntents.includes(context.currentIntent)) {
      return false;
    }
    
    // Don't execute if too ambiguous
    if (nlpResult.isAmbiguous && nlpResult.overallConfidence < 0.4) {
      return false;
    }
    
    // Don't execute if help request (actually we want to show help)
    if (context.currentIntent === 'get_help') {
      return true;
    }
    
    // Execute if context recovery happened
    if (context.wasRecovered) {
      console.log('✅ Execute action: context recovered');
      return true;
    }
    
    // Execute if high confidence
    return nlpResult.overallConfidence > 0.5;
  }

  /**
   * Extract entities into a map
   */
  private extractEntitiesMap(nlpResult: NLPResult, intent?: IntentType, context?: UserContext): Record<string, any> {
    const map: Record<string, any> = {};
    const currentIntent = intent || nlpResult.intents[0]?.type;
    const originalMessage = nlpResult.originalMessage || '';
    const normalizedMessage = originalMessage.toLowerCase();
    
    // Extract transaction type indicators
    if (currentIntent === 'create_listing') {
      // Explicit transaction type selection from suggestions
      if (normalizedMessage.includes('vendre') || normalizedMessage.includes('vente') || normalizedMessage.includes('💰')) {
        map['transactionType'] = 'sell';
        map['transactionTypeConfirmed'] = 'sell';
      } else if (normalizedMessage.includes('donner') || normalizedMessage.includes('don') || normalizedMessage.includes('gratuit') || normalizedMessage.includes('offrir') || normalizedMessage.includes('💝')) {
        map['isGift'] = true;
        map['transactionType'] = 'gift';
        map['transactionTypeConfirmed'] = 'gift';
      } else if (normalizedMessage.includes('échanger') || normalizedMessage.includes('échange') || normalizedMessage.includes('troc') || normalizedMessage.includes('swap') || normalizedMessage.includes('🔄')) {
        map['isSwap'] = true;
        map['transactionType'] = 'swap';
        map['transactionTypeConfirmed'] = 'swap';
      } else if (normalizedMessage.includes('service') || normalizedMessage.includes('proposer un service') || normalizedMessage.includes('cours') || normalizedMessage.includes('aide') || normalizedMessage.includes('tutorat') || normalizedMessage.includes('🔧')) {
        map['isService'] = true;
        map['transactionType'] = 'service';
        map['transactionTypeConfirmed'] = 'service';
      } else {
        // Legacy detection for backward compatibility
        if (normalizedMessage.includes('don') || normalizedMessage.includes('gratuit') || normalizedMessage.includes('offrir')) {
          map['isGift'] = true;
        }
        if (normalizedMessage.includes('échange') || normalizedMessage.includes('troc') || normalizedMessage.includes('swap')) {
          map['isSwap'] = true;
        }
        if (normalizedMessage.includes('service') || normalizedMessage.includes('cours') || normalizedMessage.includes('aide') || normalizedMessage.includes('tutorat')) {
          map['isService'] = true;
        }
      }
      
      // Extract hourly rate (e.g., "15€/h", "20 euros par heure", "10€/h", "Gratuit")
      // Pattern amélioré pour détecter même sans espace: "10€/h" ou "10€ /h" ou "10 euros par heure"
      // Priorité: détecter d'abord les tarifs horaires avant les prix simples
      const hourlyRatePattern = /(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:€|euros?|eur)?\s*(?:\/|par)\s*(?:h|heure|heures)/i;
      const hourlyRateMatch = originalMessage.match(hourlyRatePattern);
      if (hourlyRateMatch) {
        map['hourlyRate'] = parseFloat(hourlyRateMatch[1].replace(',', '.'));
        map['transactionType'] = 'service';
        map['transactionTypeConfirmed'] = 'service';
        console.log(`💰 Extracted hourlyRate: ${map['hourlyRate']}€/h`);
      } else if (normalizedMessage === 'gratuit' || (normalizedMessage.includes('gratuit') && currentIntent === 'create_listing')) {
        // "Gratuit" - déterminer selon le contexte du workflow
        if (context?.activeWorkflow?.type === 'create_listing') {
          const workflowData = context.activeWorkflow.data;
          // Si on demande hourlyRate ou si le type est service, c'est un service gratuit
          if (workflowData?.transactionType === 'service' || workflowData?.askField === 'hourlyRate') {
            map['hourlyRate'] = 0;
            map['transactionType'] = 'service';
            console.log(`💰 Extracted hourlyRate: 0€/h (gratuit)`);
          } else {
            // Sinon, c'est probablement un don
            map['price'] = 0;
            map['transactionType'] = 'gift';
            console.log(`💰 Extracted price: 0€ (gratuit/don)`);
          }
        } else if (normalizedMessage === 'gratuit' && currentIntent === 'create_listing') {
          // Par défaut, "gratuit" = don
          map['price'] = 0;
          map['transactionType'] = 'gift';
          console.log(`💰 Extracted price: 0€ (gratuit/don)`);
        }
      }
      
      // Extract duration (e.g., "2h", "5 heures")
      const durationMatch = originalMessage.match(/(\d+)\s*(?:h|heure|heures)(?!\s*(?:\/|par))/i);
      if (durationMatch && !hourlyRateMatch) { // Only if not already extracted as hourly rate
        map['duration'] = parseInt(durationMatch[1]);
        console.log(`⏱️ Extracted duration: ${map['duration']}h`);
      }
      
      // Extract price from suggestions like "10€", "25€", "50€", "100€"
      // Pattern pour prix simple (sans /h) - seulement si pas déjà un tarif horaire
      if (!map['hourlyRate'] && !map['price']) {
        // Pattern qui exclut les tarifs horaires
        const simplePricePattern = /(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:€|euros?|eur)(?!\s*(?:\/|par)\s*(?:h|heure|heures))/i;
        const simplePriceMatch = originalMessage.match(simplePricePattern);
        if (simplePriceMatch) {
          map['price'] = parseFloat(simplePriceMatch[1].replace(',', '.'));
          console.log(`💰 Extracted price: ${map['price']}€`);
        }
      }
      
      // Extract donation reason patterns
      if (normalizedMessage.includes('n\'ai plus besoin') || normalizedMessage.includes('déménagement') || normalizedMessage.includes('bon geste')) {
        const reasonMatch = originalMessage.match(/(?:parce que|car|car je|je n'ai plus besoin|déménagement|bon geste)[^.]*/i);
        if (reasonMatch) {
          map['donationReason'] = reasonMatch[0].trim();
        }
      }
    }
    
    nlpResult.entities.forEach(entity => {
      // Convert NUMBER to PRICE if in create_listing context (number likely refers to price)
      if (entity.type === 'number' && currentIntent === 'create_listing') {
        // Check if it's already an hourly rate or duration
        if (!map['hourlyRate'] && !map['duration'] && !map['price']) {
          // Si on est dans un workflow service et qu'on demande hourlyRate, c'est un tarif horaire
          // Sinon, c'est un prix
          const numValue = entity.normalized !== undefined ? entity.normalized : parseFloat(entity.value);
          if (!isNaN(numValue)) {
            // Vérifier le contexte: si on demande hourlyRate, utiliser hourlyRate
            // Sinon, utiliser price
            // On laisse le workflow décider selon le champ demandé
            map['price'] = numValue;
            console.log(`💰 Converting NUMBER to PRICE: ${numValue} (context: ${currentIntent})`);
          }
        }
      } 
      // Map PRODUCT_NAME to both productName and title (for compatibility)
      else if (entity.type === 'product_name') {
        const value = entity.normalized !== undefined ? entity.normalized : entity.value;
        map['productName'] = value;
        map['title'] = value; // Also map to title for compatibility
        console.log(`📦 Mapped PRODUCT_NAME: "${value}" → productName & title`);
      }
      // Standard conversion: snake_case to camelCase
      else {
        const key = entity.type.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        map[key] = entity.normalized !== undefined ? entity.normalized : entity.value;
      }
    });
    
    return map;
  }

  /**
   * Update metrics
   */
  private updateMetrics(
    sessionId: string,
    nlpResult: NLPResult,
    actionResult: ActionResult | undefined,
    processingTime: number
  ): void {
    let metrics = this.metrics.get(sessionId);
    
    if (!metrics) {
      metrics = {
        totalMessages: 0,
        averageConfidence: 0,
        successRate: 0,
        averageResponseTime: 0,
        topIntents: [],
        userSatisfaction: 0
      };
      this.metrics.set(sessionId, metrics);
    }
    
    // Update counts
    metrics.totalMessages++;
    
    // Update average confidence
    metrics.averageConfidence = 
      (metrics.averageConfidence * (metrics.totalMessages - 1) + nlpResult.overallConfidence) / 
      metrics.totalMessages;
    
    // Update success rate
    if (actionResult) {
      const successCount = actionResult.success ? 1 : 0;
      metrics.successRate = 
        (metrics.successRate * (metrics.totalMessages - 1) + successCount) / 
        metrics.totalMessages;
    }
    
    // Update average response time
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.totalMessages - 1) + processingTime) / 
      metrics.totalMessages;
    
    // Update top intents
    if (nlpResult.intents.length > 0) {
      const intent = nlpResult.intents[0].type;
      const existing = metrics.topIntents.find(i => i.intent === intent);
      
      if (existing) {
        existing.count++;
      } else {
        metrics.topIntents.push({ intent, count: 1 });
      }
      
      // Sort and keep top 10
      metrics.topIntents.sort((a, b) => b.count - a.count);
      metrics.topIntents = metrics.topIntents.slice(0, 10);
    }
  }
}

// ==================== SINGLETON EXPORT ====================

export const chatbot = new ChatbotOrchestrator();

// ==================== CONVENIENCE EXPORTS ====================

export { IntentType } from './nlpEngine';
export type { BotResponse } from './responseGenerator';

