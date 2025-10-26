import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import fs from 'fs';

// Optional env loader (does not crash if dotenv isn't installed)
try {
  const dotenv = await import('dotenv');
  dotenv.default?.config?.();
} catch (_) {}

const app = express();
const PORT = process.env.PORT || 3001;

// Import worker backend (si disponible)
if (fs.existsSync('./worker/verificationWorker.js')) {
  try {
    await import('./worker/verificationWorker.js');
    console.log('✅ Worker backend démarré');
  } catch (error) {
    console.log('⚠️  Worker backend non disponible:', error.message);
  }
}

// Configuration Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'YOUR_STRIPE_SECRET_KEY_HERE');

// Firebase Admin initialization (optional)
let adminReady = false;
try {
  const admin = await import('firebase-admin');
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.default.initializeApp({
      credential: admin.default.credential.cert(serviceAccount),
    });
    adminReady = true;
    console.log('✅ Firebase Admin initialisé');
  } else {
    console.log('⚠️  FIREBASE_SERVICE_ACCOUNT non configuré - persistance désactivée');
  }
} catch (error) {
  console.log('⚠️  Firebase Admin non disponible:', error.message);
}

// Middleware
app.use(cors());

// IMPORTANT: Webhook AVANT express.json() pour préserver le raw body
app.post('/api/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Erreur de signature webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Traiter les événements
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      console.log('✅ Paiement réussi:', pi.id);
      
      try {
        if (pi && typeof pi === 'object' && adminReady) {
          const db = (await import('firebase-admin')).firestore();
          const orderId = pi.metadata?.order_id;
          const listingId = pi.metadata?.listing_id;
          
          // 🆕 NOUVEAU FLUX: Si orderId existe, mettre à jour la commande existante
          if (orderId) {
            console.log('📦 Mise à jour commande existante:', orderId);
            
            try {
              await db.collection('orders').doc(orderId).update({
                status: 'paid', // ⚠️ IMPORTANT: commande payée
                stripePaymentIntentId: pi.id,
                'payment.transactionId': pi.id,
                'payment.details.paymentIntentId': pi.id,
                updatedAt: (await import('firebase-admin')).firestore.FieldValue.serverTimestamp(),
              });
              console.log('✅ Commande mise à jour (paid):', orderId);
            } catch (error) {
              console.error('❌ Erreur mise à jour commande:', error);
            }
          } 
          // ANCIEN FLUX (compat): Créer une nouvelle commande si pas d'orderId
          else {
            console.log('⚠️ Mode legacy: création d\'une nouvelle commande');
            
            // Récupérer les informations de l'annonce depuis Firestore
            let listingData = null;
            if (listingId) {
              try {
                const listingDoc = await db.collection('listings').doc(listingId).get();
                if (listingDoc.exists) {
                  listingData = listingDoc.data();
                }
              } catch (error) {
                console.error('Erreur récupération annonce:', error);
              }
            }

            // Créer la commande avec la structure attendue par le store
            const order = {
              userId: pi.metadata?.buyer_id || null,
              sellerId: pi.metadata?.seller_id || null,
              listingId: listingId || null,
              items: listingData ? [{
                id: listingId,
                title: listingData.title || 'Annonce',
                price: Number(pi.metadata?.subtotal_cents || 0) / 100,
                quantity: 1,
                image: listingData.images?.[0] || null,
                sellerId: pi.metadata?.seller_id || null,
              }] : [],
              total: Number(pi.metadata?.total_cents || pi.amount || 0) / 100,
              amountCents: Number(pi.metadata?.subtotal_cents || 0),
              totalCents: Number(pi.metadata?.total_cents || pi.amount || 0),
              currency: pi.currency,
              method: 'stripe',
              stripePaymentIntentId: pi.id,
              shipping: {
                fullName: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                postalCode: '',
                country: '',
                university: '',
              },
              payment: {
                method: 'card',
                details: {
                  paymentIntentId: pi.id,
                  subtotalCents: Number(pi.metadata?.subtotal_cents || 0),
                  serviceFeeCents: Number(pi.metadata?.service_fee_cents || 0),
                  processingFeeCents: Number(pi.metadata?.processing_fee_cents || 0),
                  totalCents: Number(pi.metadata?.total_cents || pi.amount || 0),
                  currency: pi.currency,
                },
                transactionId: pi.id,
              },
              status: 'paid',
              trackingNumber: pi.id,
              notes: `Paiement Stripe réussi - ${pi.id}`,
              createdAt: (await import('firebase-admin')).firestore.FieldValue.serverTimestamp(),
              updatedAt: (await import('firebase-admin')).firestore.FieldValue.serverTimestamp(),
            };
            
            const orderRef = await db.collection('orders').add(order);
            console.log('✅ Commande créée (mode legacy):', orderRef.id);
          }
          
          // Marquer l'annonce comme vendue (dans tous les cas)
          if (listingId) {
            try {
              await db.collection('listings').doc(listingId).update({
                status: 'sold',
                soldAt: (await import('firebase-admin')).firestore.FieldValue.serverTimestamp(),
                soldTo: pi.metadata?.buyer_id || null,
                updatedAt: (await import('firebase-admin')).firestore.FieldValue.serverTimestamp(),
              });
              console.log('✅ Annonce marquée comme vendue:', listingId);
            } catch (error) {
              console.error('❌ Erreur mise à jour annonce:', error);
            }
          }
        }
      } catch (e) {
        console.error('❌ [webhook] Erreur traitement:', e);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const failedPayment = event.data.object;
      console.log('Paiement échoué:', failedPayment.id);
      break;
    }
    default:
      console.log(`Événement non géré: ${event.type}`);
  }

  res.json({ received: true });
});

