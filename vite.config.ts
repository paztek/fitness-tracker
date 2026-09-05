import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  // Chemin relatif : l'app fonctionne aussi bien à la racine d'un domaine
  // que dans un sous-dossier (GitHub Pages, Netlify, dossier local…).
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { host: true },
});
