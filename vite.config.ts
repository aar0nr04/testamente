import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages project sites. If REPO_NAME is provided in CI, use it;
  // otherwise keep relative paths so local dev/build still work.
  base: process.env.REPO_NAME ? `/${process.env.REPO_NAME}/` : './',
});
