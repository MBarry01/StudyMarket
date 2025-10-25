import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
  base: '/StudyMarket/',
  plugins: [react(), svgr()],
  resolve: { 
    alias: { 
      '@': path.resolve(__dirname, './src') 
    } 
  },
  define: {
    // Définir les variables d'environnement pour Stripe
    'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify('pk_test_51RY7Vw2XLhzYQhT9mWGOChkOK9Lp7QGPlTA5mqrZhHCDwiRGdgXeEpCanybQGuvXy4FsNTyDOTlYNkGsBGXEGNhS00ORRyOHto'),
    'import.meta.env.VITE_STRIPE_CURRENCY': JSON.stringify('eur'),
    'import.meta.env.VITE_STRIPE_COUNTRY': JSON.stringify('fr'),
  },
});