// Parser JSON pour toutes les autres routes (APRÈS le webhook)
app.use(express.json());

// 🆕 Endpoint pour créer une commande (AVANT paiement) - BEST PRACTICE
app.post('/api/orders', async (req, res) => {
  try {
    const { listingId, buyerId, sellerId, items } = req.body;
    
    if (!listingId || !buyerId) {
      return res.status(400).json({ error: 'listingId et buyerId requis' });
    }

    // Vérifier que Firebase Admin est configuré
    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const db = (await import('firebase-admin')).default.firestore();
    
    // Récupérer les détails de l'annonce depuis Firestore
    const listingDoc = await db.collection('listings').doc(listingId).get();
    if (!listingDoc.exists) {
      return res.status(404).json({ error: 'Annonce introuvable' });
    }
    
    const listingData = listingDoc.data();
    
    // Vérifier que l'annonce est disponible
    if (listingData.status !== 'active') {
      return res.status(400).json({ error: 'Annonce non disponible' });
    }
    
    // Calculer le montant côté serveur
    const priceCents = Math.round((listingData.price || 0) * 100);
    const serviceFeeCents = Math.round(priceCents * 0.05);
    const processingFeeCents = 25;
    const totalCents = priceCents + serviceFeeCents + processingFeeCents;
    
    // Créer la commande avec status 'pending'
    const order = {
      userId: buyerId,
      sellerId: sellerId || listingData.sellerId,
      listingId: listingId,
      items: items || [{
        id: listingId,
        title: listingData.title,
        price: listingData.price,
        quantity: 1,
        image: listingData.images?.[0] || null,
        sellerId: listingData.sellerId,
      }],
      amountCents: priceCents,
      serviceFeeCents,
      processingFeeCents,
      totalCents,
      currency: (listingData.currency || 'eur').toLowerCase(),
      method: 'stripe', // Par défaut, sera mis à jour selon la méthode choisie
      status: 'pending', // ⚠️ IMPORTANT: commande créée avant paiement
      stripePaymentIntentId: null,
      paypalOrderId: null,
      lydiaRef: null,
      shipping: {
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        university: '',
      },
      payment: {
        method: 'stripe',
        details: {
          subtotalCents: priceCents,
          serviceFeeCents,
          processingFeeCents,
          totalCents,
          currency: (listingData.currency || 'eur').toLowerCase(),
        },
        transactionId: null,
      },
      createdAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
      updatedAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
    };
    
    const orderRef = await db.collection('orders').add(order);
    
    console.log('✅ Commande créée (pending):', orderRef.id);
    
    res.json({
      orderId: orderRef.id,
      amountCents: priceCents,
      totalCents,
      currency: order.currency,
    });
    
  } catch (error) {
    console.error('❌ Erreur création commande:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

// 🆕 Endpoint pour récupérer le statut d'une commande (polling)
app.get('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }
    
    const db = (await import('firebase-admin')).default.firestore();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }
    
    const orderData = orderDoc.data();
    
    res.json({
      orderId,
      status: orderData.status,
      method: orderData.method,
      totalCents: orderData.totalCents,
      currency: orderData.currency,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour créer un PaymentIntent (calcul côté serveur)
// 🆕 Peut maintenant accepter un orderId pour lier le PI à une commande existante
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { orderId, items, amount, currency = 'eur', connectedAccountId, buyerId } = req.body || {};
    
    // Debug minimal pour vérifier la charge utile
    if (process.env.NODE_ENV !== 'production') {
      try { console.log('create-payment-intent payload:', JSON.stringify(req.body)); } catch {}
    }

    let amountCents;
    let order = null;
    
    // 🆕 Si orderId fourni, récupérer la commande existante
    if (orderId && adminReady) {
      const db = (await import('firebase-admin')).default.firestore();
      const orderDoc = await db.collection('orders').doc(orderId).get();
      
      if (!orderDoc.exists) {
        return res.status(404).json({ error: 'Commande introuvable' });
      }
      
      order = { id: orderId, ...orderDoc.data() };
      
      // Utiliser les montants de la commande
      amountCents = order.amountCents;
      
      // Vérifier que la commande est en attente
      if (order.status !== 'pending') {
        return res.status(400).json({ error: 'Commande déjà traitée' });
      }
    } 
    // Sinon, calculer à partir des items (mode legacy/compat)
    else if (Array.isArray(items) && items.length > 0) {
      amountCents = await computeAmountFromItems(items);
    } else if (Number.isFinite(Number(amount)) && Number(amount) > 0) {
      // compat: accepter un montant direct (en centimes)
      amountCents = Math.round(Number(amount));
    } else {
      return res.status(400).json({ error: 'orderId, items ou amount requis' });
    }
    
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'montant invalide' });
    }

    const idempotencyKey = req.headers['idempotency-key'] || randomUUID();

    // Calcul des frais côté serveur (exemple: 5% + 0,25€)
    const serviceFeeCents = Math.round(amountCents * 0.05);
    const processingFeeCents = 25; // 0,25€ en centimes
    const totalCents = amountCents + serviceFeeCents + processingFeeCents;

    const params = {
      amount: Math.round(totalCents),
      currency: order ? order.currency : String(currency || 'eur').toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        platform: 'studymarket',
        order_id: orderId || '',  // 🆕 Lien avec la commande
        buyer_id: order ? order.userId : (buyerId || ''),
        listing_id: order ? order.listingId : (Array.isArray(items) && items[0]?.id ? String(items[0].id) : ''),
        seller_id: order ? order.sellerId : (Array.isArray(items) && items[0]?.sellerId ? String(items[0].sellerId) : ''),
        subtotal_cents: String(amountCents),
        service_fee_cents: String(serviceFeeCents),
        processing_fee_cents: String(processingFeeCents),
        total_cents: String(totalCents),
      },
    };

    if (connectedAccountId) {
      params.transfer_data = { destination: connectedAccountId };
      // Commission prélevée par la plateforme = frais de service + traitement
      params.application_fee_amount = serviceFeeCents + processingFeeCents;
    }

    const paymentIntent = await stripe.paymentIntents.create(params, { idempotencyKey });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      breakdown: {
        subtotalCents: amountCents,
        serviceFeeCents,
        processingFeeCents,
        totalCents,
        currency: String(currency || 'eur').toLowerCase(),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la création du PaymentIntent:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du paiement',
      details: error.message 
    });
  }
});

