import { verificationQueue } from '../queue/index';

/**
 * Service pour gérer la queue de validation
 */
export class QueueService {
  /**
   * Ajouter une demande de vérification à la queue
   */
  static async enqueueVerification(verificationId: string, userId: string, metadata?: any) {
    await verificationQueue.add(
      'validate',
      {
        verificationId,
        userId,
        metadata,
      },
      {
        jobId: verificationId, // Idempotence
        removeOnComplete: true,
      }
    );

    console.log(`✅ Verification ${verificationId} enqueued`);
  }

  /**
   * Obtenir le status d'un job
   */
  static async getJobStatus(verificationId: string) {
    const job = await verificationQueue.getJob(verificationId);
    
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress,
      data: job.data,
    };
  }

  /**
   * Retirer un job (si nécessaire)
   */
  static async removeJob(verificationId: string) {
    const job = await verificationQueue.getJob(verificationId);
    if (job) {
      await job.remove();
      console.log(`🗑️ Job ${verificationId} removed`);
    }
  }
}

