/**
 * ⚡ Action Dispatcher Expert - Exécution d'Actions
 * Dispatch des actions basées sur les intentions détectées
 * 🚀 Optimisé avec architecture FSM et extraction intelligente
 */

import { IntentType, EntityType, NLPResult } from './nlpEngine';
import { ContextEnrichment } from './contextManager';
import { 
  ListingConfig, 
  EntityExtractor, 
  WorkflowManager,
  TransactionType,
  FieldConfig,
  WorkflowState
} from './listingWorkflow';

// ==================== TYPES ====================

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
  nextStep?: string;
}

export interface ActionPayload {
  intent: IntentType;
  entities: Record<string, any>;
  context: ContextEnrichment;
  nlpResult: NLPResult;
}

export interface WorkflowStep {
  step: number;
  question: string;
  expectedEntity?: EntityType;
  validation?: (value: any) => boolean;
  suggestions?: string[];
}

// ==================== ACTION DISPATCHER CLASS ====================

export class ActionDispatcher {
  // Store references (injected from outside)
  private stores: { listing?: any; message?: any; order?: any; favorites?: any; auth?: any } = {};

  /**
   * Initialize with store references
   */
  public init(stores: any): void {
    this.stores = stores;
  }

  /**
   * Dispatch action based on intent
   */
  public async dispatch(payload: ActionPayload): Promise<ActionResult> {
    const { intent, entities, context, nlpResult } = payload;
    
    try {
      switch (intent) {
        case IntentType.CREATE_LISTING:
          return await this.handleCreateListing(entities, context);
        case IntentType.SEARCH_LISTING:
          return await this.handleSearchListing(entities, context);
        case IntentType.VIEW_LISTINGS:
          return await this.handleViewListings(context);
        case IntentType.EDIT_LISTING:
          return await this.handleEditListing(entities, context);
        case IntentType.DELETE_LISTING:
          return await this.handleDeleteListing(entities, context);
        case IntentType.BUY:
          return await this.handleBuy(entities, context);
        case IntentType.VIEW_ORDERS:
          return await this.handleViewOrders(context);
        case IntentType.SEND_MESSAGE:
          return await this.handleSendMessage(entities, context);
        case IntentType.VIEW_MESSAGES:
          return await this.handleViewMessages(context);
        case IntentType.VIEW_FAVORITES:
          return await this.handleViewFavorites(context);
        case IntentType.ADD_FAVORITE:
          return await this.handleAddFavorite(entities, context);
        case IntentType.VIEW_PROFILE:
          return await this.handleViewProfile(context);
        case IntentType.VIEW_STATS:
          return await this.handleViewStats(context);
        case IntentType.NAVIGATE:
          return await this.handleNavigate(entities, context);
        case IntentType.GET_HELP:
          return await this.handleGetHelp(entities, context);
        case IntentType.CONTACT_SUPPORT:
          return await this.handleContactSupport(context);
        case IntentType.REPORT_ISSUE:
          return await this.handleReportIssue(entities, context);
        default:
          return { success: false, message: "Je n'ai pas compris cette action. Peux-tu reformuler ?" };
      }
    } catch (error) {
      console.error('Action dispatch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "Désolé, une erreur s'est produite. Peux-tu réessayer ?"
      };
    }
  }

