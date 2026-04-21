import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from '@config/env.js';
import { walletRoutes } from '@routes/walletRoutes.js';
import { atlasGoldRoutes } from '@routes/atlasGoldRoutes.js';
import { notificationRoutes } from '@routes/notificationRoutes.js';
import { strategyRoutes } from '@routes/strategyRoutes.js';
import { subscriptionRoutes } from '@routes/subscriptionRoutes.js';
import { exportRoutes } from '@routes/exportRoutes.js';
import { adminRoutes } from '@routes/adminRoutes.js';

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

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/health', async () => ({ status: 'ok' }));

// ---------------------------------------------------------------------------
// Register Agent 3 route modules
// ---------------------------------------------------------------------------

await app.register(walletRoutes);
await app.register(atlasGoldRoutes);
await app.register(notificationRoutes);
await app.register(strategyRoutes);
await app.register(subscriptionRoutes);
await app.register(exportRoutes);
await app.register(adminRoutes);

// ---------------------------------------------------------------------------
// Error handlers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 Server listening on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
