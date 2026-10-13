import { defineConfig, loadEnv as viteLoadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import type { Plugin } from 'vite';
import { createApiApp } from './server/api';

const env = viteLoadEnv('development', process.cwd(), '');
for (const [key, value] of Object.entries(env)) {
  if (!process.env[key]) process.env[key] = value;
}

function expressPlugin(): Plugin {
  let apiApp: Awaited<ReturnType<typeof createApiApp>> | null = null;

  return {
    name: 'express-api',
    enforce: 'pre',
    configureServer: {
      order: 'pre',
      handler(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/api')) return next();
          if (!apiApp) {
            try {
              apiApp = await createApiApp();
            } catch (err) {
              console.error('Failed to start API server:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Server failed to start' }));
              return;
            }
          }
          apiApp(req as any, res as any, next);
        });
      },
    },
    configurePreviewServer: {
      order: 'pre',
      handler(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/api')) return next();
          if (!apiApp) {
            try {
              apiApp = await createApiApp();
            } catch (err) {
              console.error('Failed to start API server:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Server failed to start' }));
              return;
            }
          }
          apiApp(req as any, res as any, next);
        });
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
