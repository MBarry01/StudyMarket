import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr'; // Ajoutez cette ligne

export default defineConfig({
  base: '/StudyMarket/',
  plugins: [react(), svgr()],
  resolve: { alias: { '@': '/src' } },
});
