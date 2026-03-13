import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths keep GitHub Pages project deployments working
  // without requiring repository-name specific build-time variables.
  base: './',
});
