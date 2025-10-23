import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create client if both URL and key are provided
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url' && supabaseAnonKey !== 'your_supabase_anon_key') {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase not configured. Contact functionality will be disabled.');
}

export { supabase };

// Check if Supabase is properly configured
export const supabaseStatus = {
  isConfigured: !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url' && supabaseAnonKey !== 'your_supabase_anon_key'),
  url: supabaseUrl || 'Not configured'
};