// Endpoint pour confirmer un paiement
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { payment_intent_id } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      res.json({
        status: 'success',
        payment_intent: paymentIntent,
      });
    } else {
      res.status(400).json({
        status: 'failed',
        payment_intent: paymentIntent,
      });
    }
  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la confirmation du paiement',
      details: error.message 
    });
  }
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API StudyMarket fonctionnelle!' });
});

// 🧪 ENDPOINT TEMPORAIRE : Créer une commande de test manuellement
app.post('/api/test-create-order', async (req, res) => {
  try {
    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const { paymentIntentId, buyerId, listingId } = req.body;
    
    if (!paymentIntentId || !buyerId || !listingId) {
      return res.status(400).json({ error: 'paymentIntentId, buyerId et listingId requis' });
    }

    const admin = await import('firebase-admin');
    const db = admin.default.firestore();

    // Récupérer l'annonce
    const listingDoc = await db.collection('listings').doc(listingId).get();
    if (!listingDoc.exists) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    const listingData = listingDoc.data();
    const subtotalCents = Math.round((listingData.price || 0) * 100);
    const serviceFeeCents = Math.round(subtotalCents * 0.05);
    const processingFeeCents = 25;
    const totalCents = subtotalCents + serviceFeeCents + processingFeeCents;

    // Créer la commande
    const order = {
      userId: buyerId,
      items: [{
        id: listingId,
        title: listingData.title || 'Annonce',
        price: (listingData.price || 0),
        quantity: 1,
        image: listingData.images?.[0] || null,
        sellerId: listingData.sellerId || null,
      }],
      total: totalCents / 100,
      shipping: {
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        university: '',
      },
      payment: {
        method: 'card',
        details: {
          paymentIntentId: paymentIntentId,
          subtotalCents: subtotalCents,
          serviceFeeCents: serviceFeeCents,
          processingFeeCents: processingFeeCents,
          totalCents: totalCents,
          currency: listingData.currency || 'eur',
        },
        transactionId: paymentIntentId,
      },
      status: 'delivered',
      trackingNumber: paymentIntentId,
      notes: `Test - Paiement Stripe réussi - ${paymentIntentId}`,
      createdAt: admin.default.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.default.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('orders').add(order);
    console.log('✅ Commande de test créée:', docRef.id);

    res.json({ 
      success: true, 
      orderId: docRef.id,
      message: 'Commande créée avec succès' 
    });

  } catch (error) {
    console.error('Erreur création commande test:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la commande',
      details: error.message 
    });
  }
});

