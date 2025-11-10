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
        const entities = this.extractEntitiesMap(nlpResult, enrichedContext.currentIntent);
        
        // Merge workflow data with entities if workflow exists
        const currentContext = contextManager.getContext(config.sessionId);
        const mergedEntities = currentContext.activeWorkflow?.data
          ? { ...currentContext.activeWorkflow.data, ...entities }
          : entities;
        
        console.log('🔨 Dispatching action:', {
          intent: primaryIntent?.type,
          enrichedIntent: enrichedContext.currentIntent,
          entities: Object.keys(mergedEntities),
          fromWorkflow: !!currentContext.activeWorkflow?.data
        });
        
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
      
      if (enrichedContext.currentIntent === 'create_listing' && enrichedContext.missingInformation.length > 0) {
        if (!currentContext.activeWorkflow) {
          console.log('🔄 Starting CREATE_LISTING workflow');
          contextManager.updateWorkflow(config.sessionId, {
            type: 'create_listing',
            step: 1,
            data: { ...entities }
          });
        } else {
          // Merge entities into existing workflow
          console.log('🔄 Updating CREATE_LISTING workflow with entities:', Object.keys(entities));
          contextManager.updateWorkflow(config.sessionId, {
            type: 'create_listing',
            step: currentContext.activeWorkflow.step,
            data: { ...currentContext.activeWorkflow.data, ...entities }
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
  private extractEntitiesMap(nlpResult: NLPResult, intent?: IntentType): Record<string, any> {
    const map: Record<string, any> = {};
    
    nlpResult.entities.forEach(entity => {
      const key = entity.type.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Convert NUMBER to PRICE if in create_listing context (number likely refers to price)
      const currentIntent = intent || nlpResult.intents[0]?.type;
      if (entity.type === 'number' && currentIntent === 'create_listing') {
        console.log(`💰 Converting NUMBER to PRICE: ${entity.value} (context: ${currentIntent})`);
        map['price'] = entity.normalized !== undefined ? entity.normalized : entity.value;
      } else {
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

