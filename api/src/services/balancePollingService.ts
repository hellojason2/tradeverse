import type { FastifyInstance } from 'fastify';

/**
 * Stub — owned by Agent 2 (copy-engine).
 * Agent 1 wires this during bootstrap so server.ts builds and starts cleanly.
 * Agent 2 will replace with real CopyPro balance polling logic.
 */
export function startBalancePoller(_app?: FastifyInstance, _intervalMs?: number): NodeJS.Timeout {
  console.log('[BalancePoller] balance poller started');
  // Return a dummy interval so callers can clear it if needed.
  return setInterval(() => {}, 1_000_000);
}
