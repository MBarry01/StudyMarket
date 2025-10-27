import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, collection, query, where, orderBy, limit as firestoreLimit, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { app, auth, db } from '../lib/firebase';
import toast from 'react-hot-toast';

const VAPID_KEY = "BIpfQERmqp9fuoRgTTdTGcGGfrDQwmxvvrvjqVt2oITIYnuMtJhUjgbQ6MveqsbJOZ0Pm4O4ZTNCeNeXDJ65lM8"; 

let messaging: Messaging | null = null;

// Initialiser Firebase Messaging
export const initMessaging = (): Messaging | null => {
  try {
    if (!messaging && typeof window !== 'undefined' && 'Notification' in window) {
      messaging = getMessaging(app);
      console.log('✅ Firebase Messaging initialisé');
    }
    return messaging;
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Messaging:', error);
    return null;
  }
};

// Demander permission et obtenir le token FCM
export const requestPermissionAndGetToken = async (): Promise<string | null> => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('⚠️ Notifications non supportées sur ce navigateur');
      return null;
    }

    const messagingInstance = initMessaging();
    if (!messagingInstance) {
      console.error('❌ Firebase Messaging non disponible');
      return null;
    }

    // Vérifier si la permission est déjà accordée
    if (Notification.permission === 'granted') {
      console.log('✅ Permission déjà accordée');
    } else if (Notification.permission === 'denied') {
      console.log('❌ Permission refusée par l\'utilisateur');
      toast.error('Les notifications ont été bloquées. Veuillez les activer dans les paramètres de votre navigateur.');
      return null;
    } else {
      // Demander permission
      const permission = await Notification.requestPermission();
      console.log('🔔 Permission:', permission);
      
      if (permission !== 'granted') {
        console.log('❌ Permission refusée:', permission);
        return null;
      }
    }

    // Obtenir le token FCM
    const swPath = `${import.meta.env.BASE_URL || ''}firebase-messaging-sw.js`;
    
    // Enregistrer le service worker d'abord
    let registration;
    try {
      registration = await navigator.serviceWorker.register(swPath);
      console.log('✅ Service Worker enregistré:', registration.scope);
      
      // Attendre que le service worker soit actif
      if (registration.installing) {
        await new Promise(resolve => {
          registration!.installing!.addEventListener('statechange', function() {
            if (this.state === 'activated') resolve();
          });
        });
      } else if (registration.waiting) {
        await registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (error) {
      console.error('❌ Erreur enregistrement service worker:', error);
      return null;
    }
    
    const token = await getToken(messagingInstance, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('✅ Token FCM obtenu:', token);
      await saveTokenToFirestore(token);
      return token;
    } else {
      console.log('⚠️ Aucun token disponible');
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la demande de permission:', error);
    return null;
  }
};

// Sauvegarder le token FCM dans Firestore
export const saveTokenToFirestore = async (token: string) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('⚠️ Aucun utilisateur connecté');
      return;
    }

    const userAgent = navigator.userAgent;
    const deviceType = detectDeviceType();

    const tokenData = {
      userId: currentUser.uid,
      fcmToken: token,
      deviceType,
      userAgent,
      enabled: true,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    // Vérifier si un token existe déjà pour cet utilisateur
    const tokensRef = collection(db, 'user_tokens');
    const q = query(tokensRef, where('userId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Créer un nouveau document
      await addDoc(tokensRef, tokenData);
      console.log('✅ Nouveau token FCM sauvegardé');
    } else {
      // Mettre à jour le token existant
      const tokenDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'user_tokens', tokenDoc.id), {
        fcmToken: token,
        lastActive: new Date().toISOString(),
        enabled: true
      });
      console.log('✅ Token FCM mis à jour');
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde token:', error);
  }
};

// Détecter le type d'appareil
const detectDeviceType = (): 'web' | 'ios' | 'android' => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  return 'web';
};

