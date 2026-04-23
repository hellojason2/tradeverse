import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '@config/env.js';
import { startBalancePoller } from '@services/balancePollingService.js';
import { startTradeLogWorker } from '@services/tradeLogWorker.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  },
});

await app.register(cors, {
  origin: env.NODE_ENV === 'production' ? [/\.tradeverse\.app$/] : true,
  credentials: true,
});

await app.register(helmet, {
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
});

await app.register(rateLimit, {
  max: env.RATE_LIMIT_MAX,
  timeWindow: env.RATE_LIMIT_WINDOW_MS,
});

app.get('/health', async () => ({ status: 'ok' }));

// Auto-discover and register route plugins from src/routes/*.ts
async function registerRoutes() {
  const routesDir = join(__dirname, 'routes');
  let files: string[] = [];
  try {
    files = await readdir(routesDir);
  } catch {
    app.log.warn('No routes directory found');
    return;
  }

  for (const file of files) {
    if (file.endsWith('.ts') && !file.startsWith('_')) {
      const routePath = join(routesDir, file);
      try {
        const routeModule = await import(routePath);
        const plugin = routeModule.default;
        if (typeof plugin === 'function') {
          await app.register(plugin);
          app.log.info(`Registered routes from ${file}`);
        } else {
          app.log.warn(`Skipping ${file}: no default export function`);
        }
      } catch (err) {
        app.log.error({ err }, `Failed to register routes from ${file}`);
      }
    }
  }
}

await registerRoutes();

app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, 'Unhandled error in setErrorHandler');
  reply.status(500).send({
    success: false,
    error: { code: 'SYSTEM_ERROR', message: 'Something went wrong. We\'ve been notified.' },
  });
});

app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    success: false,
    error: { code: 'USER_INPUT', message: 'Route not found' },
  });
});

const start = async () => {
  try {
    startBalancePoller(app);
    startTradeLogWorker(app);

    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 Server listening on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
