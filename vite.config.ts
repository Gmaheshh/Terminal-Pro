import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: [
          '945bf41d-125e-4d5f-9fa9-2735479634f6.preview.emergentagent.com',
          '945bf41d-125e-4d5f-9fa9-2735479634f6.cluster-0.preview.emergentcf.cloud',
          '.emergentagent.com',
          '.emergentcf.cloud'
        ],
      },
      plugins: [react()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
