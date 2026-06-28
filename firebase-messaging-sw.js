// Import Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDXD6WpZoQNLNU0DAqH1wd3q9Q4vthOWv4",
  authDomain: "annonces-app-44d27.firebaseapp.com",
  projectId: "annonces-app-44d27",
  storageBucket: "annonces-app-44d27.firebasestorage.app",
  messagingSenderId: "603697837611",
  appId: "1:603697837611:web:858cf99bb80004d0f25c6e",
  measurementId: "G-35RWYRR568"
});

const messaging = firebase.messaging();

// Gérer les messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en background:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Nouvelle notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || '',
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    image: payload.data?.image,
    data: payload.data,
    tag: payload.data?.notificationId || `notification-${Date.now()}`,
    requireInteraction: payload.data?.requireInteraction || false,
    vibrate: payload.data?.vibrate || [200, 100, 200],
    silent: payload.data?.silent || false
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification cliquée:', event.notification.data);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  const url = event.notification.data?.route || event.notification.data?.listingId || urlToOpen;
  
  const urlToNavigate = url.startsWith('/') ? url : `/${url}`;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Vérifier si une fenêtre est déjà ouverte
      for (const client of clientList) {
        if (client.url.includes(urlToNavigate) && 'focus' in client) {
          return client.focus();
        }
      }
      // Ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(urlToNavigate);
      }
    })
  );
});

// Gérer les clics sur les actions de notification
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification fermée');
});

console.log('[firebase-messaging-sw.js] Service Worker FCM initialisé');