  /**
   * Get workflow steps for a multi-step action
   */
  public getWorkflowSteps(intent: IntentType): WorkflowStep[] {
    switch (intent) {
      case IntentType.CREATE_LISTING:
        return [
          { step: 1, question: "Super ! Quel article veux-tu vendre ? 📦", expectedEntity: EntityType.PRODUCT_NAME, suggestions: [] },
          { step: 2, question: "Dans quelle catégorie ? 🏷️", expectedEntity: EntityType.CATEGORY, suggestions: ['Livres', 'Électronique', 'Vêtements', 'Fournitures', 'Sport', 'Maison'] },
          { step: 3, question: "À quel prix ? (en €) 💰", expectedEntity: EntityType.PRICE, validation: (price: number) => price > 0 && price < 10000, suggestions: [] },
          { step: 4, question: "Quel est l'état de l'article ? 🔍", expectedEntity: EntityType.CONDITION, suggestions: ['Neuf', 'Comme neuf', 'Bon état', 'Usagé'] },
          { step: 5, question: "Ajoute une description et des photos ! 📸\n(Tu peux le faire directement sur la page de création)", suggestions: ['Ouvrir la page de création', 'Annuler'] }
        ];
      
      case IntentType.SEARCH_LISTING:
        return [
          { step: 1, question: "Que cherches-tu ? 🔍", expectedEntity: EntityType.PRODUCT_NAME, suggestions: [] },
          { step: 2, question: "Dans quelle catégorie ? (optionnel)", expectedEntity: EntityType.CATEGORY, suggestions: ['Toutes', 'Livres', 'Électronique', 'Vêtements', 'Fournitures', 'Sport'] },
          { step: 3, question: "Quel budget maximum ? (optionnel)", expectedEntity: EntityType.PRICE, suggestions: ['Pas de limite', '50€', '100€', '200€', '500€'] }
        ];
      
      default:
        return [];
    }
  }

  // ==================== ACTION HANDLERS ====================

  /**
   * Get contextual category suggestions based on product name
   */
  private getContextualCategorySuggestions(productName: string): string[] {
    const name = productName.toLowerCase();
    
    if (name.includes('livre') || name.includes('manuel') || name.includes('cours') || name.includes('bouquin') || name.includes('bd')) {
      return ['📚 Livres & Cours', '💻 Électronique', '👕 Vêtements', '📝 Fournitures'];
    }
    if (name.includes('ordi') || name.includes('pc') || name.includes('laptop') || name.includes('phone') || name.includes('téléphone') || name.includes('tablette') || name.includes('console')) {
      return ['💻 Électronique', '📚 Livres & Cours', '🔧 Services'];
    }
    if (name.includes('vêtement') || name.includes('vetement') || name.includes('pull') || name.includes('pantalon') || name.includes('chemise') || name.includes('chaussure')) {
      return ['👕 Vêtements', '📚 Livres & Cours', '🪑 Mobilier'];
    }
    if (name.includes('vélo') || name.includes('velo') || name.includes('mobilier') || name.includes('meuble') || name.includes('chaise') || name.includes('table')) {
      return ['🪑 Mobilier', '💻 Électronique', '👕 Vêtements'];
    }
    if (name.includes('logement') || name.includes('appartement') || name.includes('chambre') || name.includes('studio')) {
      return ['🏠 Logement', '🔧 Services'];
    }
    
    // Default suggestions
    return ['📚 Livres & Cours', '💻 Électronique', '👕 Vêtements', '🪑 Mobilier', '🏠 Logement', '🔧 Services'];
  }

  /**
   * Detect transaction type based on context and entities
   */
  private detectTransactionType(entities: Record<string, any>, productName?: string): 'sell' | 'gift' | 'swap' | 'service' {
    // If explicitly confirmed, use that
    if (entities.transactionTypeConfirmed) {
      return entities.transactionTypeConfirmed;
    }
    
    // Check explicit mentions in entities
    if (entities.isGift || entities.transactionType === 'gift') {
      return 'gift';
    }
    if (entities.isSwap || entities.transactionType === 'swap') {
      return 'swap';
    }
    if (entities.isService || entities.transactionType === 'service') {
      return 'service';
    }
    
    const name = (productName || '').toLowerCase();
    const price = entities.price;
    const category = entities.category;
    
    // Explicit mentions in product name
    if (name.includes('don') || name.includes('gratuit') || price === 0) {
      return 'gift';
    }
    if (name.includes('échange') || name.includes('troc') || name.includes('swap') || entities.desiredItems) {
      return 'swap';
    }
    if (name.includes('service') || name.includes('aide') || name.includes('cours') || category === 'services' || entities.hourlyRate) {
      return 'service';
    }
    if (category === 'housing' || name.includes('logement') || name.includes('chambre') || name.includes('appartement')) {
      return 'service'; // Housing uses service type
    }
    
    // Default to sell
    return 'sell';
  }

