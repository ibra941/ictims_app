import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
  build: {
    outDir: 'dist', // Hii inaepuka kuweka mafaili kwenye public ya Laravel
    manifest: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8003', changeOrigin: true },
      '/sanctum': { target: 'http://localhost:8003', changeOrigin: true },
      '/login': { target: 'http://localhost:8003', changeOrigin: true },
      '/logout': { target: 'http://localhost:8003', changeOrigin: true },
    },
  },
});
