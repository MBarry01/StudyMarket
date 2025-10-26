import { VerificationStatus } from '../types';
import toast from 'react-hot-toast';

export class NotificationService {
  /**
   * Notification pour changement de statut de vérification
   */
  static notifyVerificationStatusChange(
    status: VerificationStatus,
    reason?: string
  ): void {
    switch (status) {
      case VerificationStatus.VERIFIED:
        toast.success(
          '🎉 Félicitations ! Votre compte étudiant est maintenant vérifié.',
          { duration: 5000 }
        );
        break;

      case VerificationStatus.DOCUMENTS_SUBMITTED:
        toast.success(
          '📤 Vos documents ont été soumis. La vérification est en cours.',
          { duration: 4000 }
        );
        break;

      case VerificationStatus.UNDER_REVIEW:
        toast(
          '👀 Votre demande est en cours de revue par un administrateur.',
          { duration: 4000, icon: '🔍' }
        );
        break;

      case VerificationStatus.REJECTED:
        toast.error(
          reason 
            ? `✗ Demande rejetée : ${reason}` 
            : '✗ Votre demande a été rejetée.',
          { duration: 6000 }
        );
        break;

      case VerificationStatus.SUSPENDED:
        toast.error(
          '⚠️ Votre compte a été suspendu. Contactez le support.',
          { duration: 6000 }
        );
        break;

      default:
        break;
    }
  }

  /**
   * Notification pour admin - nouvelle demande
   */
  static notifyAdminNewRequest(userName: string): void {
    toast.success(
      `Nouvelle demande de vérification de ${userName}`,
      { duration: 3000 }
    );
  }

  /**
   * Notification pour upload documents
   */
  static notifyDocumentUpload(count: number): void {
    toast.success(
      `${count} document${count > 1 ? 's' : ''} téléversé${count > 1 ? 's' : ''} avec succès`,
      { duration: 3000 }
    );
  }

  /**
   * Notification pour erreur upload
   */
  static notifyUploadError(error?: string): void {
    toast.error(
      error || 'Erreur lors du téléversement. Veuillez réessayer.',
      { duration: 4000 }
    );
  }
}

