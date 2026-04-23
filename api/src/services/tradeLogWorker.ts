import type { FastifyInstance } from 'fastify';

/**
 * Stub — owned by Agent 2 (copy-engine).
 * Agent 1 wires this during bootstrap so server.ts builds and starts cleanly.
 * Agent 2 will replace with real CopyPro trade log polling logic.
 */
export function startTradeLogWorker(_app?: FastifyInstance, _intervalMs?: number): NodeJS.Timeout {
  console.log('[TradeLogWorker] trade log worker started');
  // Return a dummy interval so callers can clear it if needed.
  return setInterval(() => {}, 1_000_000);
}
