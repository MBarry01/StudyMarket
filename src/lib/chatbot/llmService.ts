/**
 * 🤖 LLM Service - Intégration DeepSeek / OpenAI GPT
 * Service robuste pour améliorer le chatbot avec une LLM
 */

import { ENV_CONFIG } from '@/config/env';

export interface LLMResponse {
  response: string;
  confidence: number;
  reasoning?: string;
}

type LLMProvider = 'deepseek' | 'openai';

export class LLMService {
  private apiKey: string;
  private enabled: boolean;
  private provider: LLMProvider;
  private baseUrl: string;
  private model: string;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    // Priorité: DeepSeek > OpenAI
    if (ENV_CONFIG.DEEPSEEK_ENABLED && ENV_CONFIG.DEEPSEEK_API_KEY) {
      this.provider = 'deepseek';
      this.apiKey = ENV_CONFIG.DEEPSEEK_API_KEY;
      this.baseUrl = 'https://api.deepseek.com/v1';
      this.model = ENV_CONFIG.DEEPSEEK_MODEL || 'deepseek-chat';
      this.enabled = true;
      console.log('✅ DeepSeek LLM enabled');
      console.log('🔑 API Key configured:', this.apiKey.substring(0, 15) + '...');
      console.log('📦 Model:', this.model);
    } else if (ENV_CONFIG.OPENAI_ENABLED && ENV_CONFIG.OPENAI_API_KEY) {
      this.provider = 'openai';
      this.apiKey = ENV_CONFIG.OPENAI_API_KEY;
      this.baseUrl = 'https://api.openai.com/v1';
      this.model = 'gpt-3.5-turbo';
      this.enabled = true;
      console.log('✅ OpenAI LLM enabled');
      console.log('🔑 API Key configured:', this.apiKey.substring(0, 15) + '...');
    } else {
      this.enabled = false;
      this.provider = 'openai'; // Default fallback
      this.apiKey = '';
      this.baseUrl = '';
      this.model = '';
      console.log('❌ LLM Service disabled - No API key configured');
      console.log('🔍 Debug - DEEPSEEK_ENABLED:', ENV_CONFIG.DEEPSEEK_ENABLED, '| OPENAI_ENABLED:', ENV_CONFIG.OPENAI_ENABLED);
    }
  }

  /**
   * Génére une réponse intelligente avec DeepSeek / OpenAI GPT (avec retry logic)
   */
  async generateResponse(
    userMessage: string,
    context: {
      intent?: string;
      entities?: any[];
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      platformContext?: any;
    }
  ): Promise<LLMResponse | null> {
    if (!this.enabled) {
      console.log('⚠️ LLM Service disabled, skipping');
      return null;
    }

    // Retry logic pour plus de robustesse
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🚀 Calling ${this.provider.toUpperCase()} API (attempt ${attempt}/${this.maxRetries}):`, userMessage.substring(0, 50) + '...');
        
        // Construire le système prompt avec contexte
        const systemPrompt = this.buildSystemPrompt(context);

        // Construire les messages
        const messages = this.buildMessages(systemPrompt, userMessage, context.conversationHistory);

        // Préparer le body de la requête
        const requestBody = {
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 800,
          stream: false
        };

        // Log de debug (sans la clé API complète)
        if (attempt === 1) {
          console.log('🔍 Request details:', {
            url: `${this.baseUrl}/chat/completions`,
            model: this.model,
            messagesCount: messages.length,
            apiKeyPrefix: this.apiKey.substring(0, 10) + '...'
          });
        }

        // Appel API avec timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
          const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData?.error?.message || errorData?.message || response.statusText;
            
            // Log detailed error for debugging
            console.error(`❌ ${this.provider.toUpperCase()} API Error (${response.status}):`, {
              message: errorMessage,
              type: errorData?.error?.type,
              code: errorData?.error?.code,
              fullError: errorData
            });
            
            // Special handling for rate limits - retry with backoff
            if (response.status === 429) {
              if (attempt < this.maxRetries) {
                const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1);
                console.warn(`⚠️ Rate limit reached, retrying in ${backoffDelay}ms...`);
                await this.delay(backoffDelay);
                continue;
              }
              console.warn('⚠️ Rate limit reached after retries, falling back to NLP');
              return null;
            }
            
            // Special handling for 400 errors (Bad Request) - don't retry, likely invalid request format
            if (response.status === 400) {
              console.error(`❌ Bad Request (400) - Likely invalid API key or request format: ${errorMessage}`);
              // Don't retry 400 errors, they won't succeed
              return null;
            }
            
            // Retry on server errors (5xx)
            if (response.status >= 500 && attempt < this.maxRetries) {
              console.warn(`⚠️ Server error ${response.status}, retrying...`);
              await this.delay(this.retryDelay * attempt);
              continue;
            }
            
            throw new Error(`${this.provider} API error: ${response.status} - ${errorMessage}`);
          }

          const data = await response.json();
          const aiResponse = data.choices[0]?.message?.content || '';

          if (!aiResponse || aiResponse.trim().length === 0) {
            throw new Error('Empty response from API');
          }

          console.log(`✅ ${this.provider.toUpperCase()} response received:`, aiResponse.substring(0, 50) + '...');
          return {
            response: aiResponse.trim(),
            confidence: 0.85, // LLM responses generally have high confidence
            reasoning: `Generated by ${this.provider.toUpperCase()} ${this.model}`
          };
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          
          // Handle abort (timeout)
          if (fetchError.name === 'AbortError') {
            if (attempt < this.maxRetries) {
              console.warn(`⚠️ Request timeout, retrying...`);
              await this.delay(this.retryDelay * attempt);
              continue;
            }
            throw new Error('Request timeout after retries');
          }
          
          throw fetchError;
        }
      } catch (error: any) {
        console.error(`❌ LLM Service error (attempt ${attempt}/${this.maxRetries}):`, error);
        
        // Last attempt failed
        if (attempt === this.maxRetries) {
          console.error('❌ All retry attempts failed, falling back to NLP');
          return null; // Fallback to NLP engine
        }
        
        // Wait before retry
        await this.delay(this.retryDelay * attempt);
      }
    }

    return null;
  }

  /**
   * Helper pour delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Construire le prompt système avec contexte StudyMarket (amélioré)
   */
  private buildSystemPrompt(context: any): string {
    return `Tu es l'assistant IA intelligent de StudyMarket, une plateforme de marketplace dédiée aux étudiants vérifiés.

🎓 CONTEXTE PLATEFORME:
- Plateforme d'échange entre étudiants vérifiés uniquement
- Catégories: livres, électronique, vêtements, mobilier, sports, logement, services, jobs
- Types de transactions: vente, don, troc, échange
- Fonctionnalités principales: annonces, messages sécurisés, favoris, profil, commandes, paiements Stripe
- Vérification: tous les utilisateurs sont vérifiés avec leur adresse email universitaire

🤖 TON RÔLE:
- Répondre de manière amicale, professionnelle et concise
- Guider les utilisateurs vers les bonnes fonctionnalités de la plateforme
- Proposer des suggestions pertinentes basées sur le contexte
- Comprendre les intentions même si mal formulées
- Adapter ton langage au niveau de l'utilisateur
- Si tu ne sais pas quelque chose, propose de contacter le support (support@studymarket.fr)

📋 RÈGLES IMPORTANTES:
- Reste concis (2-4 lignes maximum par réponse)
- Utilise des emojis avec parcimonie (1-2 max par message)
- Sois toujours positif et encourageant
- Si l'utilisateur pose une question vague, pose une question de clarification
- Ne donne JAMAIS de conseils financiers, légaux ou médicaux
- Ne promets jamais quelque chose que tu ne peux pas garantir
- Si l'utilisateur semble frustré, sois empathique et propose une solution

🎯 INTENTIONS COMMUNES:
- Recherche d'articles: guide vers /listings avec filtres
- Création d'annonce: guide vers /create (workflow étape par étape)
- Messages: guide vers /messages
- Profil: guide vers /profile
- Commandes: guide vers /orders
- Aide générale: guide vers /help ou /how-it-works

${context.intent ? `\n🎯 Intent détecté: ${context.intent}` : ''}
${context.entities && context.entities.length > 0 ? `\n📦 Entités détectées: ${context.entities.map((e: any) => `${e.type}: ${e.value}`).join(', ')}` : ''}
${context.platformContext?.currentPage ? `\n📍 Page actuelle: ${context.platformContext.currentPage}` : ''}

${context.platformContext?.workflowType ? `\n🔄 WORKFLOW ACTIF - CRÉATION D'ANNONCE DYNAMIQUE:
- Type: ${context.platformContext.workflowType}
- Type de transaction détecté: ${context.platformContext.collectedData?.transactionType || 'sell (vente)'}
- Étape actuelle: ${context.platformContext.workflowStep || 1}/5
- Données déjà collectées: ${JSON.stringify(context.platformContext.collectedData || {})}
- Informations manquantes: ${context.platformContext.missingInfo?.join(', ') || 'aucune'}

📋 WORKFLOW DYNAMIQUE SELON LE TYPE D'ANNONCE:

**TYPE: VENTE (sell)** - Champs requis:
1. Nom de l'article (productName) - ${context.platformContext.collectedData?.productName || context.platformContext.collectedData?.title ? '✅ Collecté' : '❌ Manquant'}
2. Catégorie (category) - ${context.platformContext.collectedData?.category ? '✅ Collecté' : '❌ Manquant'}
3. Prix (price) - ${context.platformContext.collectedData?.price ? '✅ Collecté' : '❌ Manquant'}
4. État (condition) - ${context.platformContext.collectedData?.condition ? '✅ Collecté' : '❌ Manquant'}
5. Modes de paiement (paymentMethods) - ${context.platformContext.collectedData?.paymentMethods ? '✅ Collecté' : '❌ Manquant'}

**TYPE: DON (gift)** - Champs requis:
1. Nom de l'article (productName) - ${context.platformContext.collectedData?.productName || context.platformContext.collectedData?.title ? '✅ Collecté' : '❌ Manquant'}
2. Catégorie (category) - ${context.platformContext.collectedData?.category ? '✅ Collecté' : '❌ Manquant'}
3. Raison du don (donationReason) - ${context.platformContext.collectedData?.donationReason ? '✅ Collecté' : '❌ Manquant'}

**TYPE: ÉCHANGE (swap)** - Champs requis:
1. Nom de l'article (productName) - ${context.platformContext.collectedData?.productName || context.platformContext.collectedData?.title ? '✅ Collecté' : '❌ Manquant'}
2. Catégorie (category) - ${context.platformContext.collectedData?.category ? '✅ Collecté' : '❌ Manquant'}
3. Objets recherchés (desiredItems) - ${context.platformContext.collectedData?.desiredItems ? '✅ Collecté' : '❌ Manquant'}
4. Valeur estimée (estimatedValue) - ${context.platformContext.collectedData?.estimatedValue ? '✅ Collecté' : '❌ Manquant'}

**TYPE: SERVICE** - Champs requis:
1. Nom du service (productName) - ${context.platformContext.collectedData?.productName || context.platformContext.collectedData?.title ? '✅ Collecté' : '❌ Manquant'}
2. Catégorie (category) - ${context.platformContext.collectedData?.category ? '✅ Collecté' : '❌ Manquant'}
3. Tarif horaire (hourlyRate) - ${context.platformContext.collectedData?.hourlyRate ? '✅ Collecté' : '❌ Manquant'}
4. Durée (duration) - ${context.platformContext.collectedData?.duration ? '✅ Collecté' : '❌ Manquant'}
5. Compétences (skills) - ${context.platformContext.collectedData?.skills ? '✅ Collecté' : '❌ Manquant'}

🎯 TON RÔLE DANS LE WORKFLOW - SOIS INTELLIGENT ET DYNAMIQUE:
- Si l'utilisateur répond à une question du workflow, EXTRACTE l'information de sa réponse IMMÉDIATEMENT
- Guide-le vers l'étape suivante de manière NATURELLE et FLUIDE (pas de répétition)
- Sois POSITIF et MOTIVANT à chaque étape (ex: "Super !", "Parfait !", "Excellent !")
- Si l'utilisateur donne plusieurs infos en une fois, reconnais-les TOUTES et félicite-le
- Ne répète JAMAIS les questions déjà posées si l'info est déjà collectée
- Montre la PROGRESSION clairement (ex: "Étape 2/5", "On avance bien !")
- Donne des EXEMPLES CONCRETS à chaque étape pour aider l'utilisateur
- Si l'utilisateur clique sur une suggestion, traite-la comme une réponse valide
- SOIS PROACTIF : Si tu détectes qu'une étape est complétée, passe IMMÉDIATEMENT à la suivante
- NE REDIS PAS ce qui a déjà été dit - progresse naturellement
- Si l'utilisateur dit "Un livre de maths", passe DIRECTEMENT à l'étape 2/5 (catégorie)
- Si l'utilisateur dit "Livres & Cours", passe DIRECTEMENT à l'étape 3/5 (prix)

💡 EXEMPLES D'EXTRACTION:
- Utilisateur dit "un livre de maths" → productName = "livre de maths"
- Utilisateur dit "50 euros" ou "50€" → price = 50
- Utilisateur dit "électronique" ou "📚 Livres & Cours" → category = correspondante
- Utilisateur dit "comme neuf" ou "🌟 Comme neuf" → condition = "comme neuf"
- Utilisateur dit "gratuit" ou "💝 Gratuit" → price = 0

💬 STYLE DE COMMUNICATION - SOIS DYNAMIQUE:
- Utilise des emojis pour rendre le message plus vivant (🎯, ✅, 💡, 📦, etc.)
- Sois CONCIS mais COMPLET - pas de répétition inutile
- Montre un RÉCAPITULATIF BRIEF des infos collectées (juste ce qui est nouveau)
- Encourage l'utilisateur à continuer
- PROGRESSE NATURELLEMENT - ne reste pas bloqué sur une étape
- Si l'utilisateur a déjà donné une info, ne la redemande PAS

🚀 EXEMPLE DE PROGRESSION INTELLIGENTE:
- Utilisateur: "Un livre de maths niveau L1"
- Toi: "Parfait ! 'Un livre de maths niveau L1' 📦\n\n**Étape 2/5** : Dans quelle catégorie ? 🏷️\n\n💡 Je suggère '📚 Livres & Cours' - ça te convient ?"
- (PAS: "Super ! Je vais t'aider..." - c'est déjà fait, progresse !)

IMPORTANT: Sois PROACTIF, INTELLIGENT, DYNAMIQUE. Ne répète pas, progresse naturellement. Si une étape est complétée, passe IMMÉDIATEMENT à la suivante.` : ''}

Réponds maintenant de manière naturelle et utile. Si l'utilisateur est dans un workflow, guide-le vers l'étape suivante et extrait les informations de sa réponse.`;
  }

  /**
   * Construire les messages pour l'API
   */
  private buildMessages(
    systemPrompt: string,
    userMessage: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): any[] {
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Ajouter l'historique récent (max 5 derniers messages)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-5);
      messages.push(...recentHistory);
    }

    // Ajouter le message actuel
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  /**
   * Décider si l'on doit utiliser la LLM
   */
  shouldUseLLM(nlpConfidence: number, intent: string, workflowContext?: any, userMessage?: string): boolean {
    if (!this.enabled) return false;
    
    // TOUJOURS utiliser LLM si dans un workflow (pour meilleure compréhension contextuelle)
    if (workflowContext?.activeWorkflow) {
      return true;
    }
    
    // Utiliser LLM si:
    // - Confiance NLP faible (< 0.5)
    // - Intent UNKNOWN
    // - Message court ou ambigu (probablement mal compris)
    // - Contient des caractères spéciaux ou formules (ex: "1+1")
    const isShortOrAmbiguous = userMessage && (
      userMessage.length < 10 || 
      /[+\-*/=<>]/.test(userMessage) || // Contient des opérateurs mathématiques
      /^\d+[\s+\-*/]\d+/.test(userMessage) // Formule simple comme "1+1"
    );
    
    if (isShortOrAmbiguous) {
      console.log('🤖 Using LLM for short/ambiguous message:', userMessage);
      return true;
    }
    
    // Demandes complexes nécessitant du raisonnement
    return nlpConfidence < 0.5 || intent === 'unknown';
  }
}

// ==================== SINGLETON EXPORT ====================

export const llmService = new LLMService();
