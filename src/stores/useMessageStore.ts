import { create } from 'zustand';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type: 'text' | 'image' | 'system';
  attachments?: string[];
  seen: boolean;
  sentAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  listingPrice: number;
  participantDetails: {
    [userId: string]: {
      name: string;
      avatar?: string;
      university: string;
      verified: boolean;
      email?: string; // Added for email notifications
    };
  };
  lastMessage?: {
    text: string;
    sentAt: Date;
    senderId: string;
    senderName: string;
  };
  unreadCount: { [userId: string]: number };
  blockedBy?: string[];
  deletedFor?: string[];
  status: 'active' | 'archived' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  conversationId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}

interface MessageStore {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  unsubscribeConversations?: () => void;
  unsubscribeMessages?: () => void;
  
  // Actions
  fetchConversations: (userId: string) => void;
  fetchMessages: (conversationId: string) => void;
  sendMessage: (conversationId: string, text: string, senderId: string, senderName: string, senderAvatar?: string) => Promise<void>;
  createConversation: (listingId: string, listingTitle: string, listingPrice: number, listingImage: string | undefined, buyerId: string, sellerId: string, buyerInfo: any, sellerInfo: any, initialMessage: string) => Promise<string>;
  markMessagesAsSeen: (conversationId: string, userId: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  blockUser: (conversationId: string, userId: string) => Promise<void>;
  reportUser: (conversationId: string, reporterId: string, reportedUserId: string, reason: string, description: string) => Promise<void>;
  deleteConversation: (conversationId: string, userId: string) => Promise<void>;
  findConversationByListing: (listingId: string, userId: string) => Conversation | null;
  cleanup: () => void;
}

// Helper function to convert Firestore timestamp to Date
const safeToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      return new Date();
    }
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date();
};

// Generate conversation ID
const generateConversationId = (userId1: string, userId2: string, listingId: string): string => {
  const sortedUsers = [userId1, userId2].sort();
  return `${sortedUsers[0]}_${sortedUsers[1]}_${listingId}`;
};

// Send email notification
const sendEmailNotification = async (
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  senderUniversity: string,
  listingTitle: string,
  messagePreview: string,
  conversationId: string
) => {
  try {
    // Only send email if we have a valid email address
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.log('No valid email address for notification');
      return;
    }

    const conversationUrl = `${window.location.origin}/messages?conversation=${conversationId}`;
    
    const response = await fetch('/api/send-message-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientEmail,
        recipientName,
        senderName,
        senderUniversity,
        listingTitle,
        messagePreview,
        conversationUrl,
      }),
    });

    if (response.ok) {
      console.log('Email notification sent successfully');
    } else {
      console.error('Failed to send email notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't show error to user as email notification is not critical
  }
};

