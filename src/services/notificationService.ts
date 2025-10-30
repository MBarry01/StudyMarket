import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

export interface CreateNotificationParams {
  userId: string;
  type: 'message' | 'listing' | 'order' | 'verification' | 'system' | 'review' | 'safety';
  title: string;
  message: string;
  data?: {
    url?: string;
    listingId?: string;
    orderId?: string;
    conversationId?: string;
    [key: string]: any;
  };
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Service de notifications pour créer automatiquement des notifications
 * selon les actions des utilisateurs et admins
 */
export class NotificationService {
  /**
   * Créer une notification dans Firestore
   */
  private static async createNotification(params: CreateNotificationParams) {
    try {
      const notificationData = {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data || {},
        read: false,
        priority: params.priority || 'normal',
        createdAt: serverTimestamp(),
        expiresAt: null as any
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      console.log(`✅ Notification créée: ${docRef.id}`);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Erreur création notification:', error);
      throw error;
    }
  }

  /**
   * 📋 Notification: Annonce soumise et en attente de validation
   */
  static async notifyListingPending(
    userId: string,
    listingId: string,
    listingTitle: string
  ) {
    return await this.createNotification({
      userId,
      type: 'listing',
      title: '📋 Annonce en attente de validation',
      message: `Votre annonce "${listingTitle}" a été soumise et sera publiée après approbation.`,
      data: { url: `/listing/${listingId}`, listingId },
      priority: 'normal'
    });
  }

  /**
   * 🛡️ Notification: Nouvelle annonce à valider (diffusion admins)
   * Note: En l'absence d'un système de rôles complet, on envoie sur un userId "admin_broadcast".
   * Les apps admin peuvent écouter ce canal et redistribuer si nécessaire.
   */
  static async notifyAdminNewListing(
    listingId: string,
    listingTitle: string,
    sellerName: string
  ) {
    const adminBroadcastUserId = 'admin_broadcast';
    return await this.createNotification({
      userId: adminBroadcastUserId,
      type: 'listing',
      title: '🛡️ Nouvelle annonce à valider',
      message: `${sellerName} a créé "${listingTitle}"`,
      data: { url: `/admin/listings?highlight=${listingId}`, listingId },
      priority: 'high'
    });
  }

  /**
   * ✅ Notification: Annonce approuvée
   */
  static async notifyListingApproved(
    userId: string,
    listingId: string,
    listingTitle: string
  ) {
    return await this.createNotification({
      userId,
      type: 'listing',
      title: '✅ Annonce approuvée',
      message: `Votre annonce "${listingTitle}" est maintenant visible publiquement.`,
      data: { url: `/listing/${listingId}`, listingId },
      priority: 'high'
    });
  }

  /**
   * ❌ Notification: Annonce refusée
   */
  static async notifyListingRejected(
    userId: string,
    listingId: string,
    listingTitle: string,
    reason?: string
  ) {
    return await this.createNotification({
      userId,
      type: 'listing',
      title: '❌ Annonce refusée',
      message: reason ? `"${listingTitle}" a été refusée: ${reason}` : `"${listingTitle}" a été refusée.`,
      data: { url: `/listing/${listingId}`, listingId },
      priority: 'normal'
    });
  }

  /**
   * 💬 Notification : Nouveau message reçu
   */
  static async notifyNewMessage(
    recipientUserId: string,
    senderName: string,
    listingTitle: string,
    conversationId: string
  ) {
    return await this.createNotification({
      userId: recipientUserId,
      type: 'message',
      title: `💬 Message de ${senderName}`,
      message: `Nouveau message concernant "${listingTitle}"`,
      data: {
        url: `/messages?conversation=${conversationId}`,
        conversationId
      },
      priority: 'high'
    });
  }

  /**
   * 📝 Notification : Nouvelle annonce correspond à votre recherche
   */
  static async notifyNewListingMatch(
    userId: string,
    listingId: string,
    listingTitle: string,
    listingCategory: string
  ) {
    return await this.createNotification({
      userId,
      type: 'listing',
      title: `🔍 Nouvelle annonce correspondant à votre recherche`,
      message: `${listingTitle} (${listingCategory})`,
      data: {
        url: `/listing/${listingId}`,
        listingId
      },
      priority: 'normal'
    });
  }

  /**
   * 🛒 Notification : Nouvelle commande
   */
  static async notifyNewOrder(
    sellerUserId: string,
    orderId: string,
    listingTitle: string,
    buyerName: string
  ) {
    return await this.createNotification({
      userId: sellerUserId,
      type: 'order',
      title: `🛒 Nouvelle commande`,
      message: `${buyerName} a acheté "${listingTitle}"`,
      data: {
        url: `/orders/${orderId}`,
        orderId
      },
      priority: 'high'
    });
  }

  /**
   * 📦 Notification : Changement de statut de commande
   */
  static async notifyOrderStatusChange(
    userId: string,
    orderId: string,
    status: string,
    listingTitle: string
  ) {
    const statusLabels: Record<string, string> = {
      'pending': '⏳ En attente',
      'confirmed': '✅ Confirmée',
      'shipped': '📦 Expédiée',
      'delivered': '🎉 Livrée',
      'cancelled': '❌ Annulée'
    };

    return await this.createNotification({
      userId,
      type: 'order',
      title: `📦 Statut de commande mis à jour`,
      message: `Votre commande "${listingTitle}" est maintenant ${statusLabels[status] || status}`,
      data: {
        url: `/orders/${orderId}`,
        orderId
      },
      priority: 'normal'
    });
  }

  /**
   * ✅ Notification : Document de vérification approuvé
   */
  static async notifyVerificationApproved(userId: string) {
    return await this.createNotification({
      userId,
      type: 'verification',
      title: `🎉 Votre compte est vérifié !`,
      message: `Félicitations ! Vous êtes maintenant un étudiant certifié.`,
      data: {
        url: '/profile'
      },
      priority: 'high'
    });
  }

  /**
   * ❌ Notification : Document de vérification rejeté
   */
  static async notifyVerificationRejected(userId: string, reason?: string) {
    return await this.createNotification({
      userId,
      type: 'verification',
      title: `❌ Demande de vérification rejetée`,
      message: reason || `Votre demande a été rejetée. Veuillez réessayer.`,
      data: {
        url: '/verification'
      },
      priority: 'high'
    });
  }

  /**
   * ⚙️ Notification : Changement de statut de vérification
   */
  static async notifyVerificationStatusChange(
    userId: string,
    status: string
  ) {
    const statusLabels: Record<string, string> = {
      'pending': '📋 En attente',
      'under_review': '👀 En cours de revue',
      'approved': '✅ Approuvée',
      'rejected': '❌ Rejetée'
    };

    return await this.createNotification({
      userId,
      type: 'verification',
      title: `🔄 Statut de vérification mis à jour`,
      message: `Votre demande est maintenant ${statusLabels[status] || status}`,
      data: {
        url: '/verification'
      },
      priority: 'normal'
    });
  }

  /**
   * ⭐ Notification : Nouvel avis reçu
   */
  static async notifyNewReview(
    userId: string,
    reviewerName: string,
    rating: number
  ) {
    return await this.createNotification({
      userId,
      type: 'review',
      title: `⭐ Nouvel avis de ${reviewerName}`,
      message: `Vous avez reçu ${rating} étoile${rating > 1 ? 's' : ''}`,
      data: {
        url: '/profile'
      },
      priority: 'normal'
    });
  }

  /**
   * 🚨 Notification : Rapport de sécurité
   */
  static async notifySafetyReport(
    userId: string,
    reportType: string,
    listingTitle?: string
  ) {
    return await this.createNotification({
      userId,
      type: 'safety',
      title: `🚨 Rapport de sécurité`,
      message: `Un rapport a été créé concernant ${listingTitle || 'votre compte'}`,
      data: {
        url: '/reports'
      },
      priority: 'high'
    });
  }

  /**
   * 📢 Notification : Annonce administrative
   */
  static async notifySystemAnnouncement(
    userId: string,
    title: string,
    message: string,
    url?: string
  ) {
    return await this.createNotification({
      userId,
      type: 'system',
      title: `📢 ${title}`,
      message,
      data: {
        url: url || '/'
      },
      priority: 'normal'
    });
  }

  /**
   * 💰 Notification : Paiement reçu
   */
  static async notifyPaymentReceived(
    userId: string,
    amount: number,
    orderId: string
  ) {
    return await this.createNotification({
      userId,
      type: 'order',
      title: `💰 Paiement reçu`,
      message: `Vous avez reçu ${amount}€ pour votre commande`,
      data: {
        url: `/orders/${orderId}`,
        orderId
      },
      priority: 'high'
    });
  }

  /**
   * 📉 Notification : Changement de prix
   */
  static async notifyPriceDrop(
    userId: string,
    listingId: string,
    listingTitle: string,
    newPrice: number,
    oldPrice: number
  ) {
    const discount = ((oldPrice - newPrice) / oldPrice * 100).toFixed(0);
    
    return await this.createNotification({
      userId,
      type: 'listing',
      title: `📉 Réduction de ${discount}% !`,
      message: `${listingTitle} est maintenant à ${newPrice}€ (au lieu de ${oldPrice}€)`,
      data: {
        url: `/listing/${listingId}`,
        listingId
      },
      priority: 'normal'
    });
  }

  /**
   * 🎁 Notification : Offre spéciale
   */
  static async notifySpecialOffer(
    userId: string,
    listingId: string,
    listingTitle: string,
    offer: string
  ) {
    return await this.createNotification({
      userId,
      type: 'listing',
      title: `🎁 Offre spéciale !`,
      message: `${listingTitle}: ${offer}`,
      data: {
        url: `/listing/${listingId}`,
        listingId
      },
      priority: 'normal'
    });
  }
}
