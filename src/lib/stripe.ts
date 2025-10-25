import { loadStripe, Stripe } from '@stripe/stripe-js';

// Clé publique Stripe (vos vraies clés)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RY7Vw2XLhzYQhT9mWGOChkOK9Lp7QGPlTA5mqrZhHCDwiRGdgXeEpCanybQGuvXy4FsNTyDOTlYNkGsBGXEGNhS00ORRyOHto';

// Configuration des devises (Stripe exige des minuscules)
const currency = (import.meta.env.VITE_STRIPE_CURRENCY || 'eur').toLowerCase();

// Statut de configuration Stripe
export const stripeStatus = {
  isConfigured: !!stripePublishableKey && stripePublishableKey.startsWith('pk_'),
  currency: currency,
  country: import.meta.env.VITE_STRIPE_COUNTRY || 'fr',
};

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// Configuration par défaut pour les éléments Stripe
export const stripeOptions = {
  mode: 'payment' as const,
  currency: currency,
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#3b82f6',
      colorBackground: '#ffffff',
      colorText: '#1a202c',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
    rules: {
      '.Input': {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '16px',
      },
      '.Input:focus': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      },
      '.Label': {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '6px',
      },
    },
  },
};

// Configuration pour le mode sombre
export const stripeDarkOptions = {
  ...stripeOptions,
  appearance: {
    ...stripeOptions.appearance,
    theme: 'night' as const,
    variables: {
      ...stripeOptions.appearance.variables,
      colorBackground: '#1a202c',
      colorText: '#f7fafc',
      colorPrimary: '#60a5fa',
    },
    rules: {
      ...stripeOptions.appearance.rules,
      '.Input': {
        ...stripeOptions.appearance.rules['.Input'],
        backgroundColor: '#2d3748',
        borderColor: '#4a5568',
        color: '#f7fafc',
      },
      '.Input:focus': {
        ...stripeOptions.appearance.rules['.Input:focus'],
        borderColor: '#60a5fa',
        boxShadow: '0 0 0 3px rgba(96, 165, 250, 0.1)',
      },
      '.Label': {
        ...stripeOptions.appearance.rules['.Label'],
        color: '#e2e8f0',
      },
    },
  },
};

// Fonctions utilitaires Stripe (versions de base)
export const getUserSubscription = async (userId: string) => {
  // Version de base - à implémenter avec votre backend
  console.log('getUserSubscription called for user:', userId);
  return null;
};

export const getUserOrders = async (userId: string) => {
  // Version de base - à implémenter avec votre backend
  console.log('getUserOrders called for user:', userId);
  return [];
};

export const createCheckoutSession = async (priceId: string, userId: string) => {
  // Version de base - à implémenter avec votre backend
  console.log('createCheckoutSession called for price:', priceId, 'user:', userId);
  return null;
};