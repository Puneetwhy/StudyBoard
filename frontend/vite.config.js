import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Render Static Site build: `npm run build` outputs to /dist by default.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
