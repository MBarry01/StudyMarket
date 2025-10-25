// Exemple d'endpoint API pour créer un PaymentIntent
// Ce fichier est un exemple - vous devrez l'adapter à votre backend

import Stripe from 'stripe';

// Initialiser Stripe avec votre clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Endpoint POST /api/create-payment-intent
export async function createPaymentIntent(req: any, res: any) {
  try {
    const { amount, currency = 'eur', metadata = {} } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    // Créer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir en centimes
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        platform: 'studymarket',
      },
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Erreur lors de la création du PaymentIntent:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du paiement',
      details: error.message 
    });
  }
}

// Endpoint POST /api/confirm-payment
export async function confirmPayment(req: any, res: any) {
  try {
    const { payment_intent_id } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      // Ici vous pouvez ajouter la logique pour :
      // - Marquer l'annonce comme vendue
      // - Créer un enregistrement de transaction
      // - Envoyer des emails de confirmation
      // - Mettre à jour les statistiques

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
  } catch (error: any) {
    console.error('Erreur lors de la confirmation du paiement:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la confirmation du paiement',
      details: error.message 
    });
  }
}

// Webhook pour traiter les événements Stripe
export async function handleWebhook(req: any, res: any) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Erreur de signature webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Traiter les événements
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Paiement réussi:', paymentIntent.id);
      
      // Ici vous pouvez ajouter la logique pour :
      // - Marquer l'annonce comme vendue
      // - Envoyer un email de confirmation
      // - Mettre à jour la base de données
      
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Paiement échoué:', failedPayment.id);
      
      // Ici vous pouvez ajouter la logique pour :
      // - Notifier l'utilisateur
      // - Logger l'échec
      
      break;
      
    default:
      console.log(`Événement non géré: ${event.type}`);
  }

  res.json({ received: true });
}

