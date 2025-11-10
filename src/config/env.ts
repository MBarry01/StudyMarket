// Configuration des variables d'environnement
export const ENV_CONFIG = {
  // Algolia
  ALGOLIA_APP_ID: import.meta.env.VITE_ALGOLIA_APP_ID || 'Q3E5Y56YF4',
  ALGOLIA_SEARCH_KEY: import.meta.env.VITE_ALGOLIA_SEARCH_KEY || 'ff26b6f0fa03bc6384566ea42dfe0ab4',
  ALGOLIA_ADMIN_KEY: import.meta.env.VITE_ALGOLIA_ADMIN_KEY || 'b77130fd07930d42f1a6284651395b65',

  // Pexels (optionnel)
  PEXELS_API_KEY: import.meta.env.VITE_PEXELS_API_KEY || '',

  // Firebase
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '',

  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',

  // Stripe
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  
  // OpenAI GPT (Optionnel - pour améliorer le chatbot)
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  OPENAI_ENABLED: import.meta.env.VITE_OPENAI_ENABLED === 'true',
};

// Validation des variables requises
export const validateEnvConfig = () => {
  const requiredVars = [
    'ALGOLIA_APP_ID',
    'ALGOLIA_SEARCH_KEY',
  ];

  const missingVars = requiredVars.filter(
    key => !ENV_CONFIG[key as keyof typeof ENV_CONFIG]
  );

  if (missingVars.length > 0) {
    console.warn('Variables d\'environnement manquantes:', missingVars);
  }

  return missingVars.length === 0;
};