  /**
   * Get required fields for transaction type (matching CreateListingPage schema)
   * Note: transactionType is NOT in this list - it's handled separately as workflow step 0
   */
  private getRequiredFieldsForType(transactionType: 'sell' | 'gift' | 'swap' | 'service', category?: string): string[] {
    const baseFields = ['productName', 'category']; // Removed description and meetingLocation as they're optional
    
    if (category === 'housing') {
      return [...baseFields, 'roomType', 'monthlyRent', 'startDate', 'endDate'];
    }
    
    switch (transactionType) {
      case 'sell':
        return [...baseFields, 'price', 'condition', 'paymentMethods'];
      case 'gift':
        return [...baseFields, 'donationReason'];
      case 'swap':
        return [...baseFields, 'desiredItems', 'estimatedValue'];
      case 'service':
        return [...baseFields, 'hourlyRate', 'duration', 'skills'];
      default:
        return baseFields;
    }
  }

  private async handleCreateListing(entities: Record<string, any>, context: ContextEnrichment): Promise<ActionResult> {
    // 🚀 OPTIMIZED WORKFLOW - Using FSM architecture
    
    // 1. INITIALISATION & VALIDATION
    // Get activeWorkflow from context (may be in contextManager)
    const activeWorkflow = (context as any).activeWorkflow || null;
    const workflow = WorkflowManager.validateState(activeWorkflow);
    
    // Protection contre boucles infinies
    if (workflow.step > WorkflowManager['MAX_STEPS']) {
      return {
        success: false,
        message: '⚠️ Trop d\'étapes. Veux-tu recommencer ou continuer sur la page de création ?',
        data: {
          suggestions: ['🔄 Recommencer', '📝 Ouvrir la page de création'],
          workflow: null
        }
      };
    }

    // 2. EXTRACTION & MERGE - Extraction intelligente depuis texte libre
    const freeText = this.extractFreeText(entities, workflow.data);
    const extracted = EntityExtractor.extract(freeText);
    const merged = WorkflowManager.mergeData(workflow.data, entities, extracted);
    
    console.log('🔍 Extraction intelligente:', {
      freeText: freeText.substring(0, 50),
      extracted,
      confidence: extracted.confidence
    });

    // 3. DÉTERMINER TYPE DE TRANSACTION
    let transactionType: TransactionType = merged.transactionTypeConfirmed || 
                                          merged.transactionType || 
                                          this.detectTransactionType(merged, merged.productName);
    
    if (!merged.transactionTypeConfirmed) {
      // Si type inféré avec haute confiance, demander confirmation
      if (extracted.confidence > 0.7 && extracted.transactionType && !entities.transactionType) {
        return this.confirmInference(workflow, merged, extracted.transactionType);
      }
      
      // Si pas de type explicite, demander en premier
      if (!entities.transactionType && !merged.transactionType) {
        return this.askTransactionType(workflow, merged);
      }
      
      merged.transactionType = transactionType;
      merged.transactionTypeConfirmed = true;
    }
    
    transactionType = merged.transactionType as TransactionType;

    // 4. CALCULER CHAMPS MANQUANTS avec validation
    const requiredFields = ListingConfig.REQUIRED_FIELDS[transactionType] || [];
    const missing = this.calculateMissing(requiredFields, merged);

    // 5. VALIDATION DU DERNIER CHAMP SI NÉCESSAIRE
    if (workflow.lastField && entities[workflow.lastField]) {
      const field = requiredFields.find(f => f.name === workflow.lastField);
      if (field && !WorkflowManager.validateInput(field, entities[workflow.lastField])) {
        const updated = WorkflowManager.incrementCorrection(workflow, workflow.lastField);
        return this.askFieldWithError(field, workflow.step + 1, requiredFields.length, {
          ...updated,
          data: merged,
          missing
        });
      }
    }

    // 6. DEMANDER CHAMP SUIVANT
    if (missing.length > 0) {
      const nextField = WorkflowManager.getNextField(missing, transactionType, workflow);
      
      if (!nextField) {
        // Tous les champs ont dépassé MAX_CORRECTIONS
        return this.suggestManualCreation(merged, transactionType);
      }

      return this.askField(nextField, workflow.step + 1, requiredFields.length, {
        ...workflow,
        step: workflow.step + 1,
        data: merged,
        missing,
        lastField: nextField.name
      });
    }

    // 7. FINALISATION - Tout est prêt
    return this.finalizeAndNavigate(merged, transactionType, context);
  }