// 🔐 ADMIN ENDPOINTS
// Middleware pour vérifier si admin (basique, à améliorer)
const isAdmin = (req, res, next) => {
  // TODO: Implémenter vraie vérification JWT/session
  // Pour l'instant, on accepte toutes les requêtes (dev only)
  next();
};

// Admin: Refund order
app.post('/api/admin/orders/:id/refund', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount_cents, reason } = req.body;

    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const db = (await import('firebase-admin')).default.firestore();
    const orderDoc = await db.collection('orders').doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    const orderData = orderDoc.data();
    const piId = orderData.stripePaymentIntentId;

    if (!piId) {
      return res.status(400).json({ error: 'Pas de PaymentIntent Stripe' });
    }

    // Créer le refund Stripe
    const refund = await stripe.refunds.create({
      payment_intent: piId,
      amount: amount_cents,
      reason: 'requested_by_customer',
      metadata: { admin_reason: reason || 'Admin refund' }
    });

    // Mettre à jour la commande
    await db.collection('orders').doc(id).update({
      status: 'refunded',
      refundId: refund.id,
      refundAmount: amount_cents,
      refundReason: reason,
      refundedAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
      updatedAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Refund créé: ${refund.id} pour ${amount_cents} centimes`);

    res.json({
      success: true,
      refund_id: refund.id,
      amount_cents,
      status: refund.status
    });

  } catch (error) {
    console.error('❌ Erreur refund:', error);
    res.status(500).json({
      error: 'Erreur lors du remboursement',
      details: error.message
    });
  }
});

// Admin: Reprocess webhook from logs
app.post('/api/admin/webhooks/:logId/reprocess', isAdmin, async (req, res) => {
  try {
    const { logId } = req.params;
    const { orderId, paymentIntentId, event } = req.body;

    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const db = (await import('firebase-admin')).default.firestore();

    // Si orderId fourni, retraiter la commande
    if (orderId) {
      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) {
        return res.status(404).json({ error: 'Commande introuvable' });
      }

      const orderData = orderDoc.data();
      const piId = paymentIntentId || orderData.stripePaymentIntentId;

      if (piId) {
        const pi = await stripe.paymentIntents.retrieve(piId);

        if (pi.status === 'succeeded') {
          await db.collection('orders').doc(orderId).update({
            status: 'paid',
            'payment.transactionId': pi.id,
            'payment.details.paymentIntentId': pi.id,
            updatedAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
          });

          if (orderData.listingId) {
            await db.collection('listings').doc(orderData.listingId).update({
              status: 'sold',
              soldAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
              soldTo: orderData.userId,
            });
          }

          // Mettre à jour le log webhook si existe
          try {
            await db.collection('webhook_logs').doc(logId).update({
              status: 'success',
              retryCount: (await import('firebase-admin')).default.firestore.FieldValue.increment(1),
              reprocessedAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
            });
          } catch (e) {
            console.log('Log webhook non trouvé, skip update');
          }

          console.log(`✅ Webhook retraité depuis log ${logId} pour commande ${orderId}`);
          return res.json({ success: true, message: 'Webhook retraité avec succès' });
        } else {
          return res.status(400).json({ error: `PaymentIntent status: ${pi.status}` });
        }
      }
    }

    res.status(400).json({ error: 'Données insuffisantes pour retraiter' });

  } catch (error) {
    console.error('❌ Erreur reprocess webhook:', error);
    res.status(500).json({
      error: 'Erreur lors du retraitement',
      details: error.message
    });
  }
});

// Admin: Replay webhook
app.post('/api/admin/orders/:id/replay-webhook', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { provider } = req.body;

    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const db = (await import('firebase-admin')).default.firestore();
    const orderDoc = await db.collection('orders').doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    const orderData = orderDoc.data();

    if (provider === 'stripe' && orderData.stripePaymentIntentId) {
      // Récupérer le PaymentIntent et simuler le webhook
      const pi = await stripe.paymentIntents.retrieve(orderData.stripePaymentIntentId);

      // Simuler l'événement payment_intent.succeeded
      if (pi.status === 'succeeded') {
        await db.collection('orders').doc(id).update({
          status: 'paid',
          'payment.transactionId': pi.id,
          'payment.details.paymentIntentId': pi.id,
          updatedAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
        });

        // Marquer l'annonce comme vendue si listingId existe
        if (orderData.listingId) {
          await db.collection('listings').doc(orderData.listingId).update({
            status: 'sold',
            soldAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
            soldTo: orderData.userId,
          });
        }

        console.log(`✅ Webhook rejoué pour commande ${id}`);
        return res.json({ success: true, message: 'Webhook rejoué avec succès' });
      } else {
        return res.status(400).json({ error: `PaymentIntent status: ${pi.status}` });
      }
    }

    res.status(400).json({ error: 'Provider non supporté ou pas de payment ID' });

  } catch (error) {
    console.error('❌ Erreur replay webhook:', error);
    res.status(500).json({
      error: 'Erreur lors du replay webhook',
      details: error.message
    });
  }
});

// Admin: Get all users (avec pagination)
app.get('/api/admin/users', isAdmin, async (req, res) => {
  try {
    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const { page = 1, limit = 50, search = '', role = '', status = '' } = req.query;
    const db = (await import('firebase-admin')).default.firestore();
    
    let query = db.collection('users');
    
    // TODO: Ajouter filtres search, role, status
    const snapshot = await query.limit(parseInt(limit)).get();
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      users,
      total: users.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('❌ Erreur get users:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: Approuver un payout
app.post('/api/admin/payouts/:id/approve', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const db = (await import('firebase-admin')).default.firestore();
    const payoutDoc = await db.collection('payouts').doc(id).get();

    if (!payoutDoc.exists) {
      return res.status(404).json({ error: 'Payout introuvable' });
    }

    const payoutData = payoutDoc.data();

    if (payoutData.status !== 'pending') {
      return res.status(400).json({ error: 'Payout déjà traité' });
    }

    // Mettre à jour le statut en "processing"
    await db.collection('payouts').doc(id).update({
      status: 'processing',
      processedAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
      updatedAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Payout ${id} approuvé et en traitement`);

    // TODO: Intégrer avec Stripe Connect pour créer le payout réel
    // const payout = await stripe.payouts.create({
    //   amount: Math.round(payoutData.amount * 100),
    //   currency: payoutData.currency.toLowerCase(),
    // }, {
    //   stripeAccount: payoutData.stripeAccountId,
    // });

    res.json({
      success: true,
      message: 'Payout approuvé et en traitement',
      payout_id: id,
    });

  } catch (error) {
    console.error('❌ Erreur approbation payout:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'approbation du payout',
      details: error.message
    });
  }
});

