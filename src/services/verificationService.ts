import { doc, collection, addDoc, updateDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { VerificationStatus, VerificationDocument as DocType, VerificationMetadata, StudentVerification } from '../types';
import { AuditService } from './auditService';
import { AutoValidationService } from './autoValidationService';
import { QueueService } from './queueService';

export interface VerificationDocument {
  type: 'student_card' | 'enrollment_certificate' | 'grades_transcript' | 'id_card' | 'selfie';
  url: string;
  filename: string;
  size: number;
  checksum?: string;
  uploadedAt: Date;
}

export interface VerificationRequest extends StudentVerification {
  userEmail: string;
  userName: string;
  studentId?: string;
  graduationYear?: number;
  fieldOfStudy?: string;
  campus?: string;
}

export class VerificationService {
  private static readonly COLLECTION = 'verification_requests';
  private static readonly ALLOWED_DOMAINS = [
    '.edu', 'univ-', '.ac.', 'student.', 'etudiant.', 'etu.',
    'sorbonne-universite.fr',
    'sorbonne-nouvelle.fr', 'dauphine.psl.eu', 'polytechnique.edu',
    'ens.fr', 'centralesupelec.fr', 'mines-paristech.fr',
    'gmail.com' // Temporaire pour tests
  ];

  /**
   * Mapper les anciens statuts vers les nouveaux
   */
  private static mapStatus(oldStatus: string): VerificationStatus {
    if (oldStatus === 'pending') return VerificationStatus.DOCUMENTS_SUBMITTED;
    if (oldStatus === 'approved' || oldStatus === 'verified') return VerificationStatus.VERIFIED;
    if (oldStatus === 'rejected') return VerificationStatus.REJECTED;
    if (oldStatus === 'under_review') return VerificationStatus.UNDER_REVIEW;
    if (oldStatus === 'documents_submitted') return VerificationStatus.DOCUMENTS_SUBMITTED;
    if (oldStatus === 'suspended') return VerificationStatus.SUSPENDED;
    if (oldStatus === 'unverified') return VerificationStatus.UNVERIFIED;
    // Si c'est déjà un bon statut, le retourner tel quel
    return oldStatus as VerificationStatus;
  }

  /**
   * Validation automatique
   */
  private static async performAutoValidation(
    userId: string,
    documents: VerificationDocument[]
  ): Promise<VerificationStatus> {
    // Récupérer l'utilisateur
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return VerificationStatus.UNVERIFIED;
    }

    const userData = userSnap.data();
    const metadata: VerificationMetadata = {
      email_domain_ok: false,
      id_expiry_ok: true, // Par défaut OK
    };

    // Check 1: Email domain
    const userEmail = userData.email || '';
    const emailDomainOk = this.ALLOWED_DOMAINS.some(domain => 
      userEmail.toLowerCase().includes(domain)
    );
    metadata.email_domain_ok = emailDomainOk;

    // Check 2: Type de documents
    const hasStudentCard = documents.some(d => d.type === 'student_card');
    const hasEnrollmentCert = documents.some(d => d.type === 'enrollment_certificate');
    const hasRequiredDocs = hasStudentCard || hasEnrollmentCert;

    // Check 3: Nombre de tentatives
    const verificationHistory = await this.getVerificationHistory(userId);
    metadata.fraud_signals = {
      disposable_email: false, // À implémenter
      ip_mismatch: false, // À implémenter
      multiple_attempts: verificationHistory.length > 3,
    };

    // Logique de décision
    if (!emailDomainOk) {
      // Email non universitaire → revue manuelle
      return VerificationStatus.UNDER_REVIEW;
    }

    if (!hasRequiredDocs) {
      // Documents manquants → revue manuelle
      return VerificationStatus.UNDER_REVIEW;
    }

    if (metadata.fraud_signals?.multiple_attempts) {
      // Trop de tentatives → revue manuelle
      return VerificationStatus.UNDER_REVIEW;
    }

    // Auto-approve si tous les checks passent
    return VerificationStatus.VERIFIED;
  }

  /**
   * Demander la vérification de son compte étudiant
   */
  static async requestVerification(
    userId: string,
    userData: {
      email: string;
      displayName: string;
      university: string;
      studentId?: string;
      graduationYear?: number;
      fieldOfStudy?: string;
      campus?: string;
    },
    documents: File[]
  ): Promise<void> {
    try {
      // 1. Uploader les documents vers Firebase Storage
      const uploadedDocuments: VerificationDocument[] = [];
      
      for (const doc of documents) {
        const fileRef = ref(storage, `verifications/${userId}/${Date.now()}_${doc.name}`);
        await uploadBytes(fileRef, doc);
        const url = await getDownloadURL(fileRef);
        
        uploadedDocuments.push({
          type: this.getDocumentType(doc.name),
          url,
          filename: doc.name,
          size: doc.size,
          uploadedAt: new Date(),
        });
      }

      // 2. Validation automatique avec les services cloud
      console.log('🤖 Démarrage validation automatique...');
      let validationResult;
      let finalStatus = VerificationStatus.DOCUMENTS_SUBMITTED;
      
      try {
        const validationDocs = uploadedDocuments.map(d => ({
          url: d.url,
          filename: d.filename,
          type: d.type,
        }));

        validationResult = await AutoValidationService.validate(
          userData.email,
          validationDocs,
          {
            ipAddress: 'client', // TODO: Récupérer IP réelle
            previousAttempts: 0, // TODO: Compter tentatives réelles
          }
        );

        console.log('✅ Validation automatique terminée:', validationResult);

        // Déterminer le statut final basé sur la recommandation
        if (validationResult.recommendation === 'auto_approve' && validationResult.passed) {
          finalStatus = VerificationStatus.VERIFIED;
          console.log('🎉 Auto-approbation ! Score:', validationResult.score);
        } else if (validationResult.recommendation === 'reject') {
          finalStatus = VerificationStatus.REJECTED;
          console.log('❌ Rejet automatique. Score:', validationResult.score);
        } else {
          finalStatus = VerificationStatus.UNDER_REVIEW;
          console.log('⚠️ Revue admin nécessaire. Score:', validationResult.score);
        }
      } catch (validationError) {
        console.error('⚠️ Erreur validation automatique:', validationError);
        // Continuer avec statut par défaut (documents_submitted)
        finalStatus = VerificationStatus.DOCUMENTS_SUBMITTED;
      }

      // 3. Créer la demande de vérification avec statut final
      const baseMetadata: any = {
        email_domain_ok: false,
        id_expiry_ok: false,
        ocr_text: {},
        face_match: { confidence: 0, verified: false },
        fraud_signals: { disposable_email: false, ip_mismatch: false, multiple_attempts: false },
        studentId: userData.studentId,
        university: userData.university,
        graduationYear: userData.graduationYear,
        fieldOfStudy: userData.fieldOfStudy,
        campus: userData.campus,
      };

      // Ajouter les résultats de validation automatique si disponible
      const finalMetadata = {
        ...baseMetadata,
        ...(validationResult && {
          auto_validation_score: validationResult.score,
          auto_validation_recommendation: validationResult.recommendation,
          auto_validation_checks: validationResult.checks,
          auto_validation_flags: validationResult.flags,
          ocr_result: validationResult.details?.ocr,
          face_match_result: validationResult.details?.faceMatch,
          antivirus_results: validationResult.details?.antivirus,
        }),
      };

      const verificationRequest: Omit<VerificationRequest, 'id' | 'metadata'> & { metadata?: any } = {
        userId,
        userEmail: userData.email,
        userName: userData.displayName,
        documents: uploadedDocuments,
        status: finalStatus, // Utiliser le statut déterminé par validation automatique
        attemptsCount: 1,
        submittedAt: new Date(),
        createdAt: new Date(),
        metadata: finalMetadata,
      };

      // Filtrer les champs undefined dans metadata
      const cleanMetadata = Object.fromEntries(
        Object.entries(verificationRequest.metadata!).filter(([_, value]) => value !== undefined)
      );

      // Filtrer les champs undefined pour éviter l'erreur Firestore
      const cleanRequest = Object.fromEntries(
        Object.entries({
          ...verificationRequest,
          metadata: Object.keys(cleanMetadata).length > 0 ? cleanMetadata : undefined,
          documents: uploadedDocuments.map(doc => ({
            ...doc,
            uploadedAt: Date.now(), // ✅ Pas serverTimestamp() dans un array
          })),
        }).filter(([_, value]) => value !== undefined)
      );

      const docRef = await addDoc(collection(db, this.COLLECTION), cleanRequest);
      const verificationId = docRef.id;

      // TODO: Enqueue worker job pour validation serveur
      // await QueueService.enqueueVerification(verificationId, userId, { documents: uploadedDocuments });

      // 4. Mettre à jour le statut de l'utilisateur avec le statut final
      const userRef = doc(db, 'users', userId);
      const userUpdateData: any = {
        verificationStatus: finalStatus,
      };

      // Si auto-vérifié, marquer comme vérifié
      if (finalStatus === VerificationStatus.VERIFIED) {
        userUpdateData.isVerified = true;
        console.log('✅ Utilisateur vérifié automatiquement !');
      } else {
        userUpdateData.isVerified = false;
      }

      await updateDoc(userRef, userUpdateData);

      // 5. Logger l'action d'audit
      await AuditService.log({
        userId,
        action: 'renew',
        targetType: 'verification_request',
        targetId: 'new',
        metadata: {
          previousStatus: 'unverified',
          newStatus: finalStatus,
          score: validationResult?.score,
          recommendation: validationResult?.recommendation,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la demande de vérification:', error);
      throw error;
    }
  }

  /**
   * Obtenir le statut de vérification d'un utilisateur
   */
  static async getVerificationStatus(userId: string): Promise<VerificationRequest | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        // Trier manuellement par date (plus récent en premier)
        return { doc, data };
      }).sort((a, b) => {
        const dateA = a.data.submittedAt?.toDate?.()?.getTime() || a.data.requestedAt?.toDate?.()?.getTime() || 0;
        const dateB = b.data.submittedAt?.toDate?.()?.getTime() || b.data.requestedAt?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      }).map(({ doc, data }) => {
        const status = data.status;
        
        return {
          id: doc.id,
          ...data,
          status: this.mapStatus(status),
          submittedAt: data.submittedAt?.toDate() || data.requestedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
          documents: data.documents?.map((d: any) => ({
            ...d,
            // uploadedAt est un Number (Date.now()), pas un Firestore Timestamp
            uploadedAt: typeof d.uploadedAt === 'number' 
              ? new Date(d.uploadedAt) 
              : (d.uploadedAt?.toDate?.() || new Date()),
          })) || [],
        } as VerificationRequest;
      });

      return docs[0];
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      return null;
    }
  }

  /**
   * Approuver une demande de vérification (Admin only)
   */
  static async approveVerification(
    requestId: string,
    adminId: string
  ): Promise<void> {
    try {
      const requestRef = doc(db, this.COLLECTION, requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Demande de vérification introuvable');
      }

      const data = requestSnap.data();
      
      // 1. Mettre à jour la demande
      await updateDoc(requestRef, {
        status: VerificationStatus.VERIFIED,
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
      });

      // 2. Mettre à jour le statut de l'utilisateur
      const userRef = doc(db, 'users', data.userId);
      await updateDoc(userRef, {
        verificationStatus: VerificationStatus.VERIFIED,
        isVerified: true,
      });

      // 3. Logger l'action d'audit
      await AuditService.logApproval(
        requestId,
        adminId,
        {
          documentsCount: data.documents?.length || 0,
          previousStatus: data.status,
        }
      );
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      throw error;
    }
  }

  /**
   * Rejeter une demande de vérification (Admin only)
   */
  static async rejectVerification(
    requestId: string,
    reason: string,
    adminId: string
  ): Promise<void> {
    try {
      const requestRef = doc(db, this.COLLECTION, requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Demande de vérification introuvable');
      }

      const data = requestSnap.data();
      
      // 1. Mettre à jour la demande
      await updateDoc(requestRef, {
        status: VerificationStatus.REJECTED,
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        rejectionReason: reason,
      });

      // 2. Mettre à jour le statut de l'utilisateur
      const userRef = doc(db, 'users', data.userId);
      await updateDoc(userRef, {
        verificationStatus: VerificationStatus.REJECTED,
        isVerified: false,
      });

      // 3. Logger l'action d'audit
      await AuditService.logRejection(
        requestId,
        adminId,
        reason,
        {
          previousStatus: data.status,
          riskLevel: 'medium', // ou calculé basé sur metadata
        }
      );

      // 4. Supprimer les documents (optionnel)
      // await this.deleteVerificationDocuments(data.documents);
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      throw error;
    }
  }

  /**
   * Révoquer une certification (Admin only)
   */
  static async revokeVerification(
    requestId: string,
    reason: string,
    adminId: string
  ): Promise<void> {
    try {
      const requestRef = doc(db, this.COLLECTION, requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Demande de vérification introuvable');
      }

      const data = requestSnap.data();
      
      // 1. Mettre à jour la demande (status = suspended)
      await updateDoc(requestRef, {
        status: VerificationStatus.SUSPENDED,
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        revocationReason: reason,
      });

      // 2. Mettre à jour le statut de l'utilisateur
      const userRef = doc(db, 'users', data.userId);
      await updateDoc(userRef, {
        verificationStatus: VerificationStatus.SUSPENDED,
        isVerified: false,
      });

      // 3. Logger l'action d'audit
      await AuditService.logRevocation(
        requestId,
        adminId,
        reason,
        {
          riskLevel: 'high',
          previousStatus: data.status,
        }
      );
    } catch (error) {
      console.error('Erreur lors de la révocation:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'historique des demandes d'un utilisateur
   */
  static async getVerificationHistory(userId: string): Promise<VerificationRequest[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        const status = data.status;
        
        return {
          id: doc.id,
          ...data,
          status: this.mapStatus(status),
          submittedAt: data.submittedAt?.toDate() || data.requestedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
          documents: data.documents?.map((d: any) => ({
            ...d,
            // uploadedAt est un Number (Date.now()), pas un Firestore Timestamp
            uploadedAt: typeof d.uploadedAt === 'number' 
              ? new Date(d.uploadedAt) 
              : (d.uploadedAt?.toDate?.() || new Date()),
          })) || [],
        } as VerificationRequest;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  /**
   * Obtenir toutes les demandes (Admin only)
   */
  static async getAllRequests(statusFilter?: 'all' | 'pending' | 'approved' | 'rejected'): Promise<VerificationRequest[]> {
    try {
      let snapshot;
      
      if (statusFilter && statusFilter !== 'all') {
        // Filtrer par status avec where (nécessite index)
        const q = query(
          collection(db, this.COLLECTION),
          where('status', '==', statusFilter)
        );
        snapshot = await getDocs(q);
      } else {
        // Pour 'all', récupérer tout sans filtre
        snapshot = await getDocs(collection(db, this.COLLECTION));
      }
      
      const requests = snapshot.docs.map(doc => {
        const data = doc.data();
        const status = data.status;
        
        return {
          id: doc.id,
          ...data,
          status: this.mapStatus(status),
          submittedAt: data.submittedAt?.toDate() || data.requestedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
          documents: data.documents?.map((d: any) => ({
            ...d,
            // uploadedAt est un Number (Date.now()), pas un Firestore Timestamp
            uploadedAt: typeof d.uploadedAt === 'number' 
              ? new Date(d.uploadedAt) 
              : (d.uploadedAt?.toDate?.() || new Date()),
          })) || [],
        } as VerificationRequest;
      });
      
      // Trier manuellement par date (plus récent en premier)
      requests.sort((a, b) => {
        const dateA = a.submittedAt instanceof Date ? a.submittedAt.getTime() : 0;
        const dateB = b.submittedAt instanceof Date ? b.submittedAt.getTime() : 0;
        return dateB - dateA;
      });
      
      return requests;
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error);
      return [];
    }
  }

  /**
   * Obtenir toutes les demandes en attente (Admin only)
   * @deprecated Utiliser getAllRequests('pending') à la place
   */
  static async getPendingRequests(): Promise<VerificationRequest[]> {
    return this.getAllRequests('pending');
  }

  /**
   * Déterminer le type de document à partir du nom du fichier
   */
  private static getDocumentType(fileName: string): VerificationDocument['type'] {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.includes('card') || lowerName.includes('carte')) {
      return 'student_card';
    } else if (lowerName.includes('certificate') || lowerName.includes('certificat') || lowerName.includes('enrollment')) {
      return 'enrollment_certificate';
    } else if (lowerName.includes('transcript') || lowerName.includes('releve') || lowerName.includes('notes')) {
      return 'grades_transcript';
    } else if (lowerName.includes('id') || lowerName.includes('identity') || lowerName.includes('identite')) {
      return 'id_card';
    }
    
    return 'student_card'; // Par défaut
  }

  /**
   * Supprimer les documents de vérification
   */
  private static async deleteVerificationDocuments(documents: VerificationDocument[]): Promise<void> {
    for (const doc of documents) {
      try {
        const docRef = ref(storage, doc.url);
        await deleteObject(docRef);
      } catch (error) {
        console.error('Erreur lors de la suppression du document:', error);
      }
    }
  }

  /**
   * Écouter les changements de statut de vérification en temps réel - V2
   */
  static subscribeToVerificationStatus(
    userId: string,
    callback: (status: VerificationRequest | null) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId)
      // Temporairement retiré orderBy pour éviter les problèmes d'index
      // orderBy('submittedAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(null);
          return;
        }

        // Trier manuellement par date (plus récent en premier)
        const docs = snapshot.docs.map(doc => {
          const data = doc.data();
          return { doc, data };
        }).sort((a, b) => {
          const dateA = a.data.submittedAt?.toDate?.()?.getTime() || a.data.requestedAt?.toDate?.()?.getTime() || 0;
          const dateB = b.data.submittedAt?.toDate?.()?.getTime() || b.data.requestedAt?.toDate?.()?.getTime() || 0;
          return dateB - dateA;
        }).map(({ doc, data }) => {
          const status = data.status;
          
          return {
            id: doc.id,
            ...data,
            status: this.mapStatus(status),
            submittedAt: data.submittedAt?.toDate() || data.requestedAt?.toDate() || new Date(),
            reviewedAt: data.reviewedAt?.toDate(),
            documents: data.documents?.map((d: any) => ({
              ...d,
              uploadedAt: typeof d.uploadedAt === 'number' 
                ? new Date(d.uploadedAt) 
                : (d.uploadedAt?.toDate?.() || new Date()),
            })) || [],
          } as VerificationRequest;
        });

        // Retourner le plus récent
        callback(docs[0]);
      },
      (error) => {
        console.error('Erreur listener Firestore:', error);
        callback(null);
      }
    );
  }

  /**
   * Marquer une demande comme "under_review" quand un admin l'ouvre
   */
  static async markAsUnderReview(requestId: string, adminId?: string): Promise<void> {
    try {
      const requestRef = doc(db, this.COLLECTION, requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Demande de vérification introuvable');
      }

      const data = requestSnap.data();
      const currentStatus = data.status;

      // Ne changer que si le statut est "documents_submitted" ou "unverified"
      if (currentStatus === 'documents_submitted' || currentStatus === 'pending') {
        console.log(`🔄 Mise à jour de ${requestId}: ${currentStatus} → under_review`);
        await updateDoc(requestRef, {
          status: 'under_review',
          reviewStartedAt: serverTimestamp(),
        });
        console.log(`✅ Statut mis à jour pour ${requestId}`);
        
        // Logger l'action d'audit si adminId fourni
        if (adminId) {
          await AuditService.logUnderReview(requestId, adminId, {
            documentsCount: data.documents?.length || 0,
            previousStatus: currentStatus,
          });
        }
      } else {
        console.log(`⚠️ Statut actuel ${currentStatus}, pas de changement pour ${requestId}`);
      }
    } catch (error) {
      console.error('Erreur lors du passage en "en revue":', error);
      // Ne pas bloquer l'affichage en cas d'erreur
    }
  }

  /**
   * Écouter toutes les demandes de vérification en temps réel (Admin)
   */
  static subscribeToAllRequests(
    statusFilter?: 'all' | 'pending' | 'approved' | 'rejected',
    callback?: (data: VerificationRequest[]) => void
  ): Unsubscribe {
    let q;
    
    if (statusFilter && statusFilter !== 'all') {
      q = query(
        collection(db, this.COLLECTION),
        where('status', '==', statusFilter)
      );
    } else {
      // Pas d'orderBy pour éviter les problèmes d'index Firestore
      q = query(
        collection(db, this.COLLECTION)
        // orderBy('submittedAt', 'desc') - désactivé temporairement
      );
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const requests = snapshot.docs.map(doc => {
          const data = doc.data();
          const status = data.status;
          
          return {
            id: doc.id,
            ...data,
            status: this.mapStatus(status),
            submittedAt: data.submittedAt?.toDate() || data.requestedAt?.toDate() || new Date(),
            reviewedAt: data.reviewedAt?.toDate(),
            documents: data.documents?.map((d: any) => ({
              ...d,
              uploadedAt: typeof d.uploadedAt === 'number' 
                ? new Date(d.uploadedAt) 
                : (d.uploadedAt?.toDate?.() || new Date()),
            })) || [],
          } as VerificationRequest;
        });

        // Trier manuellement par date (plus récent en premier)
        requests.sort((a, b) => {
          const dateA = a.submittedAt instanceof Date ? a.submittedAt.getTime() : 0;
          const dateB = b.submittedAt instanceof Date ? b.submittedAt.getTime() : 0;
          return dateB - dateA;
        });

        callback?.(requests);
      },
      (error) => {
        console.error('Erreur listener admin Firestore:', error);
      }
    );
  }
}