  // ========== HELPERS OPTIMISÉS ==========

  private extractFreeText(entities: Record<string, any>, data: Record<string, any>): string {
    return [
      entities.freeText,
      entities.text,
      entities.message,
      entities.productName,
      data.productName,
      data.title
    ].find(t => t && typeof t === 'string' && t.length > 0) || '';
  }

  private calculateMissing(fields: FieldConfig[], data: Record<string, any>): string[] {
    return fields
      .filter(f => !f.optional)
      .filter(f => {
        const value = data[f.name];
        if (f.name === 'price' || f.name === 'hourlyRate' || f.name === 'estimatedValue') {
          return ListingConfig.parsePrice(value) === null;
        }
        return value === undefined || value === null || value === '';
      })
      .map(f => f.name);
  }

  private askTransactionType(workflow: WorkflowState, data: Record<string, any>): ActionResult {
    const updatedWorkflow: WorkflowState = {
      ...workflow,
      step: 1,
      data,
      missing: ['transactionType'],
      corrections: {}
    };
    
    return {
      success: false,
      message: '🎯 **Étape 1/4** • Quel type d\'annonce créer ? 📋\n\n💡 **Choisis le type qui correspond le mieux :**\n• 💰 **Vente** - Tu veux vendre un article\n• 💝 **Don** - Tu veux donner un article gratuitement\n• 🔄 **Échange** - Tu veux échanger contre autre chose\n• 🔧 **Service** - Tu proposes un service (cours, aide, etc.)',
      nextStep: 'collect_transaction_type',
      data: {
        workflow: {
          type: 'create_listing',
          step: updatedWorkflow.step,
          transactionType: null,
          collected: updatedWorkflow.data,
          missing: updatedWorkflow.missing
        },
        suggestions: ['💰 Vendre', '💝 Donner', '🔄 Échanger', '🔧 Service']
      }
    };
  }

  private confirmInference(
    workflow: WorkflowState,
    data: Record<string, any>,
    inferred: TransactionType
  ): ActionResult {
    const labels: Record<TransactionType, string> = {
      sell: 'vendre',
      gift: 'donner',
      swap: 'échanger',
      service: 'proposer un service'
    };
    
    const updatedWorkflow: WorkflowState = {
      ...workflow,
      data: { ...data, transactionTypePending: inferred }
    };
    
    return {
      success: false,
      message: `✨ J'ai détecté que tu veux **${labels[inferred]}**. C'est ça ?`,
      data: {
        workflow: {
          type: 'create_listing',
          step: updatedWorkflow.step,
          transactionType: inferred,
          collected: updatedWorkflow.data,
          missing: updatedWorkflow.missing
        },
        suggestions: ['✅ Oui', '❌ Non, autre chose']
      },
      nextStep: 'confirm_transaction_type'
    };
  }

  private askField(
    field: FieldConfig,
    step: number,
    total: number,
    workflow: WorkflowState
  ): ActionResult {
    const transactionType = workflow.data.transactionType as TransactionType || 'sell';
    const recap = this.buildRecap(workflow.data, transactionType);
    const recapText = recap.length > 0 ? `\n\n**Récapitulatif :**\n${recap.join('\n')}\n` : '';
    
    return {
      success: false,
      message: `**Étape ${step}/${total}** • ${field.question}${recapText}`,
      nextStep: 'collect_field',
      data: {
        workflow: {
          type: 'create_listing',
          step: workflow.step,
          transactionType: transactionType,
          collected: workflow.data,
          missing: workflow.missing
        },
        suggestions: field.suggestions,
        askField: field.name
      }
    };
  }

