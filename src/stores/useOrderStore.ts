import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc,
  orderBy,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CartItem } from './useCartStore';
import toast from 'react-hot-toast';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    university?: string;
  };
  payment: {
    method: string;
    details: any;
    transactionId?: string;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderStore {
  orders: Order[];
  loading: boolean;
  
  // Actions
  fetchUserOrders: (userId: string) => Promise<void>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order['status'], notes?: string) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
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

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: false,

  fetchUserOrders: async (userId: string) => {
    if (!userId) return;

    try {
      set({ loading: true });
      
      // Query with orderBy - requires index: userId + createdAt (desc)
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      const orders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        } as Order);
      });
      
      // No need to sort since we're using orderBy in the query
      
      set({ orders, loading: false });
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erreur lors du chargement des commandes');
      set({ loading: false });
    }
  },

  getOrderById: async (orderId: string) => {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      
      if (orderDoc.exists()) {
        const data = orderDoc.data();
        return {
          id: orderDoc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        } as Order;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      toast.error('Erreur lors du chargement de la commande');
      return null;
    }
  },

  createOrder: async (orderData) => {
    try {
      // Generate a security code for the order
      const securityCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const order = {
        ...orderData,
        securityCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), order);
      
      // Update local state
      const newOrder: Order = {
        id: docRef.id,
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      set(state => ({
        orders: [newOrder, ...state.orders]
      }));

      toast.success('Commande créée avec succès !');
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erreur lors de la création de la commande');
      throw error;
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status'], notes?: string) => {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (notes) {
        updateData.notes = notes;
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);

      // Update local state
      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId
            ? { ...order, status, notes: notes || order.notes, updatedAt: new Date() }
            : order
        )
      }));

      toast.success(`Statut de la commande mis à jour : ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  },

  cancelOrder: async (orderId: string, reason: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        notes: reason,
        updatedAt: serverTimestamp()
      });

      // Update local state
      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId
            ? { ...order, status: 'cancelled', notes: reason, updatedAt: new Date() }
            : order
        )
      }));

      toast.success('Commande annulée');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Erreur lors de l\'annulation de la commande');
    }
  }
}));