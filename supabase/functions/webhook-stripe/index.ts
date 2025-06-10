import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "npm:stripe@12.0.0"
import { createClient } from "npm:@supabase/supabase-js@2.38.4"

// Initialize Stripe with your secret key
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Webhook secret for verifying the event
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get the request body as text
    const body = await req.text();
    
    // Verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        
        // Update order status in database
        if (paymentIntent.metadata.orderId) {
          const { error } = await supabase
            .from('orders')
            .update({ 
              status: 'processing',
              payment: {
                transactionId: paymentIntent.id,
                status: 'completed',
                method: 'card',
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                completedAt: new Date().toISOString()
              }
            })
            .eq('id', paymentIntent.metadata.orderId);
            
          if (error) {
            console.error('Error updating order:', error);
          }
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        console.log(`Payment failed: ${failedPaymentIntent.last_payment_error?.message}`);
        
        // Update order status in database
        if (failedPaymentIntent.metadata.orderId) {
          const { error } = await supabase
            .from('orders')
            .update({ 
              status: 'payment_failed',
              payment: {
                transactionId: failedPaymentIntent.id,
                status: 'failed',
                method: 'card',
                error: failedPaymentIntent.last_payment_error?.message
              }
            })
            .eq('id', failedPaymentIntent.metadata.orderId);
            
          if (error) {
            console.error('Error updating order:', error);
          }
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});