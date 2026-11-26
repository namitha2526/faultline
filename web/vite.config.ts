import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.BACKEND_URL || 'http://api:8000';
const wsTarget = process.env.BACKEND_WS_URL || 'ws://api:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/ws': {
        target: wsTarget,
        ws: true,
      },
    },
  },
});
