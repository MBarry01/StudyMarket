import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { VerificationAuditEntry } from '../types';

export interface AuditLogData {
  userId: string;
  action: 'approve' | 'reject' | 'revoke' | 'cancel' | 'mark_under_review' | 'renew';
  targetType: 'verification_request' | 'user' | 'document';
  targetId: string;
  metadata?: {
    reason?: string;
    score?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    documentsCount?: number;
    previousStatus?: string;
    newStatus?: string;
    attemptsCount?: number;
    autoValidationScore?: number;
    recommendation?: 'auto_approve' | 'admin_review' | 'reject';
    autoValidationChecks?: any;
    autoValidationFlags?: any;
  };
}

export class AuditService {
  private static readonly COLLECTION = 'verification_audit_logs';

  /**
   * Enregistrer une action d'audit
   */
  static async log(data: AuditLogData): Promise<string> {
    try {
      const auditEntry = {
        ...data,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), auditEntry);
      console.log(`✅ Audit log créé: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erreur création audit log:', error);
      throw error;
    }
  }

  /**
   * Obtenir les logs d'audit pour une demande de vérification
   */
  static async getAuditLogsForRequest(requestId: string): Promise<VerificationAuditEntry[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('targetType', '==', 'verification_request'),
        where('targetId', '==', requestId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      })) as VerificationAuditEntry[];
    } catch (error) {
      console.error('Erreur récupération audit logs:', error);
      return [];
    }
  }

  /**
   * Obtenir les logs d'audit pour un utilisateur
   */
  static async getAuditLogsForUser(userId: string, limitCount: number = 50): Promise<AuditLogData[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      })) as AuditLogData[];
    } catch (error) {
      console.error('Erreur récupération audit logs utilisateur:', error);
      return [];
    }
  }

  /**
   * Obtenir tous les logs d'audit (Admin only)
   */
  static async getAllAuditLogs(limitCount: number = 100): Promise<VerificationAuditEntry[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      })) as VerificationAuditEntry[];
    } catch (error) {
      console.error('Erreur récupération audit logs:', error);
      return [];
    }
  }

  /**
   * Logger l'approbation d'une vérification
   */
  static async logApproval(
    requestId: string,
    adminId: string,
    metadata?: { score?: number; documentsCount?: number; previousStatus?: string; newStatus?: string }
  ): Promise<void> {
    await this.log({
      userId: adminId,
      action: 'approve',
      targetType: 'verification_request',
      targetId: requestId,
      metadata: {
        newStatus: 'verified',
        ...metadata,
      },
    });
  }

  /**
   * Logger le rejet d'une vérification
   */
  static async logRejection(
    requestId: string,
    adminId: string,
    reason: string,
    metadata?: { score?: number; riskLevel?: 'low' | 'medium' | 'high'; previousStatus?: string }
  ): Promise<void> {
    await this.log({
      userId: adminId,
      action: 'reject',
      targetType: 'verification_request',
      targetId: requestId,
      metadata: {
        reason,
        newStatus: 'rejected',
        ...metadata,
      },
    });
  }

  /**
   * Logger la révocation d'une vérification
   */
  static async logRevocation(
    requestId: string,
    adminId: string,
    reason: string,
    metadata?: { riskLevel?: 'low' | 'medium' | 'high'; previousStatus?: string }
  ): Promise<void> {
    await this.log({
      userId: adminId,
      action: 'revoke',
      targetType: 'verification_request',
      targetId: requestId,
      metadata: {
        reason,
        newStatus: 'suspended',
        ...metadata,
      },
    });
  }

  /**
   * Logger l'annulation d'une demande
   */
  static async logCancellation(
    requestId: string,
    adminId: string,
    reason?: string,
    metadata?: { previousStatus?: string }
  ): Promise<void> {
    await this.log({
      userId: adminId,
      action: 'cancel',
      targetType: 'verification_request',
      targetId: requestId,
      metadata: {
        reason,
        newStatus: 'unverified',
        ...metadata,
      },
    });
  }

  /**
   * Logger le passage en "under_review"
   */
  static async logUnderReview(
    requestId: string,
    adminId: string,
    metadata?: { documentsCount?: number; previousStatus?: string }
  ): Promise<void> {
    await this.log({
      userId: adminId,
      action: 'mark_under_review',
      targetType: 'verification_request',
      targetId: requestId,
      metadata: {
        newStatus: 'under_review',
        ...metadata,
      },
    });
  }

  /**
   * Logger le renouvellement d'une demande
   */
  static async logRenewal(
    requestId: string,
    userId: string,
    metadata?: { previousStatus?: string; attemptsCount?: number }
  ): Promise<void> {
    await this.log({
      userId,
      action: 'renew',
      targetType: 'verification_request',
      targetId: requestId,
      metadata: {
        newStatus: 'documents_submitted',
        ...metadata,
      },
    });
  }
}