// Admin: Block/unblock user
app.post('/api/admin/users/:id/block', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { blocked, reason } = req.body;

    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const db = (await import('firebase-admin')).default.firestore();
    
    await db.collection('users').doc(id).update({
      blocked: blocked === true,
      blockedReason: reason || '',
      blockedAt: blocked ? (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp() : null,
      updatedAt: (await import('firebase-admin')).default.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ User ${id} ${blocked ? 'bloqué' : 'débloqué'}`);

    res.json({
      success: true,
      message: blocked ? 'Utilisateur bloqué' : 'Utilisateur débloqué'
    });

  } catch (error) {
    console.error('❌ Erreur block user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== ROUTES DE VÉRIFICATION ====================

// POST /api/verification - Créer une demande de vérification
app.post('/api/verification', async (req, res) => {
  try {
    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const { userId, idempotencyKey } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const db = (await import('firebase-admin')).default.firestore();
    const { serverTimestamp } = (await import('firebase-admin')).default.firestore;
    
    // Vérifier idempotency
    if (idempotencyKey) {
      const existing = await db.collection('verification_requests')
        .where('userId', '==', userId)
        .where('idempotencyKey', '==', idempotencyKey)
        .limit(1)
        .get();
      
      if (!existing.empty) {
        const existingDoc = existing.docs[0].data();
        return res.status(200).json({
          verificationId: existing.docs[0].id,
          status: existingDoc.status,
          message: 'Request already processed'
        });
      }
    }
    
    // Créer la demande
    const docRef = await db.collection('verification_requests').add({
      userId,
      status: 'documents_submitted',
      idempotencyKey: idempotencyKey || randomUUID(),
      submittedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        submissionSource: 'web'
      },
      attemptsCount: 1
    });
    
    console.log(`✅ Demande de vérification créée: ${docRef.id}`);
    
    res.status(201).json({
      verificationId: docRef.id,
      status: 'documents_submitted'
    });
  } catch (error) {
    console.error('❌ Erreur création vérification:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/verification/:id - Récupérer statut complet
app.get('/api/verification/:id', async (req, res) => {
  try {
    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const db = (await import('firebase-admin')).default.firestore();
    const doc = await db.collection('verification_requests').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Verification not found' });
    }
    
    const data = doc.data();
    res.json({
      id: doc.id,
      ...data,
      submittedAt: data.submittedAt?.toDate?.() || data.submittedAt,
      reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt
    });
  } catch (error) {
    console.error('❌ Erreur récupération vérification:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/:userId/verification - Statut rapide pour profil
app.get('/api/user/:userId/verification', async (req, res) => {
  try {
    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const db = (await import('firebase-admin')).default.firestore();
    const snapshot = await db.collection('verification_requests')
      .where('userId', '==', req.params.userId)
      .orderBy('submittedAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.json({ status: 'unverified' });
    }
    
    const latest = snapshot.docs[0].data();
    res.json({
      status: latest.status,
      verificationId: snapshot.docs[0].id
    });
  } catch (error) {
    console.error('❌ Erreur récupération statut utilisateur:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/verification/enqueue - Enqueue job de validation
app.post('/api/verification/enqueue', async (req, res) => {
  try {
    const { verificationId, userId, metadata } = req.body;
    
    if (!verificationId || !userId) {
      return res.status(400).json({ error: 'verificationId and userId required' });
    }

    // TODO: Implémenter BullMQ queue côté backend
    // Pour l'instant, on simule l'enqueue
    console.log(`📤 [API] Enqueueing verification ${verificationId} for user ${userId}`);
    
    // Simuler l'enqueue
    await new Promise(resolve => setTimeout(resolve, 100));
    
    res.json({ success: true, message: 'Job enqueued' });
  } catch (error) {
    console.error('❌ Erreur enqueue:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/verifications/:id/approve - Approver (admin only)
app.post('/api/admin/verifications/:id/approve', isAdmin, async (req, res) => {
  try {
    const { adminId } = req.body;
    
    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const db = (await import('firebase-admin')).default.firestore();
    const { serverTimestamp } = (await import('firebase-admin')).default.firestore;
    
    const verificationRef = db.collection('verification_requests').doc(req.params.id);
    const verificationDoc = await verificationRef.get();
    
    if (!verificationDoc.exists) {
      return res.status(404).json({ error: 'Verification not found' });
    }
    
    const verificationData = verificationDoc.data();
    
    // Mettre à jour status
    await verificationRef.update({
      status: 'verified',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId
    });
    
    // Mettre à jour utilisateur
    await db.collection('users').doc(verificationData.userId).update({
      isVerified: true,
      verificationStatus: 'verified',
      verifiedAt: serverTimestamp()
    });
    
    console.log(`✅ Vérification ${req.params.id} approuvée par ${adminId}`);
    
    res.json({ success: true, message: 'Verification approved' });
  } catch (error) {
    console.error('❌ Erreur approbation:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/verifications/:id/reject - Rejeter (admin only)
app.post('/api/admin/verifications/:id/reject', isAdmin, async (req, res) => {
  try {
    const { adminId, reason } = req.body;
    
    if (!reason || reason.length < 10) {
      return res.status(400).json({ error: 'Reason required (min 10 characters)' });
    }
    
    if (!adminReady) {
      return res.status(500).json({ error: 'Firebase Admin non configuré' });
    }

    const db = (await import('firebase-admin')).default.firestore();
    const { serverTimestamp } = (await import('firebase-admin')).default.firestore;
    
    await db.collection('verification_requests').doc(req.params.id).update({
      status: 'rejected',
      rejectionReason: reason,
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId
    });
    
    console.log(`✅ Vérification ${req.params.id} rejetée par ${adminId}`);
    
    res.json({ success: true, message: 'Verification rejected' });
  } catch (error) {
    console.error('❌ Erreur rejet:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur API StudyMarket démarré sur le port ${PORT}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   POST /api/create-payment-intent`);
  console.log(`   POST /api/confirm-payment`);
  console.log(`   POST /api/webhook/stripe`);
  console.log(`   GET  /api/test`);
  console.log(`   POST /api/test-create-order (🧪 TEST)`);
  console.log(`   POST /api/admin/orders/:id/refund (🔐 ADMIN)`);
  console.log(`   POST /api/admin/orders/:id/replay-webhook (🔐 ADMIN)`);
  console.log(`   GET  /api/admin/users (🔐 ADMIN)`);
  console.log(`   POST /api/admin/users/:id/block (🔐 ADMIN)`);
  console.log(`   POST /api/verification (✅ NEW)`);
  console.log(`   GET  /api/verification/:id (✅ NEW)`);
  console.log(`   GET  /api/user/:userId/verification (✅ NEW)`);
  console.log(`   POST /api/admin/verifications/:id/approve (✅ NEW)`);
  console.log(`   POST /api/admin/verifications/:id/reject (✅ NEW)`);
  console.log(`   POST /api/verification/enqueue (✅ NEW)`);
});

// --- Helpers ---
async function computeAmountFromItems(items) {
  // TODO: Remplacer par un calcul basé sur la base de données
  // Support provisoire: price/priceCents + quantity
  let total = 0;
  for (const it of items) {
    if (Number.isFinite(it?.amountCents)) {
      total += Math.round(it.amountCents) * (it.quantity || 1);
    } else if (Number.isFinite(it?.price)) {
      total += Math.round(it.price * 100) * (it.quantity || 1);
    } else {
      throw new Error('item invalide: amountCents ou price requis');
    }
  }
  return total;
}
