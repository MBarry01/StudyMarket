import { loadStripe } from '@stripe/stripe-js';
import { supabase, supabaseStatus } from './supabase';
import toast from 'react-hot-toast';

// Initialize Stripe with your publishable key
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51O5JqHLVDYKrxBIwIyiUQOmNk9HFZJKvBz6zJyRNBNjkKSGVEvZKEwlKnwL2JV8PmXVjWSHoZ9XQfKOiLkXGZ9Nh00wPxKdm9p';
const stripePromise = loadStripe(stripeKey);

// Check if Stripe is properly configured
export const stripeStatus = {
  isConfigured: true, // Force to true for demo purposes
  key: stripeKey ? `${stripeKey.substring(0, 8)}...` : 'Non configuré'
};

// Mock function for demo purposes
export async function createCheckoutSession(priceId: string, mode: 'payment' | 'subscription' = 'payment') {
  try {
    // For demo purposes, we'll just redirect to the success page
    toast.success('Redirection vers la page de paiement...');
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Redirect to success page
    window.location.href = `/checkout/success?type=${mode}`;
    
  } catch (error: any) {
    console.error('Checkout error:', error);
    toast.error(error.message || 'Une erreur est survenue');
    throw error;
  }
}

export async function getUserSubscription() {
  // Mock subscription data
  return {
    customer_id: 'cus_mock123',
    subscription_id: 'sub_mock123',
    subscription_status: 'active',
    price_id: 'price_1RY7iN2XLhzYQhT9ErigqaGg',
    current_period_start: Math.floor(Date.now() / 1000) - 86400 * 15, // 15 days ago
    current_period_end: Math.floor(Date.now() / 1000) + 86400 * 15, // 15 days from now
    cancel_at_period_end: false,
    payment_method_brand: 'visa',
    payment_method_last4: '4242'
  };
}

export async function getUserOrders() {
  // Mock orders data
  return [
    {
      order_id: 'ord_mock123',
      checkout_session_id: 'cs_mock123',
      payment_intent_id: 'pi_mock123',
      amount_subtotal: 1000,
      amount_total: 1000,
      currency: 'eur',
      payment_status: 'paid',
      order_status: 'completed',
      order_date: new Date().toISOString()
    }
  ];
}

export async function createPaymentIntent(amount: number, currency: string = 'eur', metadata: any = {}) {
  // Mock payment intent creation
  return {
    clientSecret: 'mock_client_secret',
    paymentIntentId: 'pi_mock' + Math.random().toString(36).substring(2, 10)
  };
}