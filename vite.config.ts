import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Avoid duplicate React / context instances (e.g. "useAuth must be used within AuthProvider")
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://ghs.oneweekmvps.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
