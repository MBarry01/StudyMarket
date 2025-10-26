import { doc, collection, addDoc, updateDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { VerificationStatus, VerificationDocument as DocType, VerificationMetadata, StudentVerification } from '../types';

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
          fileName: doc.name,
          uploadedAt: new Date(),
        });
      }

      // 2. Créer la demande de vérification
      const verificationRequest: Omit<VerificationRequest, 'id'> = {
        userId,
        userEmail: userData.email,
        userName: userData.displayName,
        university: userData.university,
        studentId: userData.studentId,
        graduationYear: userData.graduationYear,
        fieldOfStudy: userData.fieldOfStudy,
        campus: userData.campus,
        documents: uploadedDocuments,
        status: 'pending',
        requestedAt: new Date(),
      };

      await addDoc(collection(db, this.COLLECTION), {
        ...verificationRequest,
        requestedAt: serverTimestamp(),
        documents: uploadedDocuments.map(doc => ({
          ...doc,
          uploadedAt: serverTimestamp(),
        })),
      });

      // 3. Mettre à jour le statut de l'utilisateur
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        verificationStatus: 'pending',
        isVerified: false,
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
        where('userId', '==', userId),
        orderBy('requestedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate(),
        documents: doc.data().documents.map((d: any) => ({
          ...d,
          uploadedAt: d.uploadedAt?.toDate() || new Date(),
        })),
      })) as VerificationRequest[];

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
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
      });

      // 2. Mettre à jour le statut de l'utilisateur
      const userRef = doc(db, 'users', data.userId);
      await updateDoc(userRef, {
        verificationStatus: 'verified',
        isVerified: true,
      });
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
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        rejectionReason: reason,
      });

      // 2. Mettre à jour le statut de l'utilisateur
      const userRef = doc(db, 'users', data.userId);
      await updateDoc(userRef, {
        verificationStatus: 'rejected',
        isVerified: false,
      });

      // 3. Supprimer les documents (optionnel)
      // await this.deleteVerificationDocuments(data.documents);
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
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
        where('userId', '==', userId),
        orderBy('requestedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate(),
        documents: doc.data().documents.map((d: any) => ({
          ...d,
          uploadedAt: d.uploadedAt?.toDate() || new Date(),
        })),
      })) as VerificationRequest[];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  /**
   * Obtenir toutes les demandes en attente (Admin only)
   */
  static async getPendingRequests(): Promise<VerificationRequest[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate(),
        documents: doc.data().documents.map((d: any) => ({
          ...d,
          uploadedAt: d.uploadedAt?.toDate() || new Date(),
        })),
      })) as VerificationRequest[];
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error);
      return [];
    }
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
}

