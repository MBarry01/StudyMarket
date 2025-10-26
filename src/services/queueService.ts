/**
 * Service pour communiquer avec le backend pour les jobs de validation
 * 
 * Le vrai worker tourne côté backend (worker/verificationWorker.js)
 * Ce service envoie des requêtes au backend pour enqueue
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export class QueueService {
  /**
   * Enqueue une vérification côté serveur
   */
  static async enqueueVerification(verificationId: string, userId: string, metadata?: any) {
    try {
      console.log(`📤 Enqueueing verification ${verificationId}...`);
      
      // Appel au backend (Express) qui va enqueue le job
      const response = await fetch(`${API_BASE}/api/verification/enqueue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, userId, metadata }),
      });

      if (!response.ok) {
        throw new Error(`Failed to enqueue: ${response.statusText}`);
      }

      console.log(`✅ Verification ${verificationId} enqueued successfully`);
    } catch (error) {
      console.error('⚠️ Failed to enqueue job:', error);
      // Ne pas bloquer - continue le flow
    }
  }

  /**
   * Obtenir le status d'un job (pas encore implémenté)
   */
  static async getJobStatus(verificationId: string) {
    // TODO: Implémenter via API backend
    return null;
  }

  /**
   * Retirer un job (pas encore implémenté)
   */
  static async removeJob(verificationId: string) {
    // TODO: Implémenter via API backend
  }
}
