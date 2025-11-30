import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    // Ignore backend and local state changes to prevent unnecessary HMR full-page reloads
    watch: {
      ignored: ['**/backend/**', '**/.local/**']
    },
    // Use default HMR settings for local development. Remove custom clientPort to avoid
    // HMR reconnect/reload loops when running outside Replit/proxy environments.
    hmr: true,
  },
});
