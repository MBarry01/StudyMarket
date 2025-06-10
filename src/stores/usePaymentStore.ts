import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import toast from 'react-hot-toast';

export interface PaymentMethod {
  id: string;
  type: 'cash' | 'transfer' | 'paypal' | 'lydia';
  name: string;
  icon: string;
  description: string;
  fees: number; // Percentage
  processingTime: string;
  securityLevel: 'low' | 'medium' | 'high';
  available: boolean;
}

export interface PaymentRequest {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod['type'];
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed';
  meetingLocation?: string;
  meetingDateTime?: Date;
  paymentDetails?: {
    paypalEmail?: string;
    lydiaPhone?: string;
    bankDetails?: {
      iban?: string;
      bic?: string;
      accountName?: string;
    };
  };
  securityCode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentStore {
  paymentMethods: PaymentMethod[];
  paymentRequests: PaymentRequest[];
  loading: boolean;
  
  // Actions
  initializePaymentMethods: () => void;
  createPaymentRequest: (request: Omit<PaymentRequest, 'id' | 'createdAt' | 'updatedAt' | 'securityCode'>) => Promise<string>;
  updatePaymentStatus: (requestId: string, status: PaymentRequest['status'], notes?: string) => Promise<void>;
  fetchUserPaymentRequests: (userId: string) => Promise<void>;
  generateSecurityCode: () => string;
  validatePaymentMethod: (method: PaymentMethod['type'], details: any) => boolean;
  calculateFees: (amount: number, method: PaymentMethod['type']) => number;
  getPaymentInstructions: (method: PaymentMethod['type'], request: PaymentRequest) => string[];
}

// Helper function to safely convert dates
const safeToDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (date && typeof date.toDate === 'function') {
    try {
      return date.toDate();
    } catch (error) {
      return new Date();
    }
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }
  if (date && typeof date === 'object' && date.seconds) {
    return new Date(date.seconds * 1000);
  }
  return new Date();
};

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  paymentMethods: [],
  paymentRequests: [],
  loading: false,

  initializePaymentMethods: () => {
    const methods: PaymentMethod[] = [
      {
        id: 'cash',
        type: 'cash',
        name: 'Espèces',
        icon: '💵',
        description: 'Paiement en liquide lors de la rencontre',
        fees: 0,
        processingTime: 'Immédiat',
        securityLevel: 'medium',
        available: true
      },
      {
        id: 'transfer',
        type: 'transfer',
        name: 'Virement bancaire',
        icon: '🏦',
        description: 'Virement SEPA sécurisé',
        fees: 0,
        processingTime: '1-2 jours ouvrés',
        securityLevel: 'high',
        available: true
      },
      {
        id: 'paypal',
        type: 'paypal',
        name: 'PayPal',
        icon: '💳',
        description: 'Paiement sécurisé via PayPal',
        fees: 2.9,
        processingTime: 'Immédiat',
        securityLevel: 'high',
        available: true
      },
      {
        id: 'lydia',
        type: 'lydia',
        name: 'Lydia',
        icon: '📱',
        description: 'Paiement mobile instantané',
        fees: 0,
        processingTime: 'Immédiat',
        securityLevel: 'medium',
        available: true
      }
    ];

    set({ paymentMethods: methods });
  },

  createPaymentRequest: async (requestData) => {
    try {
      set({ loading: true });

      // Generate security code
      const securityCode = get().generateSecurityCode();

      const paymentRequest = {
        ...requestData,
        securityCode,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'paymentRequests'), paymentRequest);

      // Update local state
      const newRequest: PaymentRequest = {
        id: docRef.id,
        ...requestData,
        securityCode,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      set(state => ({
        paymentRequests: [newRequest, ...state.paymentRequests],
        loading: false
      }));

      toast.success('Demande de paiement créée avec succès');
      return docRef.id;

    } catch (error) {
      console.error('Erreur lors de la création de la demande de paiement:', error);
      toast.error('Erreur lors de la création de la demande de paiement');
      set({ loading: false });
      throw error;
    }
  },

  updatePaymentStatus: async (requestId: string, status: PaymentRequest['status'], notes?: string) => {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (notes) {
        updateData.notes = notes;
      }

      await updateDoc(doc(db, 'paymentRequests', requestId), updateData);

      // Update local state
      set(state => ({
        paymentRequests: state.paymentRequests.map(request =>
          request.id === requestId
            ? { ...request, status, notes: notes || request.notes, updatedAt: new Date() }
            : request
        )
      }));

      const statusMessages = {
        confirmed: 'Paiement confirmé',
        completed: 'Paiement terminé',
        cancelled: 'Paiement annulé',
        disputed: 'Litige signalé'
      };

      toast.success(statusMessages[status] || 'Statut mis à jour');

    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  },

  fetchUserPaymentRequests: async (userId: string) => {
    if (!userId) return;

    try {
      set({ loading: true });

      // Fetch as buyer
      const buyerQuery = query(
        collection(db, 'paymentRequests'),
        where('buyerId', '==', userId),
        limit(50)
      );

      // Fetch as seller
      const sellerQuery = query(
        collection(db, 'paymentRequests'),
        where('sellerId', '==', userId),
        limit(50)
      );

      const [buyerSnapshot, sellerSnapshot] = await Promise.all([
        getDocs(buyerQuery),
        getDocs(sellerQuery)
      ]);

      const requests: PaymentRequest[] = [];

      // Process buyer requests
      buyerSnapshot.forEach(doc => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
          meetingDateTime: data.meetingDateTime ? safeToDate(data.meetingDateTime) : undefined
        } as PaymentRequest);
      });

      // Process seller requests
      sellerSnapshot.forEach(doc => {
        const data = doc.data();
        // Avoid duplicates
        if (!requests.find(r => r.id === doc.id)) {
          requests.push({
            id: doc.id,
            ...data,
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
            meetingDateTime: data.meetingDateTime ? safeToDate(data.meetingDateTime) : undefined
          } as PaymentRequest);
        }
      });

      // Sort by creation date
      requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      set({ paymentRequests: requests, loading: false });

    } catch (error) {
      console.error('Erreur lors du chargement des demandes de paiement:', error);
      toast.error('Erreur lors du chargement des demandes de paiement');
      set({ loading: false });
    }
  },

  generateSecurityCode: () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  validatePaymentMethod: (method: PaymentMethod['type'], details: any) => {
    switch (method) {
      case 'cash':
        return true; // No validation needed for cash

      case 'transfer':
        return details.bankDetails && 
               details.bankDetails.iban && 
               details.bankDetails.accountName;

      case 'paypal':
        return details.paypalEmail && 
               /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.paypalEmail);

      case 'lydia':
        return details.lydiaPhone && 
               /^(\+33|0)[1-9](\d{8})$/.test(details.lydiaPhone.replace(/\s/g, ''));

      default:
        return false;
    }
  },

  calculateFees: (amount: number, method: PaymentMethod['type']) => {
    const { paymentMethods } = get();
    const paymentMethod = paymentMethods.find(m => m.type === method);
    
    if (!paymentMethod) return 0;
    
    return (amount * paymentMethod.fees) / 100;
  },

  getPaymentInstructions: (method: PaymentMethod['type'], request: PaymentRequest) => {
    const instructions: string[] = [];

    switch (method) {
      case 'cash':
        instructions.push(
          '💵 Paiement en espèces',
          '📍 Rencontrez-vous au lieu convenu',
          '🔍 Vérifiez l\'objet avant de payer',
          '🧾 Demandez un reçu si nécessaire',
          `🔐 Code de sécurité : ${request.securityCode}`
        );
        break;

      case 'transfer':
        instructions.push(
          '🏦 Virement bancaire SEPA',
          '📋 Utilisez les coordonnées bancaires fournies',
          '💬 Indiquez la référence de transaction',
          '⏱️ Délai : 1-2 jours ouvrés',
          `🔐 Code de sécurité : ${request.securityCode}`
        );
        if (request.paymentDetails?.bankDetails) {
          instructions.push(
            `📊 IBAN : ${request.paymentDetails.bankDetails.iban}`,
            `🏛️ Titulaire : ${request.paymentDetails.bankDetails.accountName}`
          );
        }
        break;

      case 'paypal':
        instructions.push(
          '💳 Paiement PayPal',
          '📧 Envoyez le paiement à l\'adresse email fournie',
          '🛡️ Utilisez "Biens et services" pour la protection',
          '⚡ Paiement instantané',
          `🔐 Code de sécurité : ${request.securityCode}`
        );
        if (request.paymentDetails?.paypalEmail) {
          instructions.push(`📧 Email PayPal : ${request.paymentDetails.paypalEmail}`);
        }
        break;

      case 'lydia':
        instructions.push(
          '📱 Paiement Lydia',
          '📞 Envoyez le paiement au numéro fourni',
          '💬 Indiquez la référence de transaction',
          '⚡ Paiement instantané',
          `🔐 Code de sécurité : ${request.securityCode}`
        );
        if (request.paymentDetails?.lydiaPhone) {
          instructions.push(`📞 Numéro Lydia : ${request.paymentDetails.lydiaPhone}`);
        }
        break;
    }

    return instructions;
  }
}));