export const useMessageStore = create<MessageStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,

  fetchConversations: (userId: string) => {
    set({ loading: true });
    
    // Clean up previous listener
    const { unsubscribeConversations } = get();
    if (unsubscribeConversations) {
      unsubscribeConversations();
    }

    try {
      // Query with orderBy - requires index: participants (array-contains) + updatedAt (desc)
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const conversations: Conversation[] = [];
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // Skip if user has deleted this conversation
          if (data.deletedFor && data.deletedFor.includes(userId)) {
            return;
          }
          
          // Skip if conversation is blocked by current user
          if (data.blockedBy && data.blockedBy.includes(userId)) {
            return;
          }

          conversations.push({
            id: doc.id,
            participants: data.participants || [],
            listingId: data.listingId || '',
            listingTitle: data.listingTitle || '',
            listingImage: data.listingImage,
            listingPrice: data.listingPrice || 0,
            participantDetails: data.participantDetails || {},
            lastMessage: data.lastMessage ? {
              ...data.lastMessage,
              sentAt: safeToDate(data.lastMessage.sentAt)
            } : undefined,
            unreadCount: data.unreadCount || {},
            blockedBy: data.blockedBy || [],
            deletedFor: data.deletedFor || [],
            status: data.status || 'active',
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt),
          });
        });

        // No need to sort since we're using orderBy in the query

        set({ conversations, loading: false, unsubscribeConversations: unsubscribe });
      }, (error) => {
        console.error('Error fetching conversations:', error);
        toast.error('Erreur lors du chargement des conversations');
        set({ loading: false });
      });

    } catch (error) {
      console.error('Error setting up conversations listener:', error);
      set({ loading: false });
    }
  },

  fetchMessages: (conversationId: string) => {
    // Clean up previous listener
    const { unsubscribeMessages } = get();
    if (unsubscribeMessages) {
      unsubscribeMessages();
    }

    try {
      // Query with orderBy - requires index: conversationId + sentAt (asc)
      const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('sentAt', 'asc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages: Message[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            conversationId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            text: data.text,
            type: data.type || 'text',
            attachments: data.attachments || [],
            seen: data.seen || false,
            sentAt: safeToDate(data.sentAt),
          };
        });

        // No need to sort since we're using orderBy in the query

        set({ messages, unsubscribeMessages: unsubscribe });
      }, (error) => {
        console.error('Error fetching messages:', error);
        toast.error('Erreur lors du chargement des messages');
      });

    } catch (error) {
      console.error('Error setting up messages listener:', error);
    }
  },

  sendMessage: async (conversationId: string, text: string, senderId: string, senderName: string, senderAvatar?: string) => {
    try {
      console.log('Sending message:', { conversationId, text, senderId, senderName });
      
      const conversation = get().currentConversation;
      if (!conversation) {
        console.error('No current conversation');
        return;
      }

      // Check if user is blocked
      if (conversation.blockedBy && conversation.blockedBy.includes(senderId)) {
        toast.error('Vous ne pouvez pas envoyer de message dans cette conversation');
        return;
      }

      // Détecter si le message est une image (URL)
      const isImage = text.startsWith('https://') && (text.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || text.includes('firebasestorage'));
      const messageType = isImage ? 'image' : 'text';
      
      // Add message to subcollection
      const messageData = {
        conversationId,
        senderId,
        senderName,
        senderAvatar: senderAvatar || null,
        text,
        type: messageType,
        seen: false,
        sentAt: serverTimestamp(),
      };

      console.log('Adding message to Firestore:', messageData);
      const messageRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);
      console.log('Message added with ID:', messageRef.id);

      // Update conversation's last message and unread counts
      const otherParticipants = conversation.participants.filter(p => p !== senderId);
      const unreadUpdates: { [key: string]: number } = {};
      
      otherParticipants.forEach(participantId => {
        unreadUpdates[`unreadCount.${participantId}`] = (conversation.unreadCount[participantId] || 0) + 1;
      });

      console.log('Updating conversation with:', {
        lastMessage: {
          text,
          sentAt: serverTimestamp(),
          senderId,
          senderName,
        },
        updatedAt: serverTimestamp(),
        ...unreadUpdates,
      });

      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: {
          text,
          sentAt: serverTimestamp(),
          senderId,
          senderName,
        },
        updatedAt: serverTimestamp(),
        ...unreadUpdates,
      });

      // Send email notification to other participants
      otherParticipants.forEach(async (participantId) => {
        const participantDetails = conversation.participantDetails[participantId];
        if (participantDetails && participantDetails.email) {
          const senderDetails = conversation.participantDetails[senderId];
          
          await sendEmailNotification(
            participantDetails.email,
            participantDetails.name,
            senderName,
            senderDetails?.university || 'Université non spécifiée',
            conversation.listingTitle,
            text,
            conversationId
          );
        }
      });

      // Create push notification for other participants
      const { NotificationService } = await import('../services/notificationService');
      otherParticipants.forEach(async (participantId) => {
        try {
          await NotificationService.notifyNewMessage(
            participantId,
            senderName,
            conversation.listingTitle,
            conversationId
          );
        } catch (error) {
          console.error('Erreur création notification push:', error);
        }
      });

      console.log('Message sent successfully');

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  },

  createConversation: async (listingId: string, listingTitle: string, listingPrice: number, listingImage: string | undefined, buyerId: string, sellerId: string, buyerInfo: any, sellerInfo: any, initialMessage: string) => {
    try {
      console.log('Creating conversation:', { listingId, buyerId, sellerId });
      
      const conversationId = generateConversationId(buyerId, sellerId, listingId);
      console.log('Generated conversation ID:', conversationId);
      
      // Check if conversation already exists
      const existingConv = await getDoc(doc(db, 'conversations', conversationId));
      
      if (existingConv.exists()) {
        console.log('Conversation already exists, sending message');
        // Conversation exists, create conversation object and set it as current
        const conversationData = existingConv.data();
        const conversation: Conversation = {
          id: conversationId,
          participants: conversationData.participants || [],
          listingId: conversationData.listingId || '',
          listingTitle: conversationData.listingTitle || '',
          listingImage: conversationData.listingImage,
          listingPrice: conversationData.listingPrice || 0,
          participantDetails: conversationData.participantDetails || {},
          lastMessage: conversationData.lastMessage ? {
            ...conversationData.lastMessage,
            sentAt: safeToDate(conversationData.lastMessage.sentAt)
          } : undefined,
          unreadCount: conversationData.unreadCount || {},
          blockedBy: conversationData.blockedBy || [],
          deletedFor: conversationData.deletedFor || [],
          status: conversationData.status || 'active',
          createdAt: safeToDate(conversationData.createdAt),
          updatedAt: safeToDate(conversationData.updatedAt),
        };
        
        // Set as current conversation BEFORE sending message
        set({ currentConversation: conversation });
        
        // Now send the message
        await get().sendMessage(conversationId, initialMessage, buyerId, buyerInfo.displayName, buyerInfo.photoURL);
        
        return conversationId;
      }

      console.log('Creating new conversation');
      // Create new conversation
      const conversationData = {
        participants: [buyerId, sellerId],
        listingId,
        listingTitle,
        listingImage: listingImage || null,
        listingPrice,
        participantDetails: {
          [buyerId]: {
            name: buyerInfo.displayName,
            avatar: buyerInfo.photoURL || null,
            university: buyerInfo.university,
            verified: buyerInfo.isVerified || false,
            email: buyerInfo.email || null, // Include email for notifications
          },
          [sellerId]: {
            name: sellerInfo.sellerName,
            avatar: sellerInfo.sellerAvatar || null,
            university: sellerInfo.sellerUniversity,
            verified: sellerInfo.sellerVerified || false,
            email: sellerInfo.email || null, // Include email for notifications
          },
        },
        unreadCount: {
          [buyerId]: 0,
          [sellerId]: 1, // Seller has 1 unread message
        },
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Setting conversation document:', conversationData);
      await setDoc(doc(db, 'conversations', conversationId), conversationData);

      // Create conversation object for immediate use
      const newConversation: Conversation = {
        id: conversationId,
        participants: [buyerId, sellerId],
        listingId,
        listingTitle,
        listingImage: listingImage || undefined,
        listingPrice,
        participantDetails: conversationData.participantDetails,
        unreadCount: conversationData.unreadCount,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set as current conversation
      set({ currentConversation: newConversation });

      // Send initial message
      console.log('Sending initial message');
      await get().sendMessage(conversationId, initialMessage, buyerId, buyerInfo.displayName, buyerInfo.photoURL);

      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
      throw error;
    }
  },

  markMessagesAsSeen: async (conversationId: string, userId: string) => {
    try {
      // Update conversation unread count
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: 0,
      });

      // Mark all messages from other users as seen
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        where('senderId', '!=', userId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const batch = writeBatch(db);
      
      messagesSnapshot.docs.forEach((messageDoc) => {
        if (!messageDoc.data().seen) {
          batch.update(messageDoc.ref, { seen: true });
        }
      });
      
      await batch.commit();
      
    } catch (error) {
      console.error('Error marking messages as seen:', error);
      // Don't show error toast as this is not critical for user experience
    }
  },

  setCurrentConversation: (conversation: Conversation | null) => {
    set({ currentConversation: conversation });
  },

  blockUser: async (conversationId: string, userId: string) => {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversation = await getDoc(conversationRef);
      
      if (conversation.exists()) {
        const data = conversation.data();
        const blockedBy = data.blockedBy || [];
        
        if (!blockedBy.includes(userId)) {
          await updateDoc(conversationRef, {
            blockedBy: [...blockedBy, userId],
            status: 'blocked',
            updatedAt: serverTimestamp(),
          });
          
          toast.success('Utilisateur bloqué');
        }
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Erreur lors du blocage');
    }
  },

  reportUser: async (conversationId: string, reporterId: string, reportedUserId: string, reason: string, description: string) => {
    try {
      const reportData = {
        reporterId,
        reportedUserId,
        conversationId,
        reason,
        description,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'reports'), reportData);
      toast.success('Signalement envoyé');
    } catch (error) {
      console.error('Error reporting user:', error);
      toast.error('Erreur lors du signalement');
    }
  },

  deleteConversation: async (conversationId: string, userId: string) => {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversation = await getDoc(conversationRef);
      
      if (conversation.exists()) {
        const data = conversation.data();
        const deletedFor = data.deletedFor || [];
        
        if (!deletedFor.includes(userId)) {
          const newDeletedFor = [...deletedFor, userId];
          
          // If both users have deleted, remove the conversation entirely
          if (newDeletedFor.length === data.participants.length) {
            await deleteDoc(conversationRef);
          } else {
            await updateDoc(conversationRef, {
              deletedFor: newDeletedFor,
              updatedAt: serverTimestamp(),
            });
          }
          
          toast.success('Conversation supprimée');
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Erreur lors de la suppression');
    }
  },

  findConversationByListing: (listingId: string, userId: string) => {
    const { conversations } = get();
    return conversations.find(conv => 
      conv.listingId === listingId && 
      conv.participants.includes(userId)
    ) || null;
  },

  cleanup: () => {
    const { unsubscribeConversations, unsubscribeMessages } = get();
    
    if (unsubscribeConversations) {
      unsubscribeConversations();
    }
    
    if (unsubscribeMessages) {
      unsubscribeMessages();
    }
    
    set({ 
      conversations: [], 
      currentConversation: null, 
      messages: [],
      unsubscribeConversations: undefined,
      unsubscribeMessages: undefined
    });
  },
}));