  private askFieldWithError(
    field: FieldConfig,
    step: number,
    total: number,
    workflow: WorkflowState
  ): ActionResult {
    const transactionType = workflow.data.transactionType as TransactionType || 'sell';
    
    return {
      success: false,
      message: `❌ Format invalide. **Étape ${step}/${total}** • ${field.question}`,
      nextStep: 'collect_field',
      data: {
        workflow: {
          type: 'create_listing',
          step: workflow.step,
          transactionType: transactionType,
          collected: workflow.data,
          missing: workflow.missing,
          corrections: workflow.corrections
        },
        suggestions: [...field.suggestions, '⏭️ Passer'],
        askField: field.name,
        error: true
      }
    };
  }

  private suggestManualCreation(data: Record<string, any>, transactionType: TransactionType): ActionResult {
    return {
      success: false,
      message: '🤔 J\'ai du mal à compléter certains champs. Veux-tu continuer manuellement ?',
      data: {
        suggestions: ['📝 Ouvrir création manuelle', '🔄 Recommencer'],
        partialData: data,
        transactionType
      }
    };
  }

  private buildRecap(data: Record<string, any>, transactionType: TransactionType): string[] {
    const recap: string[] = [];
    if (data.productName || data.title) recap.push(`✅ Article : ${data.productName || data.title}`);
    if (data.category) recap.push(`✅ Catégorie : ${data.category}`);
    if (transactionType === 'sell' && data.price) recap.push(`✅ Prix : ${data.price}€`);
    if (transactionType === 'sell' && data.condition) recap.push(`✅ État : ${data.condition}`);
    if (transactionType === 'gift' && data.donationReason) recap.push(`✅ Raison du don`);
    if (transactionType === 'swap' && data.desiredItems) recap.push(`✅ Objets recherchés`);
    if (transactionType === 'service' && data.hourlyRate) recap.push(`✅ Tarif : ${data.hourlyRate}€/h`);
    return recap;
  }

  private finalizeAndNavigate(
    data: Record<string, any>,
    type: TransactionType,
    context: ContextEnrichment
  ): ActionResult {
    const prefill: any = {
      title: data.productName || data.title,
      category: data.category || 'other',
      description: data.description || `${data.productName || data.title}${data.category ? ` (${data.category})` : ''}`,
      transactionType: type // Ajouter le type pour le formulaire
    };

    // Type-specific fields - TOUS les champs nécessaires
    if (type === 'sell') {
      const parsedPrice = ListingConfig.parsePrice(data.price);
      if (parsedPrice !== null) {
        prefill.price = parsedPrice;
      }
      prefill.condition = data.condition || 'good';
      // Payment methods: array ou string
      if (data.paymentMethods) {
        prefill.paymentMethods = Array.isArray(data.paymentMethods) 
          ? data.paymentMethods 
          : [data.paymentMethods];
      } else {
        prefill.paymentMethods = [];
      }
    } else if (type === 'gift') {
      prefill.price = 0;
      if (data.donationReason) {
        prefill.donationReason = data.donationReason;
      }
    } else if (type === 'service') {
      const parsedHourlyRate = ListingConfig.parsePrice(data.hourlyRate);
      if (parsedHourlyRate !== null) {
        prefill.hourlyRate = parsedHourlyRate;
      } else {
        prefill.hourlyRate = 0;
      }
      prefill.duration = data.duration || 1;
      if (data.skills) {
        prefill.skills = data.skills;
      }
    } else if (type === 'swap') {
      if (data.desiredItems) {
        prefill.desiredItems = Array.isArray(data.desiredItems) 
          ? data.desiredItems 
          : [data.desiredItems];
      }
      const parsedEstimatedValue = ListingConfig.parsePrice(data.estimatedValue);
      if (parsedEstimatedValue !== null) {
        prefill.estimatedValue = parsedEstimatedValue;
      }
    }

    // Profile-based prefill
    const userProfile = (context as any).userProfile;
    if (userProfile?.preferredPaymentMethods && type === 'sell') {
      prefill.paymentMethods = userProfile.preferredPaymentMethods;
    }

    // Normaliser la catégorie pour l'URL
    const categoryForUrl = prefill.category || 'other';
    const createUrl = `/create?type=${type}${categoryForUrl !== 'other' ? `&category=${categoryForUrl}` : ''}`;

    console.log('📦 Final prefill data:', {
      ...prefill,
      url: createUrl
    });

    return {
      success: true,
      message: '✅ Parfait ! J\'ouvre la page avec tout pré-rempli. Tu n\'as plus qu\'à ajouter des photos. 📸',
      data: {
        action: 'navigate',
        path: createUrl,
        prefill
      },
      nextStep: 'navigate'
    };
  }

