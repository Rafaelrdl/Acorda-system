import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true, // necessário para hot-reload no Docker (Windows)
    },
    proxy: {
      '/api': { target: 'http://web:8000', changeOrigin: true },
      '/painel-acorda': { target: 'http://web:8000', changeOrigin: true },
      '/static': { target: 'http://web:8000', changeOrigin: true },
      '/media': { target: 'http://web:8000', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: heavy third-party libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'sonner', '@radix-ui/colors'],
          'vendor-pdf': ['react-pdf'],
        },
      },
    },
  },
});
