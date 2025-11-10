/**
 * ⚡ Action Dispatcher Expert - Exécution d'Actions
 * Dispatch des actions basées sur les intentions détectées
 */

import { IntentType, EntityType, NLPResult } from './nlpEngine';
import { ContextEnrichment } from './contextManager';

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

  private async handleCreateListing(entities: Record<string, any>, context: ContextEnrichment): Promise<ActionResult> {
    const category = entities.category;
    const price = entities.price;
    const condition = entities.condition;
    const productName = entities.productName;
    
    // Check missing information
    if (context.missingInformation.length > 0) {
      return {
        success: false,
        message: `D'accord ! Pour créer ton annonce, j'ai besoin de quelques infos. ${
          context.missingInformation.includes('category')
            ? 'Quelle catégorie ?'
            : context.missingInformation.includes('price')
            ? 'Quel prix ?'
            : 'Parle-moi de ton article.'
        }`,
        nextStep: 'collect_missing_info'
      };
    }
    
    // All info present - redirect to creation page with pre-filled data
    return {
      success: true,
      data: {
        action: 'navigate',
        path: '/create',
        prefill: { category, price, condition, title: productName }
      },
      message: `Parfait ! Je t'emmène sur la page de création avec tes infos déjà remplies. Il ne te restera plus qu'à ajouter photos et description ! ✨`,
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