  private async handleSearchListing(entities: Record<string, any>, context: ContextEnrichment): Promise<ActionResult> {
    const category = entities.category;
    const price = entities.price;
    const productName = entities.productName;
    const condition = entities.condition;
    
    // Build search query
    const searchParams = new URLSearchParams();
    if (category) searchParams.append('category', category);
    if (price) searchParams.append('maxPrice', price.toString());
    if (productName) searchParams.append('q', productName);
    if (condition) searchParams.append('condition', condition);
    
    // Execute search via store if available
    if (this.stores.listing?.searchListings) {
      try {
        await this.stores.listing.searchListings({
          category, maxPrice: price, query: productName, condition
        });
        
        // Get results from store after search
        const results = this.stores.listing.listings || [];
        
        if (results.length > 0) {
          return {
            success: true,
            data: { action: 'display_results', results: results.slice(0, 5), searchParams },
            message: `J'ai trouvé ${results.length} résultat${results.length > 1 ? 's' : ''} ! 🎉\nVoici les meilleures correspondances :`,
            nextStep: 'display'
          };
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }
    
    // Fallback to navigation
    return {
      success: true,
      data: { action: 'navigate', path: `/listings?${searchParams.toString()}` },
      message: `Je lance la recherche ! 🔍`,
      nextStep: 'navigate'
    };
  }

  private async handleViewListings(context: ContextEnrichment): Promise<ActionResult> {
    // Use existing listings from store if available
    if (this.stores.listing?.listings) {
      const listings = this.stores.listing.listings;
      
      if (listings.length === 0) {
        return {
          success: true,
          data: { listings: [] },
          message: "Tu n'as pas encore d'annonces. Veux-tu en créer une ? 📦",
          nextStep: 'suggest_create'
        };
      }
      
      return {
        success: true,
        data: { action: 'display_listings', listings: listings.slice(0, 10) },
        message: `Voici tes annonces ! 📋`,
        nextStep: 'display'
      };
    }
    
    return {
      success: true,
      data: { action: 'navigate', path: '/listings' },
      message: "Je t'emmène voir les annonces ! 📋",
      nextStep: 'navigate'
    };
  }

  private async handleEditListing(entities: Record<string, any>, context: ContextEnrichment): Promise<ActionResult> {
    const listingId = context.resolvedReferences.listingId || entities.listingId;
    
    if (!listingId) {
      return {
        success: false,
        message: "Quelle annonce veux-tu modifier ? Peux-tu me donner plus de détails ?",
        nextStep: 'clarify'
      };
    }
    
    return {
      success: true,
      data: { action: 'navigate', path: `/edit/${listingId}` },
      message: "Je t'emmène modifier cette annonce ! ✏️",
      nextStep: 'navigate'
    };
  }

  private async handleDeleteListing(entities: Record<string, any>, context: ContextEnrichment): Promise<ActionResult> {
    const listingId = context.resolvedReferences.listingId || entities.listingId;
    
    if (!listingId) {
      return {
        success: false,
        message: "Quelle annonce veux-tu supprimer ? Dis-moi laquelle.",
        nextStep: 'clarify'
      };
    }
    
    // Request confirmation
    return {
      success: true,
      data: { action: 'request_confirmation', confirmAction: 'delete_listing', listingId },
      message: "Es-tu sûr(e) de vouloir supprimer cette annonce ? Cette action est irréversible. 🗑️",
      nextStep: 'await_confirmation'
    };
  }

  private async handleBuy(entities: Record<string, any>, context: ContextEnrichment): Promise<ActionResult> {
    const listingId = context.resolvedReferences.listingId || entities.listingId;
    
    if (!listingId) {
      return {
        success: false,
        message: "Quel article veux-tu acheter ? Montre-moi !",
        nextStep: 'clarify'
      };
    }
    
    return {
      success: true,
      data: { action: 'navigate', path: `/listing/${listingId}#buy` },
      message: "Je t'emmène finaliser ton achat ! 🛒",
      nextStep: 'navigate'
    };
  }

  private async handleViewOrders(context: ContextEnrichment): Promise<ActionResult> {
    // Use existing orders from store if available
    if (this.stores.order?.orders) {
      const orders = this.stores.order.orders;
      
      if (orders.length === 0) {
        return {
          success: true,
          data: { orders: [] },
          message: "Tu n'as pas encore de commandes. Explore les annonces ! 🔍",
          nextStep: 'suggest_search'
        };
      }
      
      return {
        success: true,
        data: { action: 'display_orders', orders: orders.slice(0, 10) },
        message: `Voici tes commandes ! 📦`,
        nextStep: 'display'
      };
    }
    
    return {
      success: true,
      data: { action: 'navigate', path: '/orders' },
      message: "Je t'emmène voir tes commandes ! 📦",
      nextStep: 'navigate'
    };
  }

  private async handleSendMessage(entities: Record<string, any>, context: ContextEnrichment): Promise<ActionResult> {
    const recipientId = entities.recipientId || context.resolvedReferences.listingOwnerId;
    
    if (!recipientId) {
      return {
        success: false,
        message: "À qui veux-tu écrire ? Précise-moi la personne ou l'annonce.",
        nextStep: 'clarify'
      };
    }
    
    return {
      success: true,
      data: { action: 'open_chat', recipientId },
      message: "J'ouvre la messagerie ! 💬",
      nextStep: 'open_chat'
    };
  }

  private async handleViewMessages(context: ContextEnrichment): Promise<ActionResult> {
    // Use existing conversations from store if available
    if (this.stores.message?.conversations) {
      const conversations = this.stores.message.conversations;
      
      if (conversations.length === 0) {
        return {
          success: true,
          data: { action: 'display_messages', conversations: [], unreadCount: 0 },
          message: "Tu n'as pas encore de messages. Explore les annonces et contacte des vendeurs ! 💬",
          nextStep: 'display'
        };
      }
      
      const unreadCount = conversations.filter((c: any) => c.hasUnread).length;
      
      return {
        success: true,
        data: { action: 'display_messages', conversations: conversations.slice(0, 10), unreadCount },
        message: unreadCount > 0
          ? `Tu as ${unreadCount} conversation${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''} ! 💬`
          : `Voici tes conversations ! 💬`,
        nextStep: 'display'
      };
    }
    
    return {
      success: true,
      data: { action: 'navigate', path: '/messages' },
      message: "Je t'emmène voir tes messages ! 💬",
      nextStep: 'navigate'
    };
  }

  private async handleViewFavorites(context: ContextEnrichment): Promise<ActionResult> {
    // Use existing favorites from store if available
    if (this.stores.favorites?.favorites) {
      const favorites = this.stores.favorites.favorites;
      
      if (favorites.length === 0) {
        return {
          success: true,
          data: { favorites: [] },
          message: "Tu n'as pas encore de favoris. Explore et sauvegarde ce qui t'intéresse ! ⭐",
          nextStep: 'suggest_search'
        };
      }
      
      return {
        success: true,
        data: { action: 'display_favorites', favorites: favorites.slice(0, 10) },
        message: `Tu as ${favorites.length} favori${favorites.length > 1 ? 's' : ''} ! ⭐`,
        nextStep: 'display'
      };
    }
    
    return {
      success: true,
      data: { action: 'navigate', path: '/favorites' },
      message: "Je t'emmène voir tes favoris ! ⭐",
      nextStep: 'navigate'
    };
  }

  private async handleAddFavorite(entities: Record<string, any>, context: ContextEnrichment): Promise<ActionResult> {
    const listingId = context.resolvedReferences.listingId || entities.listingId;
    
    if (!listingId) {
      return {
        success: false,
        message: "Quelle annonce veux-tu ajouter aux favoris ?",
        nextStep: 'clarify'
      };
    }
    
    // Note: addToFavorites requires listing object, not just listingId
    // For now, just navigate
    return {
      success: true,
      data: { action: 'navigate', path: `/listing/${listingId}` },
      message: "Je t'emmène à l'annonce pour que tu puisses l'ajouter aux favoris ! ⭐",
      nextStep: 'navigate'
    };
  }

  private async handleViewProfile(context: ContextEnrichment): Promise<ActionResult> {
    return {
      success: true,
      data: { action: 'navigate', path: '/profile' },
      message: "Je t'emmène voir ton profil ! 👤",
      nextStep: 'navigate'
    };
  }

  private async handleViewStats(context: ContextEnrichment): Promise<ActionResult> {
    // Stats not directly available, just navigate to profile
    return {
      success: true,
      data: { action: 'navigate', path: '/profile' },
      message: "Je t'emmène voir ton profil avec tes statistiques ! 📊",
      nextStep: 'navigate'
    };
  }

  private async handleNavigate(entities: Record<string, any>, context: ContextEnrichment): Promise<ActionResult> {
    const destination = entities.destination || entities.page;
    
    if (!destination) {
      return {
        success: false,
        message: "Où veux-tu aller ?",
        nextStep: 'clarify'
      };
    }
    
    const routes: Record<string, string> = {
      'accueil': '/',
      'home': '/',
      'recherche': '/search',
      'créer': '/create',
      'annonces': '/my-listings',
      'commandes': '/orders',
      'messages': '/messages',
      'favoris': '/favorites',
      'profil': '/profile'
    };
    
    const path = routes[destination.toLowerCase()] || '/';
    
    return {
      success: true,
      data: { action: 'navigate', path },
      message: `C'est parti ! 🚀`,
      nextStep: 'navigate'
    };
  }

  private async handleContactSupport(context: ContextEnrichment): Promise<ActionResult> {
    return {
      success: true,
      data: { action: 'display_contact' },
      message: "Bien sûr ! Remplis ce formulaire pour nous contacter. 📧",
      nextStep: 'display'
    };
  }

  private async handleReportIssue(entities: Record<string, any>, context: ContextEnrichment): Promise<ActionResult> {
    return {
      success: true,
      data: { action: 'display_contact' },
      message: "Bien sûr ! Utilise ce formulaire pour signaler le problème. 🐛",
      nextStep: 'display'
    };
  }

  private async handleGetHelp(entities: Record<string, any>, context: ContextEnrichment): Promise<ActionResult> {
    const topic = entities.topic;
    
    const helpTopics: Record<string, string> = {
      'créer': "Pour créer une annonce, clique sur le bouton ➕ en haut, ou dis-moi 'créer une annonce'.",
      'vendre': "Pour vendre, crée une annonce avec photos, description et prix. Je peux t'aider !",
      'acheter': "Pour acheter, recherche ce qui t'intéresse et contacte le vendeur via le chat.",
      'payer': "Le paiement se fait directement entre acheteur et vendeur. Restez prudents ! 💳",
      'default': `StudyMarket est une plateforme de marketplace étudiante ! 🎓

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

Dis-moi ce dont tu as besoin ! 😊`
    };
    
    const message = topic ? (helpTopics[topic] || helpTopics.default) : helpTopics.default;
    
    return {
      success: true,
      data: { topic },
      message,
      nextStep: 'help_provided'
    };
  }
}

// ==================== SINGLETON EXPORT ====================

export const actionDispatcher = new ActionDispatcher();