// Écouter les messages en temps réel (foreground)
export const setupForegroundListener = () => {
  try {
    const messagingInstance = initMessaging();
    if (!messagingInstance) return;

    onMessage(messagingInstance, (payload) => {
      console.log('📬 Message reçu en foreground:', payload);
      
      const title = payload.notification?.title || payload.data?.title || 'Nouvelle notification';
      const message = payload.notification?.body || payload.data?.message || '';
      
      // Afficher une notification toast
      toast.success(message, {
        duration: 5000,
        icon: '📬',
        position: 'top-right',
        onClick: () => {
          // Ouvrir la notification au clic
          const url = payload.data?.url || payload.data?.route || '/notifications';
          window.location.href = url;
        }
      });

      // Sauvegarder la notification dans Firestore
      saveNotificationToFirestore({
        userId: payload.data?.userId || auth.currentUser?.uid || '',
        type: payload.data?.type || 'system',
        title,
        message,
        data: payload.data,
        read: false
      });
    });
  } catch (error) {
    console.error('❌ Erreur setup foreground listener:', error);
  }
};

// Sauvegarder une notification dans Firestore
export const saveNotificationToFirestore = async (notificationData: {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
}) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      createdAt: new Date().toISOString(),
      expiresAt: null
    });
    console.log('✅ Notification sauvegardée');
  } catch (error) {
    console.error('❌ Erreur sauvegarde notification:', error);
  }
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: new Date().toISOString()
    });
    console.log('✅ Notification marquée comme lue');
  } catch (error) {
    console.error('❌ Erreur marquer notification lue:', error);
  }
};

// Récupérer les notifications d'un utilisateur
export const getUserNotifications = async (userId: string, limit: number = 20) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return notifications;
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    return [];
  }
};

// Compter les notifications non lues
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('❌ Erreur comptage notifications non lues:', error);
    return 0;
  }
};

// Activer/désactiver les notifications
export const toggleNotificationEnabled = async (userId: string, enabled: boolean) => {
  try {
    const tokensRef = collection(db, 'user_tokens');
    const q = query(tokensRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.docs.forEach(async (tokenDoc) => {
      await updateDoc(doc(db, 'user_tokens', tokenDoc.id), {
        enabled,
        lastActive: new Date().toISOString()
      });
    });
    
    console.log(`✅ Notifications ${enabled ? 'activées' : 'désactivées'}`);
  } catch (error) {
    console.error('❌ Erreur toggle notifications:', error);
  }
};

// Fonction principale d'initialisation
export const initializePushNotifications = async () => {
  try {
    console.log('🚀 Initialisation des notifications push...');
    
    // Initialiser Firebase Messaging
    const messagingInstance = initMessaging();
    if (!messagingInstance) {
      console.log('⚠️ Firebase Messaging non disponible');
      return false;
    }

    // Demander permission et obtenir le token
    const token = await requestPermissionAndGetToken();
    if (!token) {
      console.log('⚠️ Impossible d\'obtenir le token FCM');
      return false;
    }

    // Configurer le listener foreground
    setupForegroundListener();
    
    console.log('✅ Notifications push initialisées avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur initialisation notifications push:', error);
    return false;
  }
};

// Nettoyer un token (lors de la déconnexion)
export const cleanupToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const tokensRef = collection(db, 'user_tokens');
    const q = query(tokensRef, where('userId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.docs.forEach(async (tokenDoc) => {
      await updateDoc(doc(db, 'user_tokens', tokenDoc.id), {
        enabled: false,
        lastActive: new Date().toISOString()
      });
    });
    
    console.log('✅ Token nettoyé');
  } catch (error) {
    console.error('❌ Erreur nettoyage token:', error);
  }
};

// Créer et envoyer une notification
export const createNotification = async (
  userId: string,
  type: 'message' | 'listing' | 'order' | 'verification' | 'system',
  title: string,
  message: string,
  data?: any
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Notification créée:', { userId, type, title });
  } catch (error) {
    console.error('❌ Erreur création notification:', error);
  }
};

