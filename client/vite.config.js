import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the photo challenge game. This exposes the dev
// server on port 5173 by default and applies the React plugin for
// JSX/TSX support. You can customise this file further to add
// additional plugins (e.g. for PWA support) or proxy rules.